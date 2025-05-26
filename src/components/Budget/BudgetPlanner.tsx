import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Sector } from 'recharts';
import { getCategories } from '@/services/categoryService';
import { debtService } from '@/services/debtService';

// Tipos de datos para el presupuesto
interface FixedExpenses {
  arriendo?: number;
  luz?: number;
  agua?: number;
  internet?: number;
  seguros?: number;
  [key: string]: number | undefined;
}

interface VariableBudget {
  entretenimiento?: number;
  regalos?: number;
  [key: string]: number | undefined;
}

interface MonthlyBudget {
  id?: string;
  user_id?: string;
  month: string;
  total_income: number;
  fixed_expenses: FixedExpenses;
  debt_payments: number;
  savings_goal: number;
  variable_budget: VariableBudget;
  auto_generated: boolean;
  created_at?: string;
}

const pieColors = [
  '#118AB2', // Gastos fijos
  '#FF6B6B', // Deuda
  '#06D6A0', // Ahorro
  '#FFD166', // Variables
];

function getPieData(budget: MonthlyBudget) {
  return [
    {
      name: 'Gastos fijos',
      value: Object.values(budget.fixed_expenses).reduce((a, b) => a + (b || 0), 0),
    },
    {
      name: 'Gastos variables',
      value: Object.values(budget.variable_budget).reduce((a, b) => a + (b || 0), 0),
    },
    {
      name: 'Pagos de deuda',
      value: budget.debt_payments,
    },
    {
      name: 'Ahorro',
      value: budget.savings_goal,
    },
  ];
}

