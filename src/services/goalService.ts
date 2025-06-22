
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export type Goal = Tables<'goals'>;
export type GoalInsert = TablesInsert<'goals'>;
export type GoalUpdate = TablesUpdate<'goals'>;

export const goalService = {
  async getGoalsByUser(userId: string): Promise<Goal[]> {
    if (!userId) {
      throw new Error('ID de usuario es requerido');
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGoal(goal: GoalInsert): Promise<Goal> {
    if (!goal.user_id) {
      throw new Error('ID de usuario es requerido');
    }

    // Validaciones de negocio
    if (goal.target <= 0) {
      throw new Error('La meta debe ser mayor a 0');
    }

    if (goal.monthly_contribution <= 0) {
      throw new Error('La contribución mensual debe ser mayor a 0');
    }

    if (goal.months_to_achieve <= 0) {
      throw new Error('Los meses para lograr la meta deben ser mayor a 0');
    }

    // Calcular progreso y estado de completación
    const currentAmount = goal.current_amount || 0;
    const progress = goal.target > 0 ? (currentAmount / goal.target) * 100 : 0;
    const completed = progress >= 100;

    const goalData: GoalInsert = {
      ...goal,
      current_amount: currentAmount,
      progress,
      completed
    };

    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(id: string, updates: GoalUpdate): Promise<Goal> {
    if (!id) {
      throw new Error('ID de la meta es requerido');
    }

    // Validaciones si se están actualizando campos críticos
    if (updates.target !== undefined && updates.target <= 0) {
      throw new Error('La meta debe ser mayor a 0');
    }

    if (updates.monthly_contribution !== undefined && updates.monthly_contribution <= 0) {
      throw new Error('La contribución mensual debe ser mayor a 0');
    }

    if (updates.months_to_achieve !== undefined && updates.months_to_achieve <= 0) {
      throw new Error('Los meses para lograr la meta deben ser mayor a 0');
    }

    // Recalcular progreso si current_amount o target cambiaron
    if (updates.current_amount !== undefined || updates.target !== undefined) {
      const { data: currentGoal } = await supabase
        .from('goals')
        .select('current_amount, target')
        .eq('id', id)
        .single();

      if (currentGoal) {
        const newCurrentAmount = updates.current_amount ?? currentGoal.current_amount;
        const newTarget = updates.target ?? currentGoal.target;
        updates.progress = newTarget > 0 ? (newCurrentAmount / newTarget) * 100 : 0;
        updates.completed = updates.progress >= 100;
      }
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGoal(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID de la meta es requerido');
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateGoalProgress(id: string, amount: number): Promise<Goal> {
    if (!id) {
      throw new Error('ID de la meta es requerido');
    }

    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newCurrentAmount = goal.current_amount + amount;
    const progress = goal.target > 0 ? (newCurrentAmount / goal.target) * 100 : 0;
    const completed = progress >= 100;

    const { data, error } = await supabase
      .from('goals')
      .update({
        current_amount: newCurrentAmount,
        progress,
        completed
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Método adicional para calcular proyecciones de la meta
  calculateGoalProjection(goal: Goal): {
    monthsToComplete: number;
    projectedCompletionDate: Date;
    isOnTrack: boolean;
    monthlyDeficit: number;
  } {
    const remainingAmount = Math.max(goal.target - goal.current_amount, 0);
    const monthsToComplete = goal.monthly_contribution > 0 
      ? Math.ceil(remainingAmount / goal.monthly_contribution)
      : Infinity;
    
    const projectedCompletionDate = new Date();
    projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsToComplete);

    const isOnTrack = monthsToComplete <= goal.months_to_achieve;
    const requiredMonthlyContribution = remainingAmount / goal.months_to_achieve;
    const monthlyDeficit = Math.max(requiredMonthlyContribution - goal.monthly_contribution, 0);

    return {
      monthsToComplete: monthsToComplete === Infinity ? -1 : monthsToComplete,
      projectedCompletionDate,
      isOnTrack,
      monthlyDeficit
    };
  },

  // Método para obtener estadísticas de metas del usuario
  async getGoalStatistics(userId: string): Promise<{
    totalGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  }> {
    if (!userId) {
      throw new Error('ID de usuario es requerido');
    }

    const goals = await this.getGoalsByUser(userId);
    
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.completed).length;
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const averageProgress = totalGoals > 0 
      ? goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals 
      : 0;

    return {
      totalGoals,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      averageProgress
    };
  }
};
