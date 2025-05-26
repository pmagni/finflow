import React, { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { getTransactionsByMonth, MonthlyTransactionSummary } from '@/services/transactionService';
import { formatCurrency } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28',
  '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#a4a1fb', '#d6b0ff'
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const StatisticsPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlyTransactionSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [view, setView] = useState<'line' | 'pie'>('line');
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ month: string, total: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getTransactionsByMonth(selectedDate.month, selectedDate.year);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching monthly transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate.month, selectedDate.year]);

  useEffect(() => {
    const fetchMonthlyExpenses = async () => {
      const data = await getExpensesByMonth();
      const chartData = Object.entries(data).map(([month, categories]) => {
        let label = month;
        const match = month.match(/^(\d{4})-(\d{2})$/);
        if (match) {
          const year = match[1];
          const monthIdx = parseInt(match[2], 10) - 1;
          label = `${MONTHS[monthIdx].toLowerCase()} ${year}`;
        }
        return {
          month: label,
          total: Object.values(categories).reduce((sum, value) => sum + value, 0)
        };
      });
      setMonthlyExpenses(chartData.reverse());
    };
    fetchMonthlyExpenses();
  }, []);

  const prepareExpenseChartData = () => {
    if (!summary) return [];
    return Object.entries(summary.expenses.byCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / summary.expenses.total) * 100).toFixed(0)
    }));
  };

  const expenseChartData = prepareExpenseChartData();

  // Selección automática de la categoría de mayor porcentaje
  useEffect(() => {
    if (expenseChartData.length > 0) {
      const max = expenseChartData.reduce((prev, curr) => Number(curr.percentage) > Number(prev.percentage) ? curr : prev, expenseChartData[0]);
      setSelectedCategory(max);
    } else {
      setSelectedCategory(null);
    }
  }, [summary]);

  const handlePieClick = (_: any, index: number) => {
    setSelectedCategory(expenseChartData[index]);
  };

  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Mis Gastos</h2>
        <div className="flex items-center justify-center p-4 h-64">
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Mis Gastos</h2>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <label className="text-sm text-gray-400 mr-2">Mes:</label>
        <select
          className="rounded-md bg-gray-800 text-white px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-finflow-mint"
          value={selectedDate.month}
          onChange={e => setSelectedDate(prev => ({ ...prev, month: Number(e.target.value) }))}
        >
          {MONTHS.map((name, idx) => (
            <option key={name} value={idx + 1}>{name}</option>
          ))}
        </select>
        <label className="text-sm text-gray-400 ml-4 mr-2">Año:</label>
        <select
          className="rounded-md bg-gray-800 text-white px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-finflow-mint"
          value={selectedDate.year}
          onChange={e => setSelectedDate(prev => ({ ...prev, year: Number(e.target.value) }))}
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          className={`rounded-md text-sm font-medium h-10 px-4 py-2 border transition-colors ${view === 'line' ? 'bg-gray-700 text-white border-finflow-mint' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
          onClick={() => setView('line')}
        >
          Evolución mensual
        </button>
        <button
          className={`rounded-md text-sm font-medium h-10 px-4 py-2 border transition-colors ${view === 'pie' ? 'bg-gray-700 text-white border-finflow-mint' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
          onClick={() => setView('pie')}
        >
          Por categoría
        </button>
      </div>
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          {view === 'line' ? (
            <LineChart
              data={monthlyExpenses.slice(-6)}
              margin={{ top: 30, right: 30, left: 80, bottom: 50 }}
            >
              <XAxis
                dataKey="month"
                tick={{ fill: '#bdbdbd', fontSize: 13 }}
                interval={0}
                minTickGap={0}
                angle={-35}
                dy={10}
                textAnchor="end"
              />
              <YAxis hide />
              <Tooltip formatter={formatCurrency} labelStyle={{ color: '#fff' }} contentStyle={{ background: '#222', border: '1px solid #444' }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#7EEBC6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#7EEBC6', stroke: '#222', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          ) : (
            <PieChart className="recharts-surface">
              <Pie
                data={expenseChartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                onClick={handlePieClick}
                isAnimationActive={false}
              >
                {expenseChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#1A1A1A"
                    strokeWidth={2}
                    cursor="pointer"
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
        {view === 'pie' && selectedCategory && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
            <div className="text-lg font-bold text-white">{selectedCategory.name}</div>
            <div className="text-2xl font-extrabold text-finflow-mint">{selectedCategory.percentage}%</div>
            <div className="text-sm text-gray-400">{formatCurrency(selectedCategory.value)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel; 