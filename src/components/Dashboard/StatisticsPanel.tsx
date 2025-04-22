import React, { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import { getTransactionsByMonth, MonthlyTransactionSummary } from '@/services/transactionService';
import { formatCurrency } from '@/utils/formatters';
import { ChevronDown, PieChart as PieChartIcon, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

const StatisticsPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlyTransactionSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

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

  // Preparar datos para gráfico de torta de gastos
  const prepareExpenseChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.expenses.byCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / summary.expenses.total) * 100).toFixed(0)
    }));
  };

  const expenseChartData = prepareExpenseChartData();

  // Generar colores para las categorías
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28',
    '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#a4a1fb', '#d6b0ff'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-3 bg-finflow-card border border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold capitalize">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-400">{data.payload.percentage}% del total</p>
        </div>
      );
    }
    return null;
  };

  // Obtener el nombre del mes seleccionado
  const getSelectedMonthLabel = () => {
    const date = new Date(selectedDate.year, selectedDate.month - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Capitalizar primera letra
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Detalle Gastos Mensuales</h2>
        <div className="flex items-center justify-center p-4 h-64">
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Detalle Gastos Mensuales</h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Calendar size={16} />
              <span className="capitalize">{capitalize(getSelectedMonthLabel())}</span>
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
            {summary?.availableMonths.map((date) => (
              <DropdownMenuItem 
                key={`${date.year}-${date.month}`}
                className={`cursor-pointer hover:bg-gray-700 ${
                  selectedDate.month === date.month && selectedDate.year === date.year 
                    ? 'bg-gray-700' 
                    : ''
                }`}
                onClick={() => setSelectedDate({ month: date.month, year: date.year })}
              >
                {date.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Ingresos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 rounded-xl p-4"
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm text-gray-400">Ingresos</h3>
            <span className="bg-green-900/30 rounded-full p-1">
              <ArrowUp size={16} className="text-green-400" />
            </span>
          </div>
          <p className="text-xl font-bold text-green-400">
            {formatCurrency(summary?.income.total || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {Object.keys(summary?.income.byCategory || {}).length} categorías
          </p>
        </motion.div>
        
        {/* Gastos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gray-900 rounded-xl p-4"
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm text-gray-400">Gastos</h3>
            <span className="bg-red-900/30 rounded-full p-1">
              <ArrowDown size={16} className="text-red-400" />
            </span>
          </div>
          <p className="text-xl font-bold text-red-400">
            {formatCurrency(summary?.expenses.total || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {Object.keys(summary?.expenses.byCategory || {}).length} categorías
          </p>
        </motion.div>
        
        {/* Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-900 rounded-xl p-4"
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm text-gray-400">Balance</h3>
            <span className={`${summary && summary.balance >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'} rounded-full p-1`}>
              {summary && summary.balance >= 0 ? (
                <ArrowUp size={16} className="text-green-400" />
              ) : (
                <ArrowDown size={16} className="text-red-400" />
              )}
            </span>
          </div>
          <p className={`text-xl font-bold ${summary && summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Balance del mes
          </p>
        </motion.div>
      </div>
      
      {/* Gráfico de torta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72">
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon size={32} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400">No hay datos de gastos para este mes</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="font-medium text-sm border-b border-gray-700 pb-2">Detalle por categoría</h3>
          
          {expenseChartData.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {expenseChartData
                .sort((a, b) => b.value - a.value)
                .map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize text-sm">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(category.value)}</div>
                      <div className="text-xs text-gray-400">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay categorías para mostrar</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel; 