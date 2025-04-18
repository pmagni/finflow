
import { supabase } from '@/integrations/supabase/client';
import { Expense, FinancialHealthScore } from "../types";

export async function getExpensesByMonth() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  const monthlyExpenses: Record<string, Record<string, number>> = {};
  
  transactions?.forEach(transaction => {
    const date = new Date(transaction.created_at || '');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!monthlyExpenses[key]) {
      monthlyExpenses[key] = {};
    }
    
    if (!monthlyExpenses[key][transaction.category]) {
      monthlyExpenses[key][transaction.category] = 0;
    }
    
    if (transaction.type === 'expense') {
      monthlyExpenses[key][transaction.category] += Number(transaction.amount);
    }
  });
  
  return monthlyExpenses;
}

export function getFormattedDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function getTotalExpenses() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*');

  return transactions?.reduce((total, transaction) => {
    if (transaction.type === 'expense') {
      return total + Number(transaction.amount);
    }
    return total;
  }, 0) || 0;
}

export async function getRecentExpenses(limit = 10) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return transactions || [];
}

export function getFinancialHealthScore(): FinancialHealthScore {
  // In a real app, this would be calculated based on actual financial data
  return {
    score: 78,
    status: 'good',
    goals: [
      { name: 'Save $500 emergency fund', progress: 0.8 },
      { name: 'Reduce food spending by 15%', progress: 0.5 },
      { name: 'Pay off credit card', progress: 0.3 },
    ],
    achievements: [
      { name: 'Budget Beginner', unlocked: true, description: 'Set up your first budget' },
      { name: 'Saving Specialist', unlocked: true, description: 'Save money for 3 consecutive months' },
      { name: 'Debt Destroyer', unlocked: false, description: 'Pay off a debt completely' },
    ]
  };
}

export async function getCategoryTotal(category: string) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('category', category);

  return transactions?.reduce((total, transaction) => {
    if (transaction.type === 'expense') {
      return total + Number(transaction.amount);
    }
    return total;
  }, 0) || 0;
}

export async function getExpensesByCategory() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*');

  const categories: Record<string, number> = {};
  
  transactions?.forEach(transaction => {
    if (transaction.type === 'expense') {
      if (!categories[transaction.category]) {
        categories[transaction.category] = 0;
      }
      categories[transaction.category] += Number(transaction.amount);
    }
  });
  
  return categories;
}
