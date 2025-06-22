
import { supabase } from '@/integrations/supabase/client';
import type { Budget, BudgetInsert, BudgetUpdate } from '../budgetService';
import { checkUserPermissions, checkResourceOwnership } from '@/utils/securityHelpers';
import { budgetRateLimit } from './budgetRateLimit';
import { validateBudgetData, validateBudgetId, validateUserAndMonth } from './budgetValidations';

export class BudgetOperations {
  async getBudgetByUserAndMonth(userId: string, month: string): Promise<Budget | null> {
    validateUserAndMonth(userId, month);

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Rate limiting
    if (budgetRateLimit.checkRateLimit(userId, 'getBudget')) {
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
    validateBudgetData(budget);

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Rate limiting
    if (budgetRateLimit.checkRateLimit(budget.user_id!, 'createBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
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
    validateBudgetId(id);
    validateBudgetData(updates);

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Verificar ownership
    const isOwner = await checkResourceOwnership('budgets', id);
    if (!isOwner) {
      throw new Error('No tienes permisos para editar este presupuesto');
    }

    // Obtener user ID para rate limiting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Rate limiting
    if (budgetRateLimit.checkRateLimit(user.id, 'updateBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBudget(id: string): Promise<void> {
    validateBudgetId(id);

    // Verificar permisos
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Verificar ownership
    const isOwner = await checkResourceOwnership('budgets', id);
    if (!isOwner) {
      throw new Error('No tienes permisos para eliminar este presupuesto');
    }

    // Obtener user ID para rate limiting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Rate limiting
    if (budgetRateLimit.checkRateLimit(user.id, 'deleteBudget')) {
      throw new Error('Demasiadas solicitudes. Inténtalo más tarde.');
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
}
