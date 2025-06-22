
import React from 'react';
import { useBudget } from '@/hooks/useBudget';
import { BudgetForm } from './BudgetForm';
import { BudgetSummary } from './BudgetSummary';
import { BudgetHealthIndicator } from './BudgetHealthIndicator';
import { BudgetLoadingState } from './BudgetLoadingState';

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
    return <BudgetLoadingState />;
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
