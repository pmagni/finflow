import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

const registerMonthlyContribution = async (goal: any, toast: any, userId: string) => {
  try {
    const transactions = [];
    const startDate = new Date();
    
    // Crear una transacción para cada mes
    for (let i = 0; i < goal.months_to_achieve; i++) {
      const transactionDate = new Date(startDate);
      transactionDate.setMonth(startDate.getMonth() + i);
      
      transactions.push({
        amount: goal.monthly_contribution,
        type: 'expense',
        description: `Cuota ${i + 1} de ${goal.months_to_achieve} para la meta: ${goal.name}`,
        date: transactionDate.toISOString(),
        category: 'Ahorros',
        goal_id: goal.id,
        user_id: userId
      });
    }

    const { error } = await supabase.from('transactions').insert(transactions);
    if (error) throw error;
  } catch (error) {
    console.error('Error registrando las cuotas mensuales:', error);
    toast({
      title: "Error",
      description: "No se pudieron registrar las cuotas mensuales.",
      variant: "destructive"
    });
  }
};

const PlandeAhorro = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', monthsToAchieve: '' });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar las metas', variant: 'destructive' });
        return;
      }
      setGoals(data || []);
    };
    fetchGoals();
  }, [user]);

  const handleAddGoal = async () => {
    if (!user) return;
    if (!newGoal.name || !newGoal.target || Number(newGoal.target) <= 0 || !newGoal.monthsToAchieve || Number(newGoal.monthsToAchieve) <= 0) {
      toast({
        title: "Meta inválida",
        description: "Por favor ingresa un nombre, monto objetivo y meses válidos.",
        variant: "destructive"
      });
      return;
    }
    const monthlyContribution = Number(newGoal.target) / Number(newGoal.monthsToAchieve);
    const goalInsert: GoalInsert = {
      user_id: user.id,
      name: newGoal.name,
      target: Number(newGoal.target),
      current_amount: 0,
      months_to_achieve: Number(newGoal.monthsToAchieve),
      monthly_contribution: monthlyContribution,
      progress: 0,
      completed: false
    };
    const { data, error } = await supabase.from('goals').insert(goalInsert).select().single();
    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear la meta', variant: 'destructive' });
      return;
    }
    setGoals([data, ...goals]);
    setNewGoal({ name: '', target: '', monthsToAchieve: '' });
    await registerMonthlyContribution({
      ...data,
      monthly_contribution: monthlyContribution,
      name: newGoal.name
    }, toast, user.id);
    toast({ title: 'Meta agregada', description: 'Tu meta financiera ha sido agregada exitosamente.' });
  };

  const handleEditGoal = async (goalId: string, updatedGoal: Partial<Goal>) => {
    if (!user) return;
    const { error } = await supabase.from('goals').update(updatedGoal).eq('id', goalId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la meta', variant: 'destructive' });
      return;
    }
    setGoals(goals.map(goal => goal.id === goalId ? { ...goal, ...updatedGoal } : goal));
    toast({ title: 'Meta actualizada', description: 'La meta ha sido actualizada exitosamente.' });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la meta', variant: 'destructive' });
      return;
    }
    setGoals(goals.filter(goal => goal.id !== goalId));
    toast({ title: 'Meta eliminada', description: 'La meta ha sido eliminada exitosamente.' });
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold mb-4">Plan de Ahorro</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-name">Nombre de la Meta</Label>
          <Input 
            id="goal-name" 
            placeholder="Ej., Ahorrar para vacaciones" 
            value={newGoal.name}
            onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-target">Monto Objetivo (CLP)</Label>
          <Input 
            id="goal-target" 
            type="number" 
            placeholder="Ej., 1.000.000" 
            value={newGoal.target}
            onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-months">Meses para Lograr la Meta</Label>
          <Input 
            id="goal-months" 
            type="number" 
            placeholder="Ej., 12" 
            value={newGoal.monthsToAchieve}
            onChange={(e) => setNewGoal({ ...newGoal, monthsToAchieve: e.target.value })}
          />
        </div>
        <Button onClick={handleAddGoal} className="bg-finflow-mint text-black hover:bg-finflow-mint-dark">
          Agregar Meta
        </Button>
      </div>
      <div className="mt-6">
        <h3 className="text-md font-bold mb-4">Metas Actuales</h3>
        {goals.length === 0 ? (
          <p className="text-center text-gray-400 py-4">
            No hay metas financieras aún. Agrega tu primera meta para comenzar a seguir tu progreso.
          </p>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{goal.name}</p>
                <p className="text-sm">
                  <span className="text-finflow-mint">
                    {formatCurrency(goal.current_amount)}
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
                  className="h-1.5 bg-gray-800"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {Math.round(goal.progress * 100)}% completado
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Cuota Mensual: {formatCurrency(goal.monthly_contribution)}
              </p>
              <div className="flex justify-end mt-2 space-x-2">
                <Button onClick={() => handleEditGoal(goal.id, { name: 'Nuevo Nombre' })} className="bg-finflow-mint text-black hover:bg-finflow-mint-dark">Editar</Button>
                <Button onClick={() => handleDeleteGoal(goal.id)} className="bg-red-600 text-white hover:bg-red-700">Eliminar</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlandeAhorro; 