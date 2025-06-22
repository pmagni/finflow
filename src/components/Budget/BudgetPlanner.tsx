
import React from 'react';
import { useBudget } from '@/hooks/useBudget';
import { BudgetForm } from './BudgetForm';
import { BudgetSummary } from './BudgetSummary';
import { BudgetHealthIndicator } from './BudgetHealthIndicator';

const BudgetPlanner = () => {
  const {
    budget,
    currentBudget,
    isLoading,
    isFetching,
    saveBudget,
    handleInputChange,
    getHealthAnalysis
  } = useBudget();

  const healthAnalysis = getHealthAnalysis();

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finflow-mint"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <BudgetForm
          budget={budget}
          onBudgetChange={handleInputChange}
          onSave={saveBudget}
          isLoading={isLoading}
        />
        
        <BudgetSummary
          income={budget.income}
          fixedExpenses={budget.fixed_expenses}
          variableExpenses={budget.variable_expenses}
          savingsGoal={budget.savings_goal}
        />
      </div>

      {currentBudget && (
        <BudgetHealthIndicator 
          budget={currentBudget} 
          healthAnalysis={healthAnalysis}
        />
      )}
    </div>
  );
};

export default BudgetPlanner;
