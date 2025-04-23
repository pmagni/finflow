import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell, Sector } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { PieChart as PieChartIcon, Calendar, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';

interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: string;
}

interface MonthData {
  month: string;
  data: ChartDataPoint[];
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [updateKey, setUpdateKey] = useState(0);
  const monthsPerPage = 1;

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
  
  const defaultColor = '#7EEBC6';
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExpensesByMonth();
      setMonthlyExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Suscribirse a cambios en la tabla de transacciones
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        async (payload) => {
          console.log('Cambio detectado en transacciones:', payload);
          // Forzar actualización inmediata
          await fetchData();
          // Actualizar la key para forzar re-render
          setUpdateKey(prev => prev + 1);
        }
      )
      .subscribe();

    // Limpiar suscripción al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);
  
  const prepareChartData = useCallback((monthData: Record<string, number>) => {
    if (!monthData) return [];
    
    const total = Object.values(monthData).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(monthData).map(([category, amount]) => {
      const percentage = (amount / total) * 100;
      return {
        name: category,
        value: amount,
        percentage: percentage < 1 ? '<1' : percentage.toFixed(0)
      };
    });
  }, []);

  const monthsList = useMemo(() => Object.entries(monthlyExpenses), [monthlyExpenses, updateKey]);

  const currentMonthData = useMemo<MonthData>(() => {
    if (monthsList.length === 0) return { month: '', data: [] };
    const startIndex = currentPage;
    const [month, data] = monthsList[startIndex];
    return {
      month,
      data: prepareChartData(data)
    };
  }, [monthsList, currentPage, prepareChartData, updateKey]);

  useEffect(() => {
    const pages = monthsList.length;
    setTotalPages(pages);
    // Solo reiniciar la página actual si no hay datos
    if (pages === 0) {
      setCurrentPage(0);
    }
  }, [monthsList.length]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const hasPreviousPage = useMemo(() => currentPage > 0, [currentPage]);
  const hasNextPage = useMemo(() => currentPage < totalPages - 1, [currentPage, totalPages]);

  // Encontrar la categoría con mayor porcentaje
  const mainCategory = useMemo(() => {
    if (!currentMonthData.data.length) return null;
    return currentMonthData.data.reduce((max, current) => 
      Number(current.percentage) > Number(max.percentage) ? current : max
    , currentMonthData.data[0]);
  }, [currentMonthData.data]);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-4 bg-finflow-card border border-gray-700 rounded-md shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-2 capitalize">{data.name}</p>
          <p className="text-xs text-gray-400 mb-2">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-400">{data.payload.percentage}% del total</p>
        </div>
      );
    }
    return null;
  };
  
  const onPieClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius * 1.05} // 5% más grande cuando está activo
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
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
  
  return (
    <div className="bg-finflow-card rounded-2xl p-5 mb-5 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Mis Gastos</h2>
      </div>

      <div className="flex items-center justify-center mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="min-w-40 flex items-center justify-between gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="flex-1">{currentMonthData.month || 'Seleccionar mes'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40">
            {monthsList.map(([month], index) => (
              <DropdownMenuItem
                key={month}
                className="justify-center"
                onClick={() => setCurrentPage(index)}
              >
                {month}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="h-96 w-full relative">
          {currentMonthData.data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentMonthData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={94}
                    outerRadius={140}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    onClick={onPieClick}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                  >
                    {currentMonthData.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[entry.name.toLowerCase()] || defaultColor}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div className="text-4xl font-bold">
                  {activeIndex !== null 
                    ? `${currentMonthData.data[activeIndex].percentage}%`
                    : mainCategory?.percentage + '%'}
                </div>
                <div className="text-sm text-gray-400 capitalize">
                  {activeIndex !== null 
                    ? currentMonthData.data[activeIndex].name
                    : mainCategory?.name}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon size={32} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400">No hay datos de gastos para este mes</p>
              </div>
            </div>
          )}
        </div>
        
        {currentMonthData.data.length > 0 && (
          <div className="w-full max-w-md grid grid-cols-2 gap-4 mt-6">
            {currentMonthData.data
              .sort((a, b) => b.value - a.value)
              .map((category, index) => (
                <div 
                  key={category.name} 
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                    activeIndex === index ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => onPieClick(null, index)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[category.name.toLowerCase()] || defaultColor }}
                  />
                  <div className="flex items-baseline justify-between w-full">
                    <span className="text-sm capitalize truncate">{category.name}</span>
                    <span className="text-sm text-gray-400 ml-2">{category.percentage}%</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseChart;
