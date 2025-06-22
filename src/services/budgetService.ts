
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export type Budget = Tables<'budgets'>;
export type BudgetInsert = TablesInsert<'budgets'>;
export type BudgetUpdate = TablesUpdate<'budgets'>;

export const budgetService = {
  async getBudgetByUserAndMonth(userId: string, month: string): Promise<Budget | null> {
    if (!userId || !month) {
      throw new Error('Usuario y mes son requeridos');
    }
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createBudget(budget: BudgetInsert): Promise<Budget> {
    if (!budget.user_id) {
      throw new Error('ID de usuario es requerido');
    }

    // Validar que los valores numéricos sean positivos
    const numericFields = ['income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'];
    for (const field of numericFields) {
      const value = budget[field as keyof BudgetInsert] as number;
      if (value !== undefined && value < 0) {
        throw new Error(`${field} no puede ser negativo`);
      }
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert(budget)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBudget(id: string, updates: BudgetUpdate): Promise<Budget> {
    if (!id) {
      throw new Error('ID del presupuesto es requerido');
    }

    // Validar que los valores numéricos sean positivos si se proporcionan
    const numericFields = ['income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'];
    for (const field of numericFields) {
      const value = updates[field as keyof BudgetUpdate] as number;
      if (value !== undefined && value < 0) {
        throw new Error(`${field} no puede ser negativo`);
      }
    }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBudget(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID del presupuesto es requerido');
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getBudgetsByUser(userId: string): Promise<Budget[]> {
    if (!userId) {
      throw new Error('ID de usuario es requerido');
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Método adicional para validar la salud financiera del presupuesto
  validateBudgetHealth(budget: Budget): {
    isHealthy: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const totalExpenses = (budget.fixed_expenses || 0) + (budget.variable_expenses || 0);
    const totalCommitments = totalExpenses + (budget.savings_goal || 0);
    const remainingIncome = (budget.income || 0) - totalCommitments;

    // Validaciones de salud financiera
    if (remainingIncome < 0) {
      warnings.push('Los gastos superan los ingresos');
      suggestions.push('Considera reducir gastos variables o incrementar ingresos');
    }

    if (budget.savings_goal && budget.income) {
      const savingsRate = (budget.savings_goal / budget.income) * 100;
      if (savingsRate < 10) {
        suggestions.push('Intenta ahorrar al menos 10% de tus ingresos');
      } else if (savingsRate > 30) {
        suggestions.push('Tu meta de ahorro es muy ambiciosa, asegúrate de que sea sostenible');
      }
    }

    if (budget.fixed_expenses && budget.income) {
      const fixedExpensesRate = (budget.fixed_expenses / budget.income) * 100;
      if (fixedExpensesRate > 50) {
        warnings.push('Los gastos fijos representan más del 50% de tus ingresos');
        suggestions.push('Considera opciones para reducir gastos fijos');
      }
    }

    return {
      isHealthy: warnings.length === 0,
      warnings,
      suggestions
    };
  }
};
