
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { budgetService, type Budget } from '@/services/budgetService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toast } from 'sonner';

interface BudgetData {
  income: number;
  fixed_expenses: number;
  variable_expenses: number;
  savings_goal: number;
  discretionary_spend: number;
}

export const useBudget = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [budget, setBudget] = useState<BudgetData>({
    income: 0,
    fixed_expenses: 0,
    variable_expenses: 0,
    savings_goal: 0,
    discretionary_spend: 0,
  });
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBudget();
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      if (!user) return;
      
      setIsFetching(true);
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
      handleError(error);
    } finally {
      setIsFetching(false);
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
    } catch (error) {
      handleError(error);
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

  const getHealthAnalysis = () => {
    return currentBudget 
      ? budgetService.validateBudgetHealth(currentBudget)
      : { isHealthy: true, warnings: [], suggestions: [] };
  };

  return {
    budget,
    currentBudget,
    isLoading,
    isFetching,
    saveBudget,
    handleInputChange,
    getHealthAnalysis,
    refetch: fetchBudget
  };
};
