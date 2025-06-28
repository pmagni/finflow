
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import { SecureBudgetOperations } from './budget/budgetSecurityWrapper';
import { validateBudgetHealth } from './budget/budgetHealthAnalysis';

export type Budget = Tables<'budgets'>;
export type BudgetInsert = TablesInsert<'budgets'>;
export type BudgetUpdate = TablesUpdate<'budgets'>;

class BudgetServiceClass extends SecureBudgetOperations {
  // Método para validar la salud financiera del presupuesto
  validateBudgetHealth(budget: Budget) {
    return validateBudgetHealth(budget);
  }
}

export const budgetService = new BudgetServiceClass();
