import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { getExpensesByMonth } from '@/services/expenseService';
import { formatCurrency } from '@/utils/formatters';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ExpenseChart = () => {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [visibleChartData, setVisibleChartData] = useState<any[]>([]);
  const [allChartData, setAllChartData] = useState<any[]>([]);
  const [sliderValue, setSliderValue] = useState(0);
  const [monthsToShow, setMonthsToShow] = useState(3);
  
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
      const data = prepareChartData();
      setAllChartData(data);
      
      // Inicializar los datos visibles con los últimos meses
      updateVisibleData(data, Math.max(0, data.length - monthsToShow));
    }
  }, [monthlyExpenses]);
  
  const prepareChartData = () => {
    const chartData = Object.entries(monthlyExpenses).map(([month, categories]) => {
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
      
      // Crear un valor numérico para ordenar correctamente
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(engMonth);
      const sortDate = new Date(parseInt(year), monthIndex, 1);
      
      return {
        month: `${spanishMonth} ${year}`,
        originalMonth: month,
        sortDate,
        ...categories,
        total
      };
    });
    
    // Ordenar por fecha usando el valor numérico del sortDate
    chartData.sort((a, b) => {
      return a.sortDate.getTime() - b.sortDate.getTime();
    });
    
    return chartData;
  };
  
  const updateVisibleData = (data: any[], startIndex: number) => {
    const endIndex = Math.min(startIndex + monthsToShow, data.length);
    const newStartIndex = Math.max(0, Math.min(startIndex, data.length - monthsToShow));
    
    setSliderValue(newStartIndex);
    setVisibleChartData(data.slice(newStartIndex, endIndex));
  };
  
  // Manejar cambios en el slider
  const handleSliderChange = (value: number[]) => {
    updateVisibleData(allChartData, value[0]);
  };
  
  // Manejar navegación con botones
  const handlePrevious = () => {
    const newIndex = Math.max(0, sliderValue - 1);
    updateVisibleData(allChartData, newIndex);
  };
  
  const handleNext = () => {
    const newIndex = Math.min(allChartData.length - monthsToShow, sliderValue + 1);
    updateVisibleData(allChartData, newIndex);
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
      allChartData.flatMap(data => 
        Object.keys(data).filter(key => key !== 'month' && key !== 'total' && key !== 'originalMonth' && key !== 'sortDate')
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Detalle Gastos Mensuales</h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={sliderValue <= 0}
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            disabled={sliderValue >= allChartData.length - monthsToShow}
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleChartData}
            margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
            barGap={2}
            barSize={25}
            onMouseMove={(data) => {
              if (data.activeTooltipIndex !== undefined) {
                setActiveMonth(visibleChartData[data.activeTooltipIndex]?.month || null);
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
                {visibleChartData.map((entry, index) => (
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
      
      {allChartData.length > monthsToShow && (
        <div className="mt-4 px-4">
          <Slider 
            value={[sliderValue]} 
            min={0} 
            max={Math.max(0, allChartData.length - monthsToShow)}
            step={1}
            onValueChange={handleSliderChange}
            className="mt-2"
          />
        </div>
      )}
      
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
