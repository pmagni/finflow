import React, { useState, useEffect } from 'react';
import { getFinancialHealthScore, getTotalExpenses } from '@/services/expenseService';
import { getRecentTransactions } from '@/services/transactionService';
import { motion } from 'framer-motion';
import { CirclePlus, Info, CheckCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from '@/utils/formatters';

interface Goal {
  id: string;
  name: string;
  progress: number;
  target: number;
  currentAmount: number;
  createdAt: Date;
  completed: boolean;
}

interface Achievement {
  name: string;
  unlocked: boolean;
  description: string;
  icon?: React.ReactNode;
}

const FinancialHealth = () => {
  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scoreStatus, setScoreStatus] = useState<'poor' | 'fair' | 'good' | 'excellent'>('fair');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });
  const { toast } = useToast();
  
  // Calcular puntaje de salud financiera
  useEffect(() => {
    const calculateFinancialHealth = async () => {
      try {
        setIsLoading(true);
        
        // En un escenario real, obtendríamos más datos financieros 
        // como ingresos, ahorros, etc.
        const transactions = await getRecentTransactions(100);
        const totalExpenses = await getTotalExpenses();
        
        // Filtrar gastos e ingresos
        const expenses = transactions.filter(t => t.type === 'expense');
        const incomes = transactions.filter(t => t.type === 'income');
        
        // Total de ingresos
        const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Calcular diferentes métricas para el puntaje
        
        // 1. Proporción gastos vs ingresos (30 puntos)
        let expenseRatioScore = 0;
        if (totalIncome > 0) {
          const expenseRatio = totalExpenses / totalIncome;
          // Ideal: gastar menos del 70% de ingresos
          if (expenseRatio <= 0.7) expenseRatioScore = 30;
          // Aceptable: entre 70% y 90%
          else if (expenseRatio <= 0.9) expenseRatioScore = 20;
          // Preocupante: entre 90% y 100%
          else if (expenseRatio <= 1) expenseRatioScore = 10;
          // Crítico: más del 100%
          else expenseRatioScore = 0;
        }
        
        // 2. Consistencia en gastos (25 puntos)
        // Agrupar gastos por día para analizar patrones
        const dailyExpenses: Record<string, number> = {};
        expenses.forEach(expense => {
          const date = new Date(expense.transaction_date || expense.created_at || '');
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + Number(expense.amount);
        });
        
        // Calcular desviación estándar de gastos diarios
        const dailyValues = Object.values(dailyExpenses);
        const avgDaily = dailyValues.reduce((sum, amount) => sum + amount, 0) / dailyValues.length;
        const variance = dailyValues.reduce((sum, amount) => sum + Math.pow(amount - avgDaily, 2), 0) / dailyValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalizar la desviación estándar como porcentaje del promedio
        const variabilityRatio = avgDaily > 0 ? stdDev / avgDaily : 1;
        
        // Asignar puntaje basado en variabilidad (menor es mejor)
        let consistencyScore = 0;
        if (variabilityRatio <= 0.3) consistencyScore = 25; // Excelente consistencia
        else if (variabilityRatio <= 0.5) consistencyScore = 20; // Buena consistencia
        else if (variabilityRatio <= 0.8) consistencyScore = 15; // Consistencia moderada
        else if (variabilityRatio <= 1.2) consistencyScore = 10; // Variabilidad alta
        else consistencyScore = 5; // Variabilidad muy alta
        
        // 3. Diversificación de gastos (25 puntos)
        // Agrupar gastos por categoría
        const categoryExpenses: Record<string, number> = {};
        let categoryCount = 0;
        
        expenses.forEach(expense => {
          const category = expense.category?.name || 'Uncategorized';
          if (!categoryExpenses[category]) {
            categoryCount++;
            categoryExpenses[category] = 0;
          }
          categoryExpenses[category] += Number(expense.amount);
        });
        
        // Calcular concentración de gastos (índice Herfindahl-Hirschman simplificado)
        let hhi = 0;
        const totalExpenseAmount = Object.values(categoryExpenses).reduce((sum, amount) => sum + amount, 0);
        
        if (totalExpenseAmount > 0) {
          Object.values(categoryExpenses).forEach(amount => {
            const share = amount / totalExpenseAmount;
            hhi += share * share; // Sumar cuadrados de participaciones de mercado
          });
        }
        
        // Asignar puntaje basado en diversificación
        let diversificationScore = 0;
        if (categoryCount <= 1) diversificationScore = 5; // Sin diversificación
        else if (hhi <= 0.18) diversificationScore = 25; // Excelente diversificación
        else if (hhi <= 0.25) diversificationScore = 20; // Buena diversificación
        else if (hhi <= 0.35) diversificationScore = 15; // Diversificación moderada
        else if (hhi <= 0.5) diversificationScore = 10; // Baja diversificación
        else diversificationScore = 5; // Muy baja diversificación
        
        // 4. Logro de metas (20 puntos)
        // En un escenario real, esto vendría de una base de datos
        // Por ahora, usaremos datos de muestra
        const sampleGoals: Goal[] = [
          {
            id: '1',
            name: 'Fondo de emergencia',
            progress: 0.65,
            target: 5000000,
            currentAmount: 3250000,
            createdAt: new Date(2023, 0, 15),
            completed: false
          },
          {
            id: '2',
            name: 'Pagar tarjeta de crédito',
            progress: 0.3,
            target: 2500000,
            currentAmount: 750000,
            createdAt: new Date(2023, 2, 10),
            completed: false
          },
          {
            id: '3',
            name: 'Ahorrar para vacaciones',
            progress: 0.9,
            target: 1200000,
            currentAmount: 1080000,
            createdAt: new Date(2023, 1, 5),
            completed: false
          }
        ];
        
        setGoals(sampleGoals);
        
        // Calcular progreso promedio de metas
        const averageProgress = sampleGoals.reduce((sum, goal) => sum + goal.progress, 0) / sampleGoals.length;
        
        // Asignar puntaje basado en progreso de metas
        let goalScore = Math.round(averageProgress * 20);
        
        // 5. Logros
        const sampleAchievements: Achievement[] = [
          {
            name: 'Principiante en Presupuesto',
            unlocked: true,
            description: 'Creaste tu primer presupuesto',
            icon: <CheckCircle size={18} className="text-green-400" />
          },
          {
            name: 'Rastreador de Gastos',
            unlocked: true,
            description: 'Registraste más de 10 gastos',
            icon: <CheckCircle size={18} className="text-green-400" />
          },
          {
            name: 'Especialista en Ahorro',
            unlocked: false,
            description: 'Ahorra durante 3 meses consecutivos',
            icon: <Lock size={18} className="text-gray-400" />
          },
          {
            name: 'Destructor de Deudas',
            unlocked: false,
            description: 'Paga completamente una deuda',
            icon: <Lock size={18} className="text-gray-400" />
          }
        ];
        
        setAchievements(sampleAchievements);
        
        // Calcular puntaje final (0-100)
        const finalScore = expenseRatioScore + consistencyScore + diversificationScore + goalScore;
        
        // Determinar estado del puntaje
        let status: 'poor' | 'fair' | 'good' | 'excellent';
        if (finalScore < 40) status = 'poor';
        else if (finalScore < 60) status = 'fair';
        else if (finalScore < 80) status = 'good';
        else status = 'excellent';
        
        setScore(finalScore);
        setScoreStatus(status);
        
      } catch (error) {
        console.error('Error calculating financial health:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateFinancialHealth();
  }, []);
  
  const getScoreColorClass = () => {
    switch (scoreStatus) {
      case 'poor': return 'text-red-400';
      case 'fair': return 'text-yellow-400';
      case 'good': return 'text-green-400';
      case 'excellent': return 'text-indigo-400';
      default: return 'text-finflow-mint';
    }
  };
  
  const getScoreProgressColor = () => {
    switch (scoreStatus) {
      case 'poor': return 'bg-red-400';
      case 'fair': return 'bg-yellow-400';
      case 'good': return 'bg-green-400';
      case 'excellent': return 'bg-indigo-400';
      default: return 'bg-finflow-mint';
    }
  };
  
  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target || Number(newGoal.target) <= 0) {
      toast({
        title: "Meta inválida",
        description: "Por favor ingresa un nombre y monto objetivo válido.",
        variant: "destructive"
      });
      return;
    }
    
    const newGoalObj: Goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      progress: 0,
      target: Number(newGoal.target),
      currentAmount: 0,
      createdAt: new Date(),
      completed: false
    };
    
    setGoals([...goals, newGoalObj]);
    setNewGoal({ name: '', target: '' });
    setShowAddGoalDialog(false);
    
    toast({
      title: "Meta agregada",
      description: "Tu meta financiera ha sido agregada exitosamente."
    });
  };
  
  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Salud Financiera</h2>
        <div className="flex items-center justify-center p-4">
          <p>Analizando tu salud financiera...</p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-finflow-card rounded-2xl p-5"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Salud Financiera</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Tu puntaje de salud financiera (0-100) se calcula en base a la proporción de gastos, 
                consistencia, diversificación y progreso de metas. Mayor es mejor.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Score Indicator */}
      <div className="bg-gray-900 rounded-xl p-5 mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400">Puntaje General</p>
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-2xl font-bold ${getScoreColorClass()}`}
          >
            {score}
          </motion.p>
        </div>
        
        <div className="relative pt-1">
          <Progress 
            value={score} 
            max={100} 
            variant={scoreStatus === 'poor' ? 'danger' : 
                    scoreStatus === 'fair' ? 'warning' : 
                    scoreStatus === 'good' ? 'success' : 'default'}
            animate={true}
            markers={[40, 60, 80]}
            className="h-2 bg-gray-800"
          />
          
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Pobre</span>
            <span>Regular</span>
            <span>Bueno</span>
            <span>Excelente</span>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-400">
          Tu salud financiera es <span className={`font-medium ${getScoreColorClass()}`}>
            {scoreStatus === 'poor' && "pobre"}
            {scoreStatus === 'fair' && "regular"}
            {scoreStatus === 'good' && "buena"}
            {scoreStatus === 'excellent' && "excelente"}
          </span>. 
          {scoreStatus === 'poor' && " Enfócate en reducir gastos y crear un presupuesto."}
          {scoreStatus === 'fair' && " ¡Vas por buen camino! Continúa monitoreando tus gastos."}
          {scoreStatus === 'good' && " ¡Excelente gestión de tus finanzas! Considera establecer metas más ambiciosas."}
          {scoreStatus === 'excellent' && " ¡Gestión financiera excepcional! Tus hábitos están dando resultados."}
        </p>
      </div>
      
      {/* Financial Goals */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold">Metas Financieras</h3>
          <Button 
            onClick={() => setShowAddGoalDialog(true)}
            variant="outline" 
            size="sm"
            className="text-finflow-mint border-finflow-mint"
          >
            <CirclePlus size={16} className="mr-1" />
            Agregar Meta
          </Button>
        </div>
        
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              No hay metas financieras aún. Agrega tu primera meta para comenzar a seguir tu progreso.
            </p>
          ) : (
            goals.map(goal => (
              <motion.div 
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-900 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-sm">
                    <span className="text-finflow-mint">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-gray-400">
                      /{formatCurrency(goal.target)}
                    </span>
                  </p>
              </div>
                
                <div className="relative pt-1">
                  <Progress 
                    value={goal.progress * 100} 
                    max={100} 
                    variant="success"
                    animate={true}
                    className="h-1.5 bg-gray-800"
                  />
                  
                  <p className="mt-1 text-right text-xs text-gray-400">
                    {Math.round(goal.progress * 100)}% completado
                  </p>
              </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Achievements */}
      <div>
        <h3 className="text-md font-bold mb-4">Logros</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${
                achievement.unlocked 
                  ? 'border-green-800 bg-green-900/20' 
                  : 'border-gray-800 bg-gray-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                {achievement.icon}
                <p className="font-medium text-sm">
                  {achievement.name}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {achievement.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Add Goal Dialog */}
      <Dialog open={showAddGoalDialog} onOpenChange={setShowAddGoalDialog}>
        <DialogContent className="bg-finflow-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Agregar Meta Financiera</DialogTitle>
            <DialogDescription>
              Crea una nueva meta financiera para seguir tu progreso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Nombre de la Meta</Label>
              <Input 
                id="goal-name" 
                placeholder="Ej., Ahorrar para vacaciones" 
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal-target">Monto Objetivo (CLP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input 
                  id="goal-target" 
                  type="number" 
                  placeholder="Ej., 1.000.000" 
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  className="bg-gray-800 border-gray-700 pl-7"
                />
        </div>
      </div>
    </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddGoalDialog(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddGoal}
              className="bg-finflow-mint text-black hover:bg-finflow-mint-dark"
            >
              Agregar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FinancialHealth;
