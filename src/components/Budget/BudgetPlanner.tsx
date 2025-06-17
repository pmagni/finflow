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

// Colores modernos con gradientes
const pieColors = [
  '#00B3FF', // Gastos fijos - Azul vibrante
  '#FF6B6B', // Deuda - Rojo coral
  '#06D6A0', // Ahorro - Verde mint
  '#FFD166', // Variables - Amarillo dorado
];

// Colores para hover (más brillantes)
const pieHoverColors = [
  '#33C3FF', // Azul más claro
  '#FF8E8E', // Rojo más claro  
  '#2ADEB8', // Verde más claro
  '#FFE699', // Amarillo más claro
];

function getPieData(budget: MonthlyBudget) {
  return [
    {
      name: 'Gastos fijos',
      value: Object.values(budget.fixed_expenses).reduce((a, b) => a + (b || 0), 0),
      icon: '🏠',
    },
    {
      name: 'Gastos variables', 
      value: Object.values(budget.variable_budget).reduce((a, b) => a + (b || 0), 0),
      icon: '🛍️',
    },
    {
      name: 'Pagos de deuda',
      value: budget.debt_payments,
      icon: '💳',
    },
    {
      name: 'Ahorro',
      value: budget.savings_goal,
      icon: '💰',
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

  // Estados para animaciones e interactividad del gráfico
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [chartAnimated, setChartAnimated] = useState(false);

  // Responsive: grillas a 1 columna en mobile, detalles colapsables
  const [showDetails, setShowDetails] = useState(false);

  // Función mejorada para el sector activo con animación y efecto glow
  const renderActiveShape = (props: any) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value
    } = props;
    
    return (
      <g>
        {/* Efecto glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Sector expandido */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius * 1.12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#1A1A1A"
          strokeWidth={3}
          filter="url(#glow)"
          style={{
            transition: 'all 0.3s ease-in-out',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
        
        {/* Línea hacia el centro para conectar */}
        <line
          x1={cx + (outerRadius * 1.15) * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180)}
          y1={cy + (outerRadius * 1.15) * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180)}
          x2={cx + (outerRadius * 0.8) * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180)}
          y2={cy + (outerRadius * 0.8) * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180)}
          stroke={fill}
          strokeWidth={2}
          opacity={0.8}
        />
        
        {/* Texto mejorado */}
        <text
          x={cx + (outerRadius * 1.25) * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180)}
          y={cy + (outerRadius * 1.25) * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-semibold text-sm drop-shadow-lg"
        >
          {`${formatCurrency(value)}`}
        </text>
        <text
          x={cx + (outerRadius * 1.25) * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180)}
          y={cy + (outerRadius * 1.25) * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180) + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-300 text-xs"
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{data.payload.icon}</span>
            <h3 className="text-white font-semibold">{data.payload.name}</h3>
          </div>
          <p className="text-finflow-mint font-bold text-lg">{formatCurrency(data.value)}</p>
          <p className="text-gray-400 text-sm">
            {((data.value / getPieData(currentBudget || budget!).reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Componente de leyenda personalizada
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
              hoveredIndex === index ? 'bg-white/10 scale-105' : 'bg-white/5'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white text-sm font-medium">{entry.value}</span>
            <span className="text-2xl">{getPieData(currentBudget || budget!)[index]?.icon}</span>
          </div>
        ))}
      </div>
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
        // Trigger animación después de un pequeño delay
        setTimeout(() => setChartAnimated(true), 300);
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
      // Trigger animación después de un pequeño delay
      setTimeout(() => setChartAnimated(true), 300);
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
    return (
      <div className="bg-finflow-card rounded-2xl p-4 sm:p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-24 bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-700 rounded"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Bloques de datos para la UI
  const resumenIngreso = (
    <div className="bg-gradient-to-br from-finflow-mint/10 to-finflow-mint/5 border border-finflow-mint/20 rounded-xl p-6 flex flex-col items-center mb-4 backdrop-blur-sm">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'rgb(172 228 23)' }}>💰 Ingreso total</h3>
      <span className="text-3xl font-bold text-white animate-fade-in">{formatCurrency((currentBudget?.total_income ?? budget?.total_income) || 0)}</span>
    </div>
  );

  const distribucion = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {/* 1. Gastos Fijos */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-all duration-300">
        <span className="text-xs mb-1 font-semibold text-blue-300 flex items-center gap-1">
          🏠 Gastos Fijos
        </span>
        <span className="text-lg font-bold text-white">{formatCurrency(Object.values((currentBudget?.fixed_expenses ?? budget?.fixed_expenses) || {}).reduce((a, b) => a + (b || 0), 0))}</span>
        <button
          className="mt-2 text-xs text-blue-300 underline block sm:hidden"
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
      <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-all duration-300">
        <span className="text-xs mb-1 font-semibold text-yellow-300 flex items-center gap-1">
          🛍️ Gasto Variable
        </span>
        <span className="text-lg font-bold text-white">{formatCurrency(Object.values((currentBudget?.variable_budget ?? budget?.variable_budget) || {}).reduce((a, b) => a + (b || 0), 0))}</span>
        <button
          className="mt-2 text-xs text-yellow-300 underline block sm:hidden"
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
      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-all duration-300">
        <span className="text-xs mb-1 font-semibold text-red-300 flex items-center gap-1">
          💳 Pagos de Deuda
        </span>
        <span className="text-lg font-bold text-white">{formatCurrency((currentBudget?.debt_payments ?? budget?.debt_payments) || 0)}</span>
      </div>
      {/* 4. Ahorro */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-all duration-300">
        <span className="text-xs mb-1 font-semibold text-green-300 flex items-center gap-1">
          💰 Ahorro
        </span>
        <span className="text-lg font-bold text-white">{formatCurrency((currentBudget?.savings_goal ?? budget?.savings_goal) || 0)}</span>
      </div>
    </div>
  );

  const visualizacion = (
    <div className="relative flex flex-col items-center justify-center my-6">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-finflow-mint/5 to-transparent rounded-3xl"></div>
      
      {/* Contenedor del gráfico con animación de entrada */}
      <div className={`relative transition-all duration-1000 ${chartAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <ResponsiveContainer width="100%" minWidth={0} height={380}>
          <PieChart>
            <defs>
              {/* Gradientes para cada sector */}
              <linearGradient id="gradient-0" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00B3FF" stopOpacity={1}/>
                <stop offset="100%" stopColor="#0080CC" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD166" stopOpacity={1}/>
                <stop offset="100%" stopColor="#FFC233" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" stopOpacity={1}/>
                <stop offset="100%" stopColor="#FF5252" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06D6A0" stopOpacity={1}/>
                <stop offset="100%" stopColor="#04B87D" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <Pie
              data={getPieData(currentBudget || budget!)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={75}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, idx) => {
                setActiveIndex(idx);
                setHoveredIndex(idx);
              }}
              onMouseLeave={() => {
                setActiveIndex(null);
                setHoveredIndex(null);
              }}
              animationBegin={200}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {getPieData(currentBudget || budget!).map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={`url(#gradient-${idx})`}
                  stroke="rgba(26, 26, 26, 0.8)"
                  strokeWidth={3}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                  style={{
                    filter: hoveredIndex === idx ? 'brightness(1.1) drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none',
                  }}
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Estadística central */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Asignado</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(getPieData(currentBudget || budget!).reduce((sum, item) => sum + item.value, 0))}
          </p>
        </div>
      </div>
    </div>
  );

  // Botón más grande en mobile
  const editarBtn = (
    <div className="flex justify-end mt-6">
      <button 
        className="bg-gradient-to-r from-finflow-mint to-finflow-mint/80 hover:from-finflow-mint/90 hover:to-finflow-mint text-black px-6 py-3 rounded-lg font-semibold w-full sm:w-auto text-base sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-finflow-mint/20" 
        onClick={() => setEditing(true)}
      >
        ✏️ Editar presupuesto
      </button>
    </div>
  );

  // Feedback: cards apiladas en mobile, 2 columnas en md+
  const feedbackSistema = (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {feedbacks.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-700 text-gray-200 px-4 py-4 rounded-xl shadow text-sm text-center backdrop-blur-sm">
          📊 No hay insights para mostrar.
        </div>
      )}
      {feedbacks.map((f, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-4 rounded-xl shadow-lg border border-opacity-20 text-base font-medium transition-all duration-300 hover:scale-105 ${f.color}`}
        >
          <span className="text-2xl">{f.icon}</span>
          <span>{f.msg}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-finflow-card rounded-2xl p-4 sm:p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'rgb(172 228 23)' }}>📊 Presupuesto Mensual</h2>
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