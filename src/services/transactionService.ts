import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { FinancialContext, Transaction as AssistantTransaction, MonthlySummary, SavingGoal } from '@/components/Assistant/types';

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
 * Formatear las transacciones internas al formato que espera el asistente
 */
function formatTransactionsForAssistant(transactions: Transaction[]): AssistantTransaction[] {
  return transactions.map(transaction => ({
    id: transaction.id,
    amount: Number(transaction.amount),
    description: transaction.description,
    category: transaction.category?.name || 'Sin categoría',
    date: transaction.transaction_date || transaction.created_at,
    type: transaction.type
  }));
}

/**
 * Obtener datos del mes actual para resumen mensual
 */
async function getCurrentMonthSummary(transactions: Transaction[]): Promise<MonthlySummary> {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);
  
  // Filtrar transacciones del mes actual
  const currentMonthTransactions = transactions.filter(t => {
    const txDate = new Date(t.transaction_date || t.created_at);
    return txDate >= startOfCurrentMonth && txDate <= endOfCurrentMonth;
  });
  
  // Calcular ingresos y gastos del mes
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Encontrar la categoría con mayor gasto
  const categoryExpenses: Record<string, number> = {};
  
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const categoryName = transaction.category?.name || 'Sin categoría';
      if (!categoryExpenses[categoryName]) {
        categoryExpenses[categoryName] = 0;
      }
      categoryExpenses[categoryName] += Number(transaction.amount);
    });
  
  let topCategory = 'Sin categoría';
  let topExpenseAmount = 0;
  
  Object.entries(categoryExpenses).forEach(([category, amount]) => {
    if (amount > topExpenseAmount) {
      topCategory = category;
      topExpenseAmount = amount;
    }
  });
  
  return {
    totalIncome: monthlyIncome,
    totalExpenses: monthlyExpenses,
    topCategory,
    topExpenseAmount
  };
}

/**
 * Obtener metas de ahorro (simuladas para este ejemplo)
 */
function getSavingGoals(): SavingGoal[] {
  // En un escenario real, estas metas vendrían de la base de datos
  return [
    {
      id: '1',
      name: 'Fondo de emergencia',
      targetAmount: 5000000,
      currentAmount: 3250000,
    },
    {
      id: '2',
      name: 'Pagar tarjeta de crédito',
      targetAmount: 2500000,
      currentAmount: 750000,
    },
    {
      id: '3',
      name: 'Ahorrar para vacaciones',
      targetAmount: 1200000,
      currentAmount: 1080000,
    }
  ];
}

/**
 * Obtener resumen financiero para el asistente
 */
export async function getFinancialContextForAssistant(): Promise<FinancialContext> {
  try {
    // Obtener todas las transacciones
    const allTransactions = await getAllTransactions();
    
    // Calcular el balance
    const currentBalance = allTransactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + Number(transaction.amount);
      } else {
        return total - Number(transaction.amount);
      }
    }, 0);
    
    // Calcular gastos por categoría
    const expensesByCategory: Record<string, number> = {};
    
    allTransactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category?.name) {
        const categoryName = transaction.category.name;
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += Number(transaction.amount);
      }
    });
    
    // Calcular ingresos totales
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calcular gastos totales
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Obtener transacciones recientes para el contexto (ya formateadas)
    const recentDbTransactions = await getRecentTransactions(20); // Aumentamos a 20 para dar más contexto
    const recentTransactions = formatTransactionsForAssistant(recentDbTransactions);
    
    // Obtener resumen mensual
    const monthlySummary = await getCurrentMonthSummary(allTransactions);
    
    // Obtener metas de ahorro
    const savingGoals = getSavingGoals();
    
    // Imprimir para depuración
    console.log('Contexto financiero preparado para el asistente:', {
      recentTransactions: recentTransactions.length,
      expensesByCategory: Object.keys(expensesByCategory).length,
      monthlySummary,
      savingGoals: savingGoals.length
    });
    
    return {
      currentBalance,
      totalIncome,
      totalExpenses,
      expensesByCategory,
      recentTransactions,
      transactionsSummary: {
        count: allTransactions.length,
        oldestDate: allTransactions.length > 0 ? 
          format(new Date(allTransactions[allTransactions.length - 1].transaction_date || allTransactions[allTransactions.length - 1].created_at || ''), 'PP') : 
          'No data',
        newestDate: allTransactions.length > 0 ? 
          format(new Date(allTransactions[0].transaction_date || allTransactions[0].created_at || ''), 'PP') : 
          'No data',
      },
      monthlySummary,
      savingGoals
    };
  } catch (error) {
    console.error('Error generating financial context:', error);
    // Retornar valores por defecto en caso de error
    return {
      currentBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      expensesByCategory: {},
      recentTransactions: [],
      transactionsSummary: {
        count: 0,
        oldestDate: 'No data',
        newestDate: 'No data',
      },
      monthlySummary: {
        totalIncome: 0,
        totalExpenses: 0,
        topCategory: 'Sin categoría',
        topExpenseAmount: 0
      },
      savingGoals: []
    };
  }
} 