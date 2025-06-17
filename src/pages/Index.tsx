import React, { useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import StatisticsPanel from '@/components/Dashboard/StatisticsPanel';
import TransactionList from '@/components/ExpenseOverview/TransactionList';
import FinancialHealth from '@/components/ExpenseOverview/FinancialHealth';
import BudgetPlanner from '@/components/Budget/BudgetPlanner';
import { getFinancialContextForAssistant } from '@/services/transactionService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getCategories } from '@/services/categoryService';

const COLORS = ['#00B3FF', '#FF5C5C', '#00FFB2', '#FFD466'];

interface BudgetEntry {
  name: string;
  value: number;
}

const BudgetPlannerEnhanced = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<BudgetEntry[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [budgetRaw, setBudgetRaw] = useState<any>(null);

  // NUEVO: Estados para fallback inteligente
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchBudget = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setGenerating(false);

      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 1. Intentar cargar presupuesto guardado
      const { data: budgetData, error } = await (supabase as any)
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      const budget = budgetData as Database['public']['Tables']['monthly_budgets']['Row'];
      setBudgetRaw(budget);

      if (budget && !error) {
        const fixed = budget.fixed_expenses 
          ? Object.values(budget.fixed_expenses as Record<string, number>).reduce((a, b) => a + Number(b), 0)
          : 0;
        const variable = budget.variable_budget 
          ? Object.values(budget.variable_budget as Record<string, number>).reduce((a, b) => a + Number(b), 0)
          : 0;
        const entries = [
          { name: 'Gastos fijos', value: fixed },
          { name: 'Pagos de deuda', value: budget.debt_payments || 0 },
          { name: 'Ahorro', value: budget.savings_goal || 0 },
          { name: 'Gastos variables', value: variable },
        ];
        setTotalIncome(budget.total_income || 0);
        setData(entries);
        setIsLoading(false);
        return;
      }

      // 2. Si no hay presupuesto, intentar generar uno inteligente
      setGenerating(true);
      try {
        // Buscar transacciones recientes (últimos 3 meses)
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const fromDate = threeMonthsAgo.toISOString().split('T')[0];
        const { data: txs, error: txError } = await supabase
          .from('transactions')
          .select('*, category:categories(name, icon, expense_type, transaction_type)')
          .eq('user_id', user.id)
          .gte('transaction_date', fromDate)
          .order('transaction_date', { ascending: false });
        if (txError) throw txError;
        if (txs && txs.length > 0) {
          // Obtener categorías fijas
          const categories = await getCategories();
          const fixedCategories = categories
            .filter((cat: any) => cat.transaction_type === 'expense' && cat.expense_type === 'fixed')
            .map((cat: any) => cat.name.toLowerCase());
          // Gastos fijos
          const expenseTx = txs.filter((t: any) => t.type === 'expense');
          const fixed_expenses: Record<string, number> = {};
          fixedCategories.forEach(cat => {
            const catTx = expenseTx.filter((t: any) => t.category?.name?.toLowerCase() === cat);
            if (catTx.length > 0) {
              const total = catTx.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
              fixed_expenses[cat] = total / 3; // Promedio 3 meses
            }
          });
          // Gastos variables
          const variableTx = expenseTx.filter((t: any) =>
            !fixedCategories.includes(t.category?.name?.toLowerCase() || '') &&
            t.category?.name?.toLowerCase() !== 'deuda' &&
            !t.description?.toLowerCase().includes('deuda')
          );
          const variable_budget: Record<string, number> = {};
          variableTx.forEach((t: any) => {
            const cat = t.category?.name?.toLowerCase() || 'otros';
            variable_budget[cat] = (variable_budget[cat] || 0) + (t.amount || 0) / 3;
          });
          // Ingreso promedio
          const incomeTx = txs.filter((t: any) => t.type === 'income');
          const totalIncome = incomeTx.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          const avgIncome = totalIncome / 3;
          // Sugerir ahorro
          const savings_goal = Math.round(avgIncome * 0.15);
          // Pagos de deuda (no disponible aquí, poner 0)
          const debt_payments = 0;
          // Crear presupuesto sugerido
          const smartBudget = {
            user_id: user.id,
            month: currentMonth,
            total_income: Math.round(avgIncome),
            fixed_expenses,
            variable_budget,
            debt_payments,
            savings_goal,
            auto_generated: true,
          };
          // Guardar en Supabase
          await (supabase as any)
            .from('monthly_budgets')
            .upsert([smartBudget], { onConflict: ['user_id', 'month'] });
          // Actualizar estado
          setBudgetRaw(smartBudget);
          const fixed = Object.values(fixed_expenses).reduce((a, b) => a + Number(b), 0);
          const variable = Object.values(variable_budget).reduce((a, b) => a + Number(b), 0);
          const entries = [
            { name: 'Gastos fijos', value: fixed },
            { name: 'Pagos de deuda', value: debt_payments },
            { name: 'Ahorro', value: savings_goal },
            { name: 'Gastos variables', value: variable },
          ];
          setTotalIncome(Math.round(avgIncome));
          setData(entries);
          setIsLoading(false);
          setGenerating(false);
          return;
        } else {
          setError('No hay presupuesto ni transacciones suficientes para sugerir uno.');
        }
      } catch (e: any) {
        setError('Error al generar presupuesto: ' + (e?.message || e));
      }
      setIsLoading(false);
      setGenerating(false);
    };
    fetchBudget();
  }, [user, showEdit]);

  const getPercentage = (value: number) =>
    totalIncome ? `${Math.round((value / totalIncome) * 100)}%` : '0%';

  const handleOpenEdit = () => {
    if (!budgetRaw) return;
    setEditForm({
      total_income: budgetRaw.total_income || 0,
      fixed_expenses: { ...(budgetRaw.fixed_expenses || {}) },
      variable_budget: { ...(budgetRaw.variable_budget || {}) },
      debt_payments: budgetRaw.debt_payments || 0,
      savings_goal: budgetRaw.savings_goal || 0,
    });
    setShowEdit(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditFixed = (key: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      fixed_expenses: { ...prev.fixed_expenses, [key]: value },
    }));
  };

  const handleEditVariable = (key: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      variable_budget: { ...prev.variable_budget, [key]: value },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const { error } = await (supabase as any)
        .from('monthly_budgets')
        .upsert([
          {
            user_id: user.id,
            month: currentMonth,
            total_income: Number(editForm.total_income),
            fixed_expenses: Object.fromEntries(Object.entries(editForm.fixed_expenses).map(([k, v]) => [k, Number(v)])),
            variable_budget: Object.fromEntries(Object.entries(editForm.variable_budget).map(([k, v]) => [k, Number(v)])),
            debt_payments: Number(editForm.debt_payments),
            savings_goal: Number(editForm.savings_goal),
            auto_generated: false,
          },
        ], { onConflict: ['user_id', 'month'] });
      if (error) throw error;
      setSuccess('¡Presupuesto actualizado!');
      setShowEdit(false);
    } catch (err: any) {
      setError('Error al guardar: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-white text-sm">Cargando presupuesto...</p>;
  }

  if (error === 'No hay presupuesto ni transacciones suficientes para sugerir uno.') {
    return (
      <div className="text-center text-red-400 text-sm mt-4">
        <p>No hay datos suficientes para sugerir un presupuesto.</p>
        <p className="text-white mt-2">Por favor, registra tus ingresos y gastos recientes para que podamos ayudarte a definir tu presupuesto mensual.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Planificador de Presupuesto Mensual</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-800 p-4 rounded-md">
          <h3 className="text-sm text-gray-400">Ingreso total</h3>
          <p className="text-xl font-bold text-white">{formatCurrency(totalIncome)}</p>
        </div>
        {data.map((item, index) => (
          <div key={item.name} className="bg-zinc-800 p-4 rounded-md">
            <h3 className="text-sm text-gray-400">{item.name}</h3>
            <p className="text-xl font-bold text-white">
              {formatCurrency(item.value)} <span className="text-sm text-gray-400">({getPercentage(item.value)})</span>
            </p>
          </div>
        ))}
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              innerRadius={60}
              label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        {success && <p className="text-green-400 text-sm">{success}</p>}
        {!success && <p className="text-sm text-green-400">✔ Presupuesto cargado correctamente.</p>}
      </div>

      <div className="flex justify-end">
        <button
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm"
          aria-label="Editar presupuesto mensual"
          onClick={handleOpenEdit}
        >
          Editar presupuesto mensual
        </button>
      </div>

      {/* Modal de edición */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar presupuesto mensual</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Ingreso total</Label>
                <Input
                  type="number"
                  value={editForm.total_income}
                  onChange={e => handleEditChange('total_income', e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <Label>Gastos fijos</Label>
                {Object.entries(editForm.fixed_expenses).map(([k, v]: any) => (
                  <div key={k} className="flex gap-2 items-center mb-1">
                    <span className="capitalize w-28">{k}</span>
                    <Input
                      type="number"
                      value={v}
                      min={0}
                      onChange={e => handleEditFixed(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Gastos variables</Label>
                {Object.entries(editForm.variable_budget).map(([k, v]: any) => (
                  <div key={k} className="flex gap-2 items-center mb-1">
                    <span className="capitalize w-28">{k}</span>
                    <Input
                      type="number"
                      value={v}
                      min={0}
                      onChange={e => handleEditVariable(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Pagos de deuda</Label>
                <Input
                  type="number"
                  value={editForm.debt_payments}
                  min={0}
                  onChange={e => handleEditChange('debt_payments', e.target.value)}
                />
              </div>
              <div>
                <Label>Ahorro</Label>
                <Input
                  type="number"
                  value={editForm.savings_goal}
                  min={0}
                  onChange={e => handleEditChange('savings_goal', e.target.value)}
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UserBalanceHeader = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nombre, setNombre] = useState<string>('Usuario');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Este efecto depende de 'user'. Si el usuario cambia, se recarga el nombre mostrado.
    const fetchNombre = async () => {
      if (!user?.id) {
        setNombre(user?.email ? user.email : 'Usuario');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('id', user.id)
          .single();
        if (error || !data?.user_name) {
          setNombre(user?.email ? user.email : 'Usuario');
        } else {
          setNombre(data.user_name);
        }
      } catch {
        setNombre(user?.email ? user.email : 'Usuario');
      }
    };
    fetchNombre();
  }, [user]);

  useEffect(() => {
    // Este efecto depende de 'user'. Si el usuario cambia, se recarga el balance.
    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ctx = await getFinancialContextForAssistant();
        setBalance(ctx.currentBalance);
      } catch (e) {
        setBalance(null);
        setError('Error al cargar el balance.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, [user]);

  return (
    <div className="bg-zinc-900 rounded-xl p-6 mb-4 flex flex-col md:flex-row md:items-center md:justify-between animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Hola {nombre}!</h1>
        <p className="text-gray-400 text-sm">Este es tu balance actual acumulado:</p>
      </div>
      <div className="mt-4 md:mt-0">
        {isLoading ? (
          <span className="text-white text-lg">Cargando balance...</span>
        ) : error ? (
          <span className="text-red-400 text-lg">{error}</span>
        ) : balance === null ? (
          <span className="text-gray-400 text-lg">Sin datos de balance.</span>
        ) : (
          <span className="text-3xl font-extrabold text-finflow-mint">{formatCurrency(balance)}</span>
        )}
      </div>
    </div>
  );
};

export default function IndexPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 py-8">
      {/* Fila Balance y saludo */}
      <UserBalanceHeader />
      {/* Fila 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <StatisticsPanel />
        </div>
        <div className="md:col-span-1">
          <TransactionList />
        </div>
      </div>
      {/* Fila 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <BudgetPlannerEnhanced />
        </div>
        <div className="md:col-span-1">
          <FinancialHealth />
        </div>
      </div>
    </div>
  );
}
