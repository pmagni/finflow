import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import { checkUserPermissions, validateResourceOwnership } from '@/utils/securityHelpers';

export type Budget = Tables<'budgets'>;
export type BudgetInsert = TablesInsert<'budgets'>;
export type BudgetUpdate = TablesUpdate<'budgets'>;

class BudgetServiceClass {
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequestsPerMinute = 10;
  private readonly windowMs = 60000;

  private checkRateLimit(userId: string, operation: string): boolean {
    const key = `${userId}-${operation}`;
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry) {
      this.rateLimits.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > entry.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (entry.count >= this.maxRequestsPerMinute) {
      return true;
    }

    entry.count++;
    return false;
  }

  async getBudgetByUserAndMonth(userId: string, month: string): Promise<Budget | null> {
    if (!userId || !month) {
      throw new Error('Usuario y mes son requeridos');
    }

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Rate limiting
    if (this.checkRateLimit(userId, 'getBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createBudget(budget: BudgetInsert): Promise<Budget> {
    if (!budget.user_id) {
      throw new Error('ID de usuario es requerido');
    }

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Rate limiting
    if (this.checkRateLimit(budget.user_id, 'createBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }

    // Validar que los valores numéricos sean positivos
    const numericFields = ['income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'];
    for (const field of numericFields) {
      const value = budget[field as keyof BudgetInsert] as number;
      if (value !== undefined && (value < 0 || value > 999999999)) {
        throw new Error(`${field} debe estar entre 0 y $999.999.999`);
      }
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert(budget)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBudget(id: string, updates: BudgetUpdate): Promise<Budget> {
    if (!id) {
      throw new Error('ID del presupuesto es requerido');
    }

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Obtener el user_id actual del presupuesto para verificar ownership
    const { data: currentBudget } = await supabase
      .from('budgets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!currentBudget) {
      throw new Error('Presupuesto no encontrado');
    }

    // Verificar ownership
    const isOwner = await validateResourceOwnership('budgets', id, currentBudget.user_id);
    if (!isOwner) {
      throw new Error('No tienes permisos para editar este presupuesto');
    }

    // Rate limiting
    if (this.checkRateLimit(currentBudget.user_id, 'updateBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }

    // Validar que los valores numéricos sean positivos si se proporcionan
    const numericFields = ['income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'];
    for (const field of numericFields) {
      const value = updates[field as keyof BudgetUpdate] as number;
      if (value !== undefined && (value < 0 || value > 999999999)) {
        throw new Error(`${field} debe estar entre 0 y $999.999.999`);
      }
    }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', currentBudget.user_id) // Asegurar que solo el propietario pueda actualizar
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBudget(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID del presupuesto es requerido');
    }

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Obtener el user_id actual del presupuesto para verificar ownership
    const { data: currentBudget } = await supabase
      .from('budgets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!currentBudget) {
      throw new Error('Presupuesto no encontrado');
    }

    // Verificar ownership
    const isOwner = await validateResourceOwnership('budgets', id, currentBudget.user_id);
    if (!isOwner) {
      throw new Error('No tienes permisos para eliminar este presupuesto');
    }

    // Rate limiting
    if (this.checkRateLimit(currentBudget.user_id, 'deleteBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', currentBudget.user_id); // Asegurar que solo el propietario pueda eliminar

    if (error) throw error;
  }

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
  }

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
}

export const budgetService = new BudgetServiceClass();
