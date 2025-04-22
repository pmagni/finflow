import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  [key: string]: number | string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataPoint;
  }>;
}

const ExpenseChart = () => {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const monthsPerPage = 3;
  
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
  
  const prepareChartData = useCallback(() => {
    if (Object.keys(monthlyExpenses).length === 0) return [];
    
    return Object.entries(monthlyExpenses).map(([month, categories]) => ({
      month,
      ...categories
    }));
  }, [monthlyExpenses]);

  const chartData = useMemo(() => prepareChartData(), [prepareChartData]);

  const visibleData = useMemo(() => {
    const startIndex = currentPage * monthsPerPage;
    return chartData.slice(startIndex, startIndex + monthsPerPage);
  }, [chartData, currentPage, monthsPerPage]);

  useEffect(() => {
    if (chartData.length > 0) {
      const pages = Math.ceil(chartData.length / monthsPerPage);
      setTotalPages(pages);
      setCurrentPage(0);
    }
  }, [chartData.length, monthsPerPage]);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    chartData.forEach(data => {
      Object.keys(data).forEach(key => {
        if (key !== 'month') categories.add(key);
      });
    });
    return Array.from(categories);
  }, [chartData]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const hasPreviousPage = useMemo(() => currentPage > 0, [currentPage]);
  const hasNextPage = useMemo(() => currentPage < totalPages - 1, [currentPage, totalPages]);
  
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
  
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="p-4 bg-finflow-card border border-gray-700 rounded-md shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2">{payload[0].payload.month}</p>
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Detalle Gastos Mensuales</h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={!hasPreviousPage}
            onClick={handlePreviousPage}
            title="Ver meses más antiguos"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-gray-400">
            {visibleData.length > 0 ? `${currentPage + 1} / ${totalPages}` : ''}
          </span>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            disabled={!hasNextPage}
            onClick={handleNextPage}
            title="Ver meses más antiguos"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleData}
            margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
            barGap={2}
            barSize={25}
            onMouseMove={(data) => {
              if (data.activeTooltipIndex !== undefined) {
                setActiveMonth(visibleData[data.activeTooltipIndex]?.month || null);
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
                {visibleData.map((entry, index) => (
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
