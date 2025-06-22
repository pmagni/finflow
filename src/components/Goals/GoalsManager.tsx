
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { goalService, Goal } from '@/services/goalService';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { ProgressDialog } from './ProgressDialog';
import { GoalStatistics } from './GoalStatistics';

export const GoalsManager = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [statistics, setStatistics] = useState<{
    totalGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>();
  const [selectedGoalForProgress, setSelectedGoalForProgress] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchStatistics();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      if (!user) return;
      const data = await goalService.getGoalsByUser(user.id);
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Error al cargar las metas');
    }
  };

  const fetchStatistics = async () => {
    try {
      if (!user) return;
      const stats = await goalService.getGoalStatistics(user.id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreateGoal = async (data: any) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await goalService.createGoal({
        ...data,
        user_id: user.id,
        current_amount: data.current_amount || 0,
      });
      
      toast.success('Meta creada exitosamente');
      setIsFormOpen(false);
      await Promise.all([fetchGoals(), fetchStatistics()]);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error(error.message || 'Error al crear la meta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGoal = async (data: any) => {
    if (!selectedGoal) return;

    setIsLoading(true);
    try {
      await goalService.updateGoal(selectedGoal.id, data);
      toast.success('Meta actualizada exitosamente');
      setIsFormOpen(false);
      setSelectedGoal(undefined);
      await Promise.all([fetchGoals(), fetchStatistics()]);
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast.error(error.message || 'Error al actualizar la meta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) return;

    try {
      await goalService.deleteGoal(id);
      toast.success('Meta eliminada exitosamente');
      await Promise.all([fetchGoals(), fetchStatistics()]);
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error(error.message || 'Error al eliminar la meta');
    }
  };

  const handleAddProgress = (goalId: string) => {
    setSelectedGoalForProgress(goalId);
    setIsProgressDialogOpen(true);
  };

  const handleProgressSubmit = async (amount: number) => {
    if (!selectedGoalForProgress) return;

    try {
      await goalService.updateGoalProgress(selectedGoalForProgress, amount);
      toast.success('Progreso agregado exitosamente');
      setIsProgressDialogOpen(false);
      setSelectedGoalForProgress('');
      await Promise.all([fetchGoals(), fetchStatistics()]);
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Error al agregar progreso');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsFormOpen(true);
  };

  const completedGoals = goals.filter(goal => goal.completed);
  const activeGoals = goals.filter(goal => !goal.completed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas de Ahorro
              </CardTitle>
              <CardDescription>
                Establece y sigue el progreso de tus objetivos financieros
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Meta
            </Button>
          </div>
        </CardHeader>
      </Card>

      {statistics && <GoalStatistics statistics={statistics} />}

      {activeGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Metas Activas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onAddProgress={handleAddProgress}
              />
            ))}
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Metas Completadas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onAddProgress={handleAddProgress}
              />
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes metas de ahorro</h3>
            <p className="text-gray-600 mb-4">Crea tu primera meta para comenzar a ahorrar</p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Meta
            </Button>
          </CardContent>
        </Card>
      )}

      <GoalForm
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedGoal(undefined);
        }}
        goal={selectedGoal}
        onSubmit={selectedGoal ? handleUpdateGoal : handleCreateGoal}
        isLoading={isLoading}
      />

      <ProgressDialog
        isOpen={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
        onSubmit={handleProgressSubmit}
      />
    </div>
  );
};
