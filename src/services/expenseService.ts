import { supabase } from '@/integrations/supabase/client';
import { Expense, FinancialHealthScore } from "../types";

export async function getExpensesByMonth() {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .eq('type', 'expense')
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    const monthlyExpenses: Record<string, Record<string, number>> = {};
    
    transactions?.forEach(transaction => {
      // Verificar que sea una transacción de gasto y que el monto sea válido
      if (transaction.type !== 'expense' || !transaction.amount) return;
      
      const dateToUse = transaction.transaction_date || transaction.created_at;
      const date = new Date(dateToUse || '');
      // Usar el formato es-CL para mantener consistencia con el resto de la app
      const month = date.toLocaleString('es-CL', { month: 'long' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (!monthlyExpenses[key]) {
        monthlyExpenses[key] = {};
      }
      
      const categoryName = transaction.category?.name || 'Sin categoría';
      
      if (!monthlyExpenses[key][categoryName]) {
        monthlyExpenses[key][categoryName] = 0;
      }
      
      // Asegurar que el monto sea positivo
      const amount = Math.abs(Number(transaction.amount));
      monthlyExpenses[key][categoryName] += amount;
    });

    // Ordenar los meses de más reciente a más antiguo
    const sortedMonthlyExpenses: Record<string, Record<string, number>> = {};
    Object.keys(monthlyExpenses)
      .sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateB.getTime() - dateA.getTime();
      })
      .forEach(key => {
        sortedMonthlyExpenses[key] = monthlyExpenses[key];
      });
    
    return sortedMonthlyExpenses;
  } catch (error) {
    console.error('Error fetching expenses by month:', error);
    return {};
  }
}

export function getFormattedDate(dateString: string | null | undefined) {
  if (!dateString) {
    return 'No date';
  }
  
  try {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export async function getTotalExpenses() {
  try {
    const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*');

    if (error) throw error;

  return transactions?.reduce((total, transaction) => {
    if (transaction.type === 'expense') {
        return total + Number(transaction.amount || 0);
    }
    return total;
  }, 0) || 0;
  } catch (error) {
    console.error('Error calculating total expenses:', error);
    return 0;
  }
}

export async function getRecentExpenses(limit = 10) {
  try {
    const { data, error } = await supabase
    .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
    .order('created_at', { ascending: false })
    .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    return [];
  }
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
  try {
    const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
      .eq('category_id', category);

    if (error) throw error;

  return transactions?.reduce((total, transaction) => {
    if (transaction.type === 'expense') {
        return total + Number(transaction.amount || 0);
    }
    return total;
  }, 0) || 0;
  } catch (error) {
    console.error('Error calculating category total:', error);
    return 0;
  }
}

export async function getExpensesByCategory() {
  try {
    const { data: transactions, error } = await supabase
    .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `);

    if (error) throw error;

  const categories: Record<string, number> = {};
  
  transactions?.forEach(transaction => {
    if (transaction.type === 'expense') {
        const categoryName = transaction.category?.name || 'Uncategorized';
        
        if (!categories[categoryName]) {
          categories[categoryName] = 0;
      }
        categories[categoryName] += Number(transaction.amount || 0);
    }
  });
  
  return categories;
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    return {};
  }
}
