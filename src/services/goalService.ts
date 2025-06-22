
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current_amount: number;
  monthly_contribution: number;
  months_to_achieve: number;
  progress: number;
  completed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export const goalService = {
  async getGoalsByUser(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'progress' | 'completed'>): Promise<Goal> {
    const progress = goal.current_amount > 0 ? (goal.current_amount / goal.target) * 100 : 0;
    const completed = progress >= 100;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        progress,
        completed
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    // Recalculate progress if current_amount or target changed
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
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateGoalProgress(id: string, amount: number): Promise<Goal> {
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
  }
};
