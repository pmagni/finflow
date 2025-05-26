import React from 'react';
import BudgetPlanner from '@/components/Budget/BudgetPlanner';

const BudgetPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Presupuesto Mensual</h1>
      <BudgetPlanner />
    </div>
  );
};

export default BudgetPage; 