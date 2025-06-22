
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import { BudgetOperations } from './budget/budgetOperations';
import { validateBudgetHealth } from './budget/budgetHealthAnalysis';

export type Budget = Tables<'budgets'>;
export type BudgetInsert = TablesInsert<'budgets'>;
export type BudgetUpdate = TablesUpdate<'budgets'>;

class BudgetServiceClass extends BudgetOperations {
  // Método para validar la salud financiera del presupuesto
  validateBudgetHealth(budget: Budget) {
    return validateBudgetHealth(budget);
  }
}

export const budgetService = new BudgetServiceClass();
