
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BudgetSummaryProps {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  savingsGoal: number;
}

export const BudgetSummary = ({ 
  income, 
  fixedExpenses, 
  variableExpenses, 
  savingsGoal 
}: BudgetSummaryProps) => {
  const totalExpenses = fixedExpenses + variableExpenses;
  const remainingIncome = income - totalExpenses - savingsGoal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del Presupuesto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Gastos:</span>
            <span>${totalExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Meta de Ahorro:</span>
            <span>${savingsGoal.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Dinero Restante:</span>
            <span className={remainingIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${remainingIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
