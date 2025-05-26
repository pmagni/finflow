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

const COLORS = ['#00B3FF', '#FF5C5C', '#00FFB2', '#FFD466'];

const BudgetPlannerEnhanced = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);

  useEffect(() => {
    const fetchBudget = async () => {
      setIsLoading(true);

      if (!user?.id) return;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: budgetData, error } = await (supabase as any)
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      const budget = budgetData as Database['public']['Tables']['monthly_budgets']['Row'];

      if (error || !budget) {
        setIsLoading(false);
        return;
      }

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
    };

    fetchBudget();
  }, [user]);

  const getPercentage = (value: number) =>
    totalIncome ? `${Math.round((value / totalIncome) * 100)}%` : '0%';

  if (isLoading) {
    return <p className="text-white text-sm">Cargando presupuesto...</p>;
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
        <p className="text-sm text-green-400">✔ Presupuesto cargado correctamente.</p>
      </div>

      <div className="flex justify-end">
        <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm">
          Editar presupuesto
        </button>
      </div>
    </div>
  );
};

export default function IndexPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 py-8">
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
          <BudgetPlanner />
        </div>
        <div className="md:col-span-1">
          <FinancialHealth />
        </div>
      </div>
    </div>
  );
}
