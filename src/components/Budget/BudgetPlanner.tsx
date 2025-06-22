
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { budgetService, type Budget } from '@/services/budgetService';
import { BudgetHealthIndicator } from './BudgetHealthIndicator';

interface BudgetData {
  income: number;
  fixed_expenses: number;
  variable_expenses: number;
  savings_goal: number;
  discretionary_spend: number;
}

const BudgetPlanner = () => {
  const { user } = useAuth();
  const [budget, setBudget] = useState<BudgetData>({
    income: 0,
    fixed_expenses: 0,
    variable_expenses: 0,
    savings_goal: 0,
    discretionary_spend: 0,
  });
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBudget();
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      if (!user) return;
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const data = await budgetService.getBudgetByUserAndMonth(user.id, currentMonth);
      
      if (data) {
        setCurrentBudget(data);
        setBudget({
          income: data.income || 0,
          fixed_expenses: data.fixed_expenses || 0,
          variable_expenses: data.variable_expenses || 0,
          savings_goal: data.savings_goal || 0,
          discretionary_spend: data.discretionary_spend || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Error al cargar el presupuesto');
    }
  };

  const saveBudget = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar tu presupuesto');
      return;
    }

    setIsLoading(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingBudget = await budgetService.getBudgetByUserAndMonth(user.id, currentMonth);

      const budgetData = {
        user_id: user.id,
        month: currentMonth,
        income: budget.income,
        fixed_expenses: budget.fixed_expenses,
        variable_expenses: budget.variable_expenses,
        savings_goal: budget.savings_goal,
        discretionary_spend: budget.discretionary_spend,
      };

      let savedBudget: Budget;
      if (existingBudget) {
        savedBudget = await budgetService.updateBudget(existingBudget.id, budgetData);
      } else {
        savedBudget = await budgetService.createBudget(budgetData);
      }

      setCurrentBudget(savedBudget);
      toast.success('Presupuesto guardado exitosamente');
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Error al guardar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BudgetData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    if (numericValue < 0) {
      toast.error('Los valores no pueden ser negativos');
      return;
    }
    
    setBudget(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const totalExpenses = budget.fixed_expenses + budget.variable_expenses;
  const remainingIncome = budget.income - totalExpenses - budget.savings_goal;

  // Calculate health analysis
  const healthAnalysis = currentBudget 
    ? budgetService.validateBudgetHealth(currentBudget)
    : { isHealthy: true, warnings: [], suggestions: [] };

  return (
    <div className="space-y-6">
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
                onChange={(e) => handleInputChange('income', e.target.value)}
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
                onChange={(e) => handleInputChange('fixed_expenses', e.target.value)}
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
                onChange={(e) => handleInputChange('variable_expenses', e.target.value)}
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
                onChange={(e) => handleInputChange('savings_goal', e.target.value)}
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
                onChange={(e) => handleInputChange('discretionary_spend', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Gastos:</span>
              <span>${totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Meta de Ahorro:</span>
              <span>${budget.savings_goal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Dinero Restante:</span>
              <span className={remainingIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${remainingIncome.toLocaleString()}
              </span>
            </div>
          </div>

          <Button 
            onClick={saveBudget} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Guardando...' : 'Guardar Presupuesto'}
          </Button>
        </CardContent>
      </Card>

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
