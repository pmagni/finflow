import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';
import { formatCurrency } from '@/utils/formatters';

const ExpenseChart = () => {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getExpensesByMonth();
        setMonthlyExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (Object.keys(monthlyExpenses).length > 0) {
      const processedData = prepareChartData();
      setChartData(processedData);
    }
  }, [monthlyExpenses]);
  
  const prepareChartData = () => {
    const data = Object.entries(monthlyExpenses).map(([month, categories]) => {
      const total = Object.values(categories).reduce((sum, amount) => {
        return sum + (amount as number);
      }, 0);
      
      // Convertir meses en inglés a español
      const [engMonth, year] = month.split(' ');
      const monthMap: {[key: string]: string} = {
        'Jan': 'ene', 'Feb': 'feb', 'Mar': 'mar', 'Apr': 'abr',
        'May': 'may', 'Jun': 'jun', 'Jul': 'jul', 'Aug': 'ago',
        'Sep': 'sep', 'Oct': 'oct', 'Nov': 'nov', 'Dec': 'dic'
      };
      
      const spanishMonth = monthMap[engMonth] || engMonth;
      
      // Valor numérico para ordenación
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(engMonth);
      const sortOrder = parseInt(year) * 100 + monthIndex;
      
      return {
        month: `${spanishMonth} ${year}`,
        sortOrder,
        ...categories,
        total
      };
    });
    
    // Ordenar cronológicamente (enero a diciembre)
    data.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Mostrar solo los últimos 6 meses o todos si hay menos
    return data.slice(-6);
  };
  
  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 mb-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Detalle Gastos Mensuales</h2>
        <div className="h-64 flex items-center justify-center">
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  const allCategories = Array.from(
    new Set(
      chartData.flatMap(data => 
        Object.keys(data).filter(key => key !== 'month' && key !== 'total' && key !== 'sortOrder')
      )
    )
  );
  
  // Colores más atractivos para las categorías
  const colors: { [key: string]: string } = {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    entertainment: '#FFD166',
    groceries: '#06D6A0',
    utilities: '#118AB2',
    gifts: '#EF476F',
    subscriptions: '#9381FF',
    vivienda: '#9D4EDD',
    comida: '#FF6B6B',
    transporte: '#4ECDC4',
    entretenimiento: '#FFD166',
    supermercado: '#06D6A0',
    servicios: '#118AB2',
    regalos: '#EF476F',
    suscripciones: '#9381FF',
    sueldo: '#3A86FF'
  };
  
  // Asignar colores a categorías que no tienen uno predefinido
  allCategories.forEach((category, index) => {
    if (!colors[category]) {
      // Generar colores en base al índice para categorías sin color asignado
      const hue = (index * 137) % 360; // Distribuir colores uniformemente
      colors[category] = `hsl(${hue}, 70%, 60%)`;
    }
  });
  
  const defaultColor = '#7EEBC6';
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="p-4 bg-finflow-card border border-gray-700 rounded-md shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-gray-400 mb-2">Total: {formatCurrency(total)}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs capitalize">{entry.name}: </span>
                </div>
                <span className="text-xs font-medium ml-1">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-finflow-card rounded-2xl p-5 mb-5 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Detalle Gastos Mensuales</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
            barGap={2}
            barSize={25}
            onMouseMove={(data) => {
              if (data.activeTooltipIndex !== undefined) {
                setActiveMonth(chartData[data.activeTooltipIndex]?.month || null);
              }
            }}
            onMouseLeave={() => setActiveMonth(null)}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `$${value/1000}k`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {allCategories.map((category) => (
              <Bar 
                key={category}
                dataKey={category}
                stackId="a"
                fill={colors[category] || defaultColor}
                radius={[0, 0, 4, 4]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fillOpacity={activeMonth === entry.month ? 1 : 0.8}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center mt-6">
        <div className="flex flex-wrap justify-center gap-3 max-w-xl">
          {allCategories.map((category) => (
            <div key={category} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: colors[category] || defaultColor }}
              />
              <span className="text-xs text-gray-400 capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;
