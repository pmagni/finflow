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

export interface TransactionError extends Error {
  code: string;
}

export interface MonthlyTransactionSummary {
  income: {
    total: number;
    byCategory: Record<string, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  balance: number;
  availableMonths: Array<{
    month: number;
    year: number;
    label: string;
  }>;
}

class TransactionService {
  private static instance: TransactionService;
  
  private constructor() {}
  
  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  private handleError(error: any): never {
    console.error('Error en el servicio de transacciones:', error);
    throw new Error(error.message || 'Error desconocido') as TransactionError;
  }

  async getTransactionsByMonth(month: number, year: number): Promise<MonthlyTransactionSummary> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) throw error;

      const summary: MonthlyTransactionSummary = {
        income: { total: 0, byCategory: {} },
        expenses: { total: 0, byCategory: {} },
        balance: 0,
        availableMonths: []
      };

      transactions.forEach(transaction => {
        const amount = Number(transaction.amount);
        const category = transaction.category?.name || 'Sin categoría';
        
        if (amount > 0) {
          summary.income.total += amount;
          summary.income.byCategory[category] = (summary.income.byCategory[category] || 0) + amount;
        } else {
          summary.expenses.total += Math.abs(amount);
          summary.expenses.byCategory[category] = (summary.expenses.byCategory[category] || 0) + Math.abs(amount);
        }
      });

      summary.balance = summary.income.total - summary.expenses.total;

      // Obtener meses disponibles
      const { data: availableMonths, error: monthsError } = await supabase
        .from('transactions')
        .select('transaction_date')
        .order('transaction_date', { ascending: false });

      if (monthsError) throw monthsError;

      const uniqueMonths = new Set<string>();
      availableMonths.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        uniqueMonths.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
      });

      summary.availableMonths = Array.from(uniqueMonths).map(dateStr => {
        const [year, month] = dateStr.split('-').map(Number);
        return {
          month,
          year,
          label: new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        };
      });

      return summary;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const transactionService = TransactionService.getInstance();

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
 * Obtener transacciones por mes y año específicos
 */
export async function getTransactionsByMonth(month: number, year: number): Promise<MonthlyTransactionSummary> {
  try {
    // Crear fechas para el primer día y último día del mes
    const startDate = new Date(year, month - 1, 1); // month es 1-12, pero Date usa 0-11
    const endDate = endOfMonth(startDate);
    
    // Formatear fechas para Supabase
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Obtener transacciones del mes especificado
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .gte('transaction_date', startDateStr)
      .lte('transaction_date', endDateStr)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    
    // Inicializar estructuras de datos para el resumen
    const summary: MonthlyTransactionSummary = {
      expenses: {
        byCategory: {},
        total: 0
      },
      income: {
        byCategory: {},
        total: 0
      },
      balance: 0,
      availableMonths: []
    };
    
    // Agrupar transacciones por tipo y categoría
    transactions?.forEach(transaction => {
      const amount = Number(transaction.amount);
      const categoryName = transaction.category?.name || 'Sin categoría';
      
      if (transaction.type === 'expense') {
        if (!summary.expenses.byCategory[categoryName]) {
          summary.expenses.byCategory[categoryName] = 0;
        }
        summary.expenses.byCategory[categoryName] += amount;
        summary.expenses.total += amount;
      } else if (transaction.type === 'income') {
        if (!summary.income.byCategory[categoryName]) {
          summary.income.byCategory[categoryName] = 0;
        }
        summary.income.byCategory[categoryName] += amount;
        summary.income.total += amount;
      }
    });
    
    // Calcular balance
    summary.balance = summary.income.total - summary.expenses.total;
    
    // Obtener la lista de meses disponibles en la base de datos
    const { data: distinctDates, error: datesError } = await supabase
      .from('transactions')
      .select('transaction_date')
      .order('transaction_date', { ascending: false });
    
    if (!datesError && distinctDates) {
      const monthsSet = new Set<string>();
      
      distinctDates.forEach(item => {
        if (item.transaction_date) {
          const date = new Date(item.transaction_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          monthsSet.add(monthKey);
        }
      });
      
      summary.availableMonths = Array.from(monthsSet).map(key => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        // Nombre del mes en español
        const monthName = date.toLocaleString('es-ES', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        
        return {
          month,
          year,
          label: `${capitalizedMonth} ${year}`
        };
      });
      
      // Ordenar por fecha descendente (más reciente primero)
      summary.availableMonths.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    }
    
    return summary;
  } catch (error) {
    console.error('Error fetching transactions by month:', error);
    return {
      expenses: { byCategory: {}, total: 0 },
      income: { byCategory: {}, total: 0 },
      balance: 0,
      availableMonths: []
    };
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