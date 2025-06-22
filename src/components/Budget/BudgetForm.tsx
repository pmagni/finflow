
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface BudgetData {
  income: number;
  fixed_expenses: number;
  variable_expenses: number;
  savings_goal: number;
  discretionary_spend: number;
}

interface BudgetFormProps {
  budget: BudgetData;
  onBudgetChange: (field: keyof BudgetData, value: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const BudgetForm = ({ budget, onBudgetChange, onSave, isLoading }: BudgetFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planificador de Presupuesto</CardTitle>
        <CardDescription>
          Organiza tus ingresos y gastos mensuales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="income">Ingresos Mensuales</Label>
            <Input
              id="income"
              type="number"
              min="0"
              step="0.01"
              value={budget.income}
              onChange={(e) => onBudgetChange('income', e.target.value)}
              placeholder="0"
            />
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="fixed_expenses">Gastos Fijos</Label>
            <Input
              id="fixed_expenses"
              type="number"
              min="0"
              step="0.01"
              value={budget.fixed_expenses}
              onChange={(e) => onBudgetChange('fixed_expenses', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="variable_expenses">Gastos Variables</Label>
            <Input
              id="variable_expenses"
              type="number"
              min="0"
              step="0.01"
              value={budget.variable_expenses}
              onChange={(e) => onBudgetChange('variable_expenses', e.target.value)}
              placeholder="0"
            />
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="savings_goal">Meta de Ahorro</Label>
            <Input
              id="savings_goal"
              type="number"
              min="0"
              step="0.01"
              value={budget.savings_goal}
              onChange={(e) => onBudgetChange('savings_goal', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discretionary_spend">Gastos Discrecionales</Label>
            <Input
              id="discretionary_spend"
              type="number"
              min="0"
              step="0.01"
              value={budget.discretionary_spend}
              onChange={(e) => onBudgetChange('discretionary_spend', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <Button 
          onClick={onSave} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Guardando...' : 'Guardar Presupuesto'}
        </Button>
      </CardContent>
    </Card>
  );
};