const BudgetPlanner: React.FC = () => {
  // Estado para saber si hay transacciones recientes
  const [hasRecentTransactions, setHasRecentTransactions] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Estado para el presupuesto generado o manual
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  // Estado para mostrar el formulario manual
  const [showManualForm, setShowManualForm] = useState(false);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Estados controlados para edición
  const [editBudget, setEditBudget] = useState<MonthlyBudget | null>(null);
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(null);

  // Estado para el formulario manual
  const [manualForm, setManualForm] = useState({
    total_income: '',
    fixed_expenses: {
      arriendo: '',
      luz: '',
      agua: '',
      internet: '',
      seguros: '',
    },
    debt_payments: '',
    savings_goal: '',
    variable_budget: {
      entretenimiento: '',
      regalos: '',
    },
  });

  // Estado para el sector activo
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Responsive: grillas a 1 columna en mobile, detalles colapsables
  const [showDetails, setShowDetails] = useState(false);

  const renderActiveShape = (props: any) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value
    } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius * 1.08}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#1A1A1A"
          strokeWidth={2}
          className="filter drop-shadow-lg"
        />
      </g>
    );
  };

  useEffect(() => {
    const fetchBudgetAndTransactions = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasRecentTransactions(false);
        setLoading(false);
        return;
      }
      // Obtener mes actual en formato YYYY-MM
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // --- PRIMERO: Consultar plan de deudas activo ---
      let debtPayments = 0;
      try {
        const { debtPlan } = await debtService.loadUserDebts(user.id);
        if (debtPlan && debtPlan.monthly_budget) {
          debtPayments = debtPlan.monthly_budget;
        }
      } catch (e) {
        debtPayments = 0;
      }

      // --- LUEGO: Buscar presupuesto guardado para este mes ---
      const { data: budgets, error: budgetError } = await (supabase as any)
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .limit(1)
        .maybeSingle();

      if (budgets) {
        // Si el pago de deuda cambió, actualiza el presupuesto mensual
        if (Math.round(budgets.debt_payments) !== Math.round(debtPayments)) {
          await (supabase as any)
            .from('monthly_budgets')
            .update({ debt_payments: Math.round(debtPayments) })
            .eq('id', budgets.id);
          // Actualiza el estado local también
          budgets.debt_payments = Math.round(debtPayments);
        }
        setCurrentBudget(budgets as MonthlyBudget);
        setLoading(false);
        return;
      }

      // Si no hay presupuesto guardado, buscar transacciones recientes
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const fromDate = threeMonthsAgo.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(name, icon, expense_type, transaction_type)')
        .eq('user_id', user.id)
        .gte('transaction_date', fromDate)
        .order('transaction_date', { ascending: false });
      if (error) {
        setHasRecentTransactions(false);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setTransactions(data as unknown as Transaction[]);
        setHasRecentTransactions(true);
        // Analizar transacciones y proponer presupuesto
        const smartBudget = await generateSmartBudget(data as unknown as Transaction[], user.id, debtPayments);
        setBudget(smartBudget);
      } else {
        setHasRecentTransactions(false);
        // Si no hay transacciones, igual generamos presupuesto con deuda si existe
        const smartBudget = await generateSmartBudget([], user.id, debtPayments);
        setBudget(smartBudget);
      }
      setLoading(false);
    };
    fetchBudgetAndTransactions();
  }, []);

  // Suscripción en tiempo real a cambios en el plan de deudas
  useEffect(() => {
    let subscription: any;
    let userId: string | null = null;
    let ignore = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      // Suscribirse a cambios en la tabla debt_plans para este usuario
      subscription = supabase
        .channel('debt-plans-budgets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debt_plans',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (ignore) return;
            // Cuando hay un cambio, recargar presupuesto automático
            setLoading(true);
            let debtPayments = 0;
            try {
              const { debtPlan } = await debtService.loadUserDebts(user.id);
              if (debtPlan && debtPlan.monthly_budget) {
                debtPayments = debtPlan.monthly_budget;
              }
            } catch (e) {
              debtPayments = 0;
            }
            // Recargar transacciones recientes
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const fromDate = threeMonthsAgo.toISOString().split('T')[0];
            const { data, error } = await supabase
              .from('transactions')
              .select('*, category:categories(name, icon, expense_type, transaction_type)')
              .eq('user_id', user.id)
              .gte('transaction_date', fromDate)
              .order('transaction_date', { ascending: false });
            if (!error && data && data.length > 0) {
              setTransactions(data as unknown as Transaction[]);
              setHasRecentTransactions(true);
              const smartBudget = await generateSmartBudget(data as unknown as Transaction[], user.id, debtPayments);
              setBudget(smartBudget);
            } else {
              setHasRecentTransactions(false);
              const smartBudget = await generateSmartBudget([], user.id, debtPayments);
              setBudget(smartBudget);
            }
            // --- Sincronización automática con la tabla de presupuesto mensual ---
            // Buscar si existe un presupuesto mensual para este usuario y mes
            const { data: existingBudget, error: budgetError } = await (supabase as any)
              .from('monthly_budgets')
              .select('*')
              .eq('user_id', user.id)
              .eq('month', currentMonth)
              .maybeSingle();
            if (existingBudget && !budgetError) {
              // Actualizar solo el campo debt_payments
              await (supabase as any)
                .from('monthly_budgets')
                .update({ debt_payments: Math.round(debtPayments) })
                .eq('id', existingBudget.id);
            }
            setLoading(false);
          }
        )
        .subscribe();
    })();
    return () => {
      ignore = true;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // --- Lógica de análisis automático ---
  async function generateSmartBudget(transactions: Transaction[], userId: string, debtPayments: number = 0): Promise<MonthlyBudget> {
    // 1. Ingreso promedio mensual
    const incomeTx = transactions.filter(t => t.type === 'income');
    const totalIncome = incomeTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const months = getUniqueMonths(transactions);
    const avgIncome = months.length > 0 ? totalIncome / months.length : 0;

    // 2. Obtener categorías fijas desde la base de datos
    const categories = await getCategories();
    const fixedCategories = categories
      .filter((cat: any) => cat.transaction_type === 'expense' && cat.expense_type === 'fixed')
      .map((cat: any) => cat.name.toLowerCase());

    // 3. Gastos fijos recurrentes (por categoría marcada como 'fijo')
    const expenseTx = transactions.filter(t => t.type === 'expense');
    const fixed_expenses: FixedExpenses = {};
    fixedCategories.forEach(cat => {
      // Buscar gastos con ese nombre de categoría
      const catTx = expenseTx.filter(t => t.category?.name?.toLowerCase() === cat);
      if (catTx.length > 0) {
        // Promedio mensual de ese gasto
        const total = catTx.reduce((sum, t) => sum + (t.amount || 0), 0);
        fixed_expenses[cat] = total / months.length;
      }
    });

    // 4. Pagos de deuda: usar el valor de debtPayments (del módulo de deudas)
    // Si no hay plan de deudas, será 0

    // 5. Gastos variables promedio (resto de gastos no fijos ni deuda)
    const variableTx = expenseTx.filter(t =>
      !fixedCategories.includes(t.category?.name?.toLowerCase() || '') &&
      t.category?.name?.toLowerCase() !== 'deuda' &&
      !t.description?.toLowerCase().includes('deuda')
    );
    // Agrupar por categoría
    const variable_budget: VariableBudget = {};
    variableTx.forEach(t => {
      const cat = t.category?.name?.toLowerCase() || 'otros';
      variable_budget[cat] = (variable_budget[cat] || 0) + (t.amount || 0) / months.length;
    });

    // 6. Sugerir ahorro (10-20% del ingreso promedio)
    const savings_goal = Math.round(avgIncome * 0.15);

    // 7. Mes actual
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return {
      user_id: userId,
      month,
      total_income: Math.round(avgIncome),
      fixed_expenses,
      debt_payments: Math.round(debtPayments),
      savings_goal,
      variable_budget,
      auto_generated: true,
    };
  }

  function getUniqueMonths(transactions: Transaction[]): string[] {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = t.transaction_date || t.created_at;
      if (date) {
        const d = new Date(date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        months.add(key);
      }
    });
    return Array.from(months);
  }

  // --- Guardar presupuesto en Supabase ---
  const handleSaveBudget = async () => {
    if (!budget && !editBudget) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const toSave = editBudget || budget;
    try {
      const { error } = await (supabase as any)
        .from('monthly_budgets')
        .upsert([
          {
            user_id: toSave?.user_id,
            month: toSave?.month,
            total_income: toSave?.total_income,
            fixed_expenses: toSave?.fixed_expenses,
            debt_payments: toSave?.debt_payments,
            savings_goal: toSave?.savings_goal,
            variable_budget: toSave?.variable_budget,
            auto_generated: toSave?.auto_generated,
          }
        ], { onConflict: ['user_id', 'month'] });
      if (error) throw error;
      setSuccessMsg('¡Presupuesto guardado exitosamente!');
      setEditing(false);
      setCurrentBudget(toSave);
    } catch (err) {
      setErrorMsg('Error al guardar el presupuesto: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // --- Render edición ---
  const handleEdit = () => {
    setEditBudget(budget ? { ...budget } : null);
    setEditing(true);
  };
  const handleEditChange = (field: keyof MonthlyBudget, value: any) => {
    if (!editBudget) return;
    setEditBudget({ ...editBudget, [field]: value });
  };
  const handleEditFixedExpense = (key: string, value: number) => {
    if (!editBudget) return;
    setEditBudget({
      ...editBudget,
      fixed_expenses: { ...editBudget.fixed_expenses, [key]: value },
    });
  };
  const handleEditVariableBudget = (key: string, value: number) => {
    if (!editBudget) return;
    setEditBudget({
      ...editBudget,
      variable_budget: { ...editBudget.variable_budget, [key]: value },
    });
  };

  const handleManualInput = (field: string, value: string) => {
    setManualForm({ ...manualForm, [field]: value });
  };
  const handleManualFixed = (key: string, value: string) => {
    setManualForm({
      ...manualForm,
      fixed_expenses: { ...manualForm.fixed_expenses, [key]: value },
    });
  };
  const handleManualVariable = (key: string, value: string) => {
    setManualForm({
      ...manualForm,
      variable_budget: { ...manualForm.variable_budget, [key]: value },
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg('Usuario no autenticado');
      setSaving(false);
      return;
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetToSave: MonthlyBudget = {
      user_id: user.id,
      month,
      total_income: Number(manualForm.total_income),
      fixed_expenses: Object.fromEntries(Object.entries(manualForm.fixed_expenses).map(([k, v]) => [k, Number(v)])),
      debt_payments: Number(manualForm.debt_payments),
      savings_goal: Number(manualForm.savings_goal),
      variable_budget: Object.fromEntries(Object.entries(manualForm.variable_budget).map(([k, v]) => [k, Number(v)])),
      auto_generated: false,
    };
    try {
      const { error } = await (supabase as any)
        .from('monthly_budgets')
        .upsert([budgetToSave], { onConflict: ['user_id', 'month'] });
      if (error) throw error;
      setSuccessMsg('¡Presupuesto guardado exitosamente!');
      setCurrentBudget(budgetToSave);
      setShowManualForm(false);
    } catch (err) {
      setErrorMsg('Error al guardar el presupuesto: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Función para mostrar etiquetas diferentes según el tamaño de pantalla
  const pieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (window.innerWidth < 600) {
      return `${(percent * 100).toFixed(0)}%`;
    }
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  // --- Feedback inteligente del sistema (Etapa 2) ---
  const ingreso = (currentBudget?.total_income ?? budget?.total_income) || 0;
  const ahorro = (currentBudget?.savings_goal ?? budget?.savings_goal) || 0;
  const deuda = (currentBudget?.debt_payments ?? budget?.debt_payments) || 0;

  let feedbacks: { color: string; icon: string; msg: string }[] = [];

  if (ingreso > 0) {
    const pctAhorro = Math.round((ahorro / ingreso) * 100);
    const pctDeuda = Math.round((deuda / ingreso) * 100);
    if (pctAhorro >= 10) {
      feedbacks.push({
        color: 'bg-finflow-mint text-black',
        icon: '✅',
        msg: `Estás ahorrando el ${pctAhorro}% de tus ingresos. ¡Buen trabajo!`,
      });
    } else if (pctAhorro > 0) {
      feedbacks.push({
        color: 'bg-yellow-400 text-black',
        icon: '⚠️',
        msg: `Tu ahorro es solo el ${pctAhorro}% de tus ingresos. Intenta aumentar tu meta de ahorro.`,
      });
    }
    if (pctDeuda >= 40) {
      feedbacks.push({
        color: 'bg-yellow-400 text-black',
        icon: '⚠️',
        msg: `Tus pagos de deuda representan el ${pctDeuda}% de tu ingreso. Prioriza reducir deudas para mejorar tu salud financiera.`,
      });
    } else if (pctDeuda > 0) {
      feedbacks.push({
        color: 'bg-finflow-mint text-black',
        icon: '✅',
        msg: `Tus pagos de deuda son el ${pctDeuda}% de tu ingreso. ¡Vas bien!`,
      });
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando presupuesto...</div>;
  }

  // Bloques de datos para la UI
  const resumenIngreso = (
    <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center mb-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'rgb(172 228 23)' }}>Ingreso total</h3>
      <span className="text-3xl font-bold text-white">{formatCurrency((currentBudget?.total_income ?? budget?.total_income) || 0)}</span>
    </div>
  );

  const distribucion = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {/* 1. Gastos Fijos */}
      <div className="bg-white/5 rounded-lg p-4 flex flex-col items-center">
        <span className="text-xs mb-1 font-semibold" style={{ color: 'rgb(172 228 23)' }}>Gastos Fijos</span>
        <span className="text-lg font-bold text-white">{formatCurrency(Object.values((currentBudget?.fixed_expenses ?? budget?.fixed_expenses) || {}).reduce((a, b) => a + (b || 0), 0))}</span>
        <button
          className="mt-2 text-xs text-finflow-mint underline block sm:hidden"
          onClick={() => setShowDetails(show => !show)}
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
        <ul className={`mt-2 text-xs text-gray-300 space-y-1 w-full ${showDetails ? '' : 'hidden'} sm:block`}> 
          {Object.entries((currentBudget?.fixed_expenses ?? budget?.fixed_expenses) || {}).map(([cat, val]) => (
            <li key={cat} className="flex justify-between"><span className="capitalize">{cat}</span><span>{formatCurrency(val || 0)}</span></li>
          ))}
        </ul>
      </div>
      {/* 2. Gastos Variables */}
      <div className="bg-white/5 rounded-lg p-4 flex flex-col items-center">
        <span className="text-xs mb-1 font-semibold" style={{ color: 'rgb(172 228 23)' }}>Gasto Variable</span>
        <span className="text-lg font-bold text-white">{formatCurrency(Object.values((currentBudget?.variable_budget ?? budget?.variable_budget) || {}).reduce((a, b) => a + (b || 0), 0))}</span>
        <button
          className="mt-2 text-xs text-finflow-mint underline block sm:hidden"
          onClick={() => setShowDetails(show => !show)}
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
        <ul className={`mt-2 text-xs text-gray-300 space-y-1 w-full ${showDetails ? '' : 'hidden'} sm:block`}>
          {Object.entries((currentBudget?.variable_budget ?? budget?.variable_budget) || {}).map(([cat, val]) => (
            <li key={cat} className="flex justify-between"><span className="capitalize">{cat}</span><span>{formatCurrency(val || 0)}</span></li>
          ))}
        </ul>
      </div>
      {/* 3. Pagos Deuda */}
      <div className="bg-white/5 rounded-lg p-4 flex flex-col items-center">
        <span className="text-xs mb-1 font-semibold" style={{ color: 'rgb(172 228 23)' }}>Pagos de Deuda</span>
        <span className="text-lg font-bold text-white">{formatCurrency((currentBudget?.debt_payments ?? budget?.debt_payments) || 0)}</span>
      </div>
      {/* 4. Ahorro */}
      <div className="bg-white/5 rounded-lg p-4 flex flex-col items-center">
        <span className="text-xs mb-1 font-semibold" style={{ color: 'rgb(172 228 23)' }}>Ahorro</span>
        <span className="text-lg font-bold text-white">{formatCurrency((currentBudget?.savings_goal ?? budget?.savings_goal) || 0)}</span>
      </div>
    </div>
  );

  const visualizacion = (
    <div className="flex flex-col items-center justify-center my-6">
      <ResponsiveContainer width="100%" minWidth={0} height={340}>
        <PieChart>
          <Pie
            data={getPieData(currentBudget || budget!)}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={70}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {getPieData(currentBudget || budget!).map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={pieColors[idx % pieColors.length]}
                stroke="#1A1A1A"
                strokeWidth={2}
                className="filter drop-shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            ))}
          </Pie>
          <RechartsTooltip formatter={formatCurrency} />
          <Legend align="center" verticalAlign="bottom" iconType="circle"/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  // Botón más grande en mobile
  const editarBtn = (
    <div className="flex justify-end mt-6">
      <button className="bg-finflow-mint text-black px-6 py-3 rounded font-semibold w-full sm:w-auto text-base sm:text-sm" onClick={() => setEditing(true)}>
        Editar presupuesto
      </button>
    </div>
  );

  // Feedback: cards apiladas en mobile, 2 columnas en md+
  const feedbackSistema = (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {feedbacks.length === 0 && (
        <div className="bg-gray-800 text-gray-200 px-4 py-4 rounded-xl shadow text-sm text-center">No hay insights para mostrar.</div>
      )}
      {feedbacks.map((f, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-4 rounded-xl shadow text-base font-medium ${f.color}`}
        >
          <span className="text-2xl">{f.icon}</span>
          <span>{f.msg}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-finflow-card rounded-2xl p-4 sm:p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'rgb(172 228 23)' }}>Presupuesto Mensual</h2>
      {/* 1. Resumen de Ingresos */}
      {resumenIngreso}
      {/* 2. Distribución del Presupuesto */}
      {distribucion}
      {/* 3. Visualización */}
      {visualizacion}
      {/* 4. Feedback del sistema */}
      {feedbackSistema}
      {/* Botón de edición */}
      {editarBtn}
    </div>
  );
};

export default BudgetPlanner; 