
import { budgetService, Budget } from './budgetService';
import { PerformanceMonitor, memoize } from '@/utils/performance';
import { cache } from '@/utils/cache';

class OptimizedBudgetService {
  // Memoized version of budget validation for better performance
  private validateBudgetHealthMemoized = memoize(
    budgetService.validateBudgetHealth.bind(budgetService),
    (budget: Budget) => `${budget.id}_${budget.month}_${JSON.stringify({
      income: budget.income,
      fixed_expenses: budget.fixed_expenses,
      variable_expenses: budget.variable_expenses,
      savings_goal: budget.savings_goal
    })}`,
    10 * 60 * 1000 // 10 minutes cache
  );

  async getBudgetByUserAndMonth(userId: string, month: string): Promise<Budget | null> {
    const cacheKey = `budget_${userId}_${month}`;
    
    // Check cache first
    const cached = cache.get<Budget>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await PerformanceMonitor.measureAsync(
      'getBudgetByUserAndMonth',
      () => budgetService.getBudgetByUserAndMonth(userId, month)
    );

    // Cache for 5 minutes
    if (result) {
      cache.set(cacheKey, result, 5 * 60 * 1000);
    }

    return result;
  }

  async createBudget(budget: any): Promise<Budget> {
    const result = await PerformanceMonitor.measureAsync(
      'createBudget',
      () => budgetService.createBudget(budget)
    );

    // Invalidate related cache entries
    this.invalidateBudgetCache(budget.user_id, budget.month);
    
    return result;
  }

  async updateBudget(id: string, updates: any): Promise<Budget> {
    const result = await PerformanceMonitor.measureAsync(
      'updateBudget',
      () => budgetService.updateBudget(id, updates)
    );

    // Invalidate related cache entries
    if (updates.user_id && updates.month) {
      this.invalidateBudgetCache(updates.user_id, updates.month);
    }
    
    return result;
  }

  async deleteBudget(id: string): Promise<void> {
    await PerformanceMonitor.measureAsync(
      'deleteBudget',
      () => budgetService.deleteBudget(id)
    );

    // Clear all budget-related cache (we don't know which specific entry to clear)
    this.clearBudgetCache();
  }

  validateBudgetHealth(budget: Budget) {
    return this.validateBudgetHealthMemoized(budget);
  }

  private invalidateBudgetCache(userId: string, month: string) {
    const cacheKey = `budget_${userId}_${month}`;
    cache.delete(cacheKey);
  }

  private clearBudgetCache() {
    // This is a simple implementation - in a production app you might want
    // more sophisticated cache invalidation
    cache.clear();
  }
}

export const optimizedBudgetService = new OptimizedBudgetService();
