
import type { Budget } from '../budgetService';

export const validateBudgetHealth = (budget: Budget): {
  isHealthy: boolean;
  warnings: string[];
  suggestions: string[];
} => {
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
};
