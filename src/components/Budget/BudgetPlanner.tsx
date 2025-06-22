
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BudgetData {
  income: number;
  fixed_expenses: number;
  variable_expenses: number;
  savings_goal: number;
  discretionary_spend: number;
}

interface BudgetRow {
  id: string;
  user_id: string;
  month: string | null;
  income: number | null;
  fixed_expenses: number | null;
  variable_expenses: number | null;
  savings_goal: number | null;
  discretionary_spend: number | null;
  created_at: string | null;
  updated_at: string | null;
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBudget();
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets' as any)
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const budgetRow = data as BudgetRow;
        setBudget({
          income: budgetRow.income || 0,
          fixed_expenses: budgetRow.fixed_expenses || 0,
          variable_expenses: budgetRow.variable_expenses || 0,
          savings_goal: budgetRow.savings_goal || 0,
          discretionary_spend: budgetRow.discretionary_spend || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const saveBudget = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar tu presupuesto');
      return;
    }

    setIsLoading(true);

    try {
      const budgetData = {
        ...budget,
        user_id: user.id,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      };

      const { error } = await supabase
        .from('budgets' as any)
        .upsert(budgetData);

      if (error) throw error;

      toast.success('Presupuesto guardado exitosamente');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Error al guardar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BudgetData, value: string) => {
    setBudget(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const totalExpenses = budget.fixed_expenses + budget.variable_expenses;
  const remainingIncome = budget.income - totalExpenses - budget.savings_goal;

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
    </div>
  );
};

export default BudgetPlanner;
