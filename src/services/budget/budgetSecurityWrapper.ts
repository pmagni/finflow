
import { SecurityService } from '../securityService';
import { BudgetOperations } from './budgetOperations';
import type { BudgetInsert, BudgetUpdate } from '../budgetService';

export class SecureBudgetOperations extends BudgetOperations {
  async createBudget(budget: BudgetInsert): Promise<any> {
    // Verify authentication
    const { user, error: authError } = await SecurityService.verifyAuthentication();
    if (authError || !user) {
      throw new Error(authError || 'Authentication required');
    }

    // Rate limiting
    const { authorized, error: authzError } = await SecurityService.authorizeOperation('create', user.id);
    if (!authorized) {
      throw new Error(authzError || 'Operation not authorized');
    }

    // Validate input
    const validation = SecurityService.validateInput(
      budget,
      ['user_id', 'month', 'income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'],
      ['user_id', 'month']
    );

    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    // Validate financial data
    const financialValidation = SecurityService.validateFinancialData(validation.sanitizedData!);
    if (!financialValidation.isValid) {
      throw new Error(`Financial validation errors: ${financialValidation.errors.join(', ')}`);
    }

    // Ensure user can only create their own budgets
    if (financialValidation.sanitizedData!.user_id !== user.id) {
      throw new Error('Cannot create budget for another user');
    }

    return super.createBudget(financialValidation.sanitizedData!);
  }

  async updateBudget(id: string, budget: BudgetUpdate): Promise<any> {
    // Verify authentication
    const { user, error: authError } = await SecurityService.verifyAuthentication();
    if (authError || !user) {
      throw new Error(authError || 'Authentication required');
    }

    // Authorization with resource ownership check
    const { authorized, error: authzError } = await SecurityService.authorizeOperation(
      'update', 
      user.id, 
      id, 
      'budgets'
    );
    if (!authorized) {
      throw new Error(authzError || 'Operation not authorized');
    }

    // Validate input
    const validation = SecurityService.validateInput(
      budget,
      ['month', 'income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend']
    );

    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    // Validate financial data
    const financialValidation = SecurityService.validateFinancialData(validation.sanitizedData!);
    if (!financialValidation.isValid) {
      throw new Error(`Financial validation errors: ${financialValidation.errors.join(', ')}`);
    }

    return super.updateBudget(id, financialValidation.sanitizedData!);
  }

  async deleteBudget(id: string): Promise<void> {
    // Verify authentication
    const { user, error: authError } = await SecurityService.verifyAuthentication();
    if (authError || !user) {
      throw new Error(authError || 'Authentication required');
    }

    // Authorization with resource ownership check
    const { authorized, error: authzError } = await SecurityService.authorizeOperation(
      'delete', 
      user.id, 
      id, 
      'budgets'
    );
    if (!authorized) {
      throw new Error(authzError || 'Operation not authorized');
    }

    return super.deleteBudget(id);
  }

  async getBudgetsByUser(userId: string): Promise<any[]> {
    // Verify authentication
    const { user, error: authError } = await SecurityService.verifyAuthentication();
    if (authError || !user) {
      throw new Error(authError || 'Authentication required');
    }

    // Users can only access their own budgets
    if (userId !== user.id) {
      throw new Error('Cannot access another user\'s budgets');
    }

    // Rate limiting
    const { authorized, error: authzError } = await SecurityService.authorizeOperation('read', user.id);
    if (!authorized) {
      throw new Error(authzError || 'Operation not authorized');
    }

    return super.getBudgetsByUser(userId);
  }
}
