import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { FinancialContext } from '@/components/Assistant/types';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category_id: string;
  user_id: string;
  transaction_date?: string;
  created_at: string;
  category?: {
    name: string;
    icon: string;
  };
}

/**
 * Obtener todas las transacciones, ordenadas por fecha
 */
export async function getAllTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data as unknown as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Obtener transacciones recientes
 */
export async function getRecentTransactions(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as unknown as Transaction[];
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

/**
 * Obtener transacciones por tipo (income/expense)
 */
export async function getTransactionsByType(type: 'income' | 'expense') {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .eq('type', type)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data as unknown as Transaction[];
  } catch (error) {
    console.error(`Error fetching ${type} transactions:`, error);
    return [];
  }
}

/**
 * Obtener transacciones por categoría
 */
export async function getTransactionsByCategory(categoryId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .eq('category_id', categoryId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data as unknown as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions by category:', error);
    return [];
  }
}

/**
 * Obtener transacciones por rango de fechas
 */
export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data as unknown as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    return [];
  }
}

/**
 * Obtener resumen financiero para el asistente
 */
export async function getFinancialContextForAssistant(): Promise<FinancialContext> {
  try {
    // Obtener todas las transacciones
    const transactions = await getAllTransactions();
    
    // Calcular el balance
    const balance = transactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + Number(transaction.amount);
      } else {
        return total - Number(transaction.amount);
      }
    }, 0);
    
    // Calcular gastos por categoría
    const expensesByCategory: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category?.name) {
        const categoryName = transaction.category.name;
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += Number(transaction.amount);
      }
    });
    
    // Calcular ingresos totales
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calcular gastos totales
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Obtener transacciones recientes para el contexto
    const recentTransactions = await getRecentTransactions(10);
    
    return {
      balance,
      totalIncome,
      totalExpenses,
      expensesByCategory,
      recentTransactions,
      transactionsSummary: {
        count: transactions.length,
        oldestDate: transactions.length > 0 ? 
          format(new Date(transactions[transactions.length - 1].created_at || ''), 'PP') : 
          'No data',
        newestDate: transactions.length > 0 ? 
          format(new Date(transactions[0].created_at || ''), 'PP') : 
          'No data',
      }
    };
  } catch (error) {
    console.error('Error generating financial context:', error);
    return {
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      expensesByCategory: {},
      recentTransactions: [],
      transactionsSummary: {
        count: 0,
        oldestDate: 'No data',
        newestDate: 'No data',
      }
    };
  }
} 