import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';

const ExpenseChart = () => {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 mb-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Monthly Expenses</h2>
        <div className="h-64 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(monthlyExpenses).map(([month, categories]) => {
    const total = Object.values(categories).reduce((sum, amount) => {
      return sum + (amount as number);
    }, 0);
    return {
      month,
      ...categories,
      total
    };
  });
  
  chartData.sort((a, b) => {
    const [aMonth, aYear] = a.month.split(' ');
    const [bMonth, bYear] = b.month.split(' ');
    
    if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(aMonth) - months.indexOf(bMonth);
  });
  
  const allCategories = Array.from(
    new Set(
      chartData.flatMap(data => 
        Object.keys(data).filter(key => key !== 'month' && key !== 'total')
      )
    )
  );
  
  const colors: { [key: string]: string } = {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    entertainment: '#FFD166',
    groceries: '#06D6A0',
    utilities: '#118AB2',
    gifts: '#EF476F',
    subscriptions: '#9381FF'
  };
  
  const defaultColor = '#7EEBC6';
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-finflow-card border border-gray-700 rounded-md shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-xs capitalize">{entry.name}: </span>
                <span className="text-xs font-medium ml-1">${entry.value}</span>
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
      <h2 className="text-lg font-bold mb-4">Monthly Expenses</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
      
      <div className="flex justify-center mt-4">
        <div className="flex flex-wrap justify-center gap-3">
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
