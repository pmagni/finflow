
import { supabase } from '@/integrations/supabase/client';

type HealthStatus = 'poor' | 'fair' | 'good' | 'excellent';

export interface FinancialHealthResult {
  score: number;
  status: HealthStatus;
  breakdown: {
    savingsScore: number;
    spendingScore: number;
    budgetScore: number;
    debtScore: number;
  };
  goals: {
    name: string;
    progress: number;
  }[];
  achievements: {
    name: string;
    unlocked: boolean;
    description: string;
  }[];
}

/**
 * Calculate savings score based on income vs spending
 * @param transactions All user transactions
 * @returns Score from 0-100
 */
const calculateSavingsScore = (transactions: any[]): number => {
  // Filter transactions from the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const recentTransactions = transactions.filter(transaction => 
    new Date(transaction.created_at) >= oneMonthAgo
  );
  
  // Calculate total income and expenses
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // If no income, return lowest score
  if (totalIncome <= 0) return 0;
  
  // Calculate savings rate
  const savingsRate = (totalIncome - totalExpenses) / totalIncome;
  
  // Assign score based on savings rate
  if (savingsRate >= 0.2) return 90; // Excellent: >20% savings
  if (savingsRate >= 0.1) return 70; // Good: 10-20% savings
  if (savingsRate >= 0.05) return 50; // Fair: 5-10% savings
  return 30; // Poor: <5% savings
};

/**
 * Calculate spending score based on category diversity and spending patterns
 * @param transactions All user transactions
 * @returns Score from 0-100
 */
const calculateSpendingScore = (transactions: any[]): number => {
  // Filter expense transactions from the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const expenses = transactions.filter(transaction => 
    transaction.type === 'expense' && 
    new Date(transaction.created_at) >= threeMonthsAgo
  );
  
  if (expenses.length === 0) return 50; // Neutral score if no expenses
  
  // Category diversity (higher is better)
  const categories = new Set(expenses.map(e => e.category));
  const categoryDiversityScore = Math.min(categories.size * 10, 40);
  
  // Spending consistency (lower volatility is better)
  // Group by month
  const monthlyExpenses: Record<string, number> = {};
  expenses.forEach(expense => {
    const month = new Date(expense.created_at).toISOString().slice(0, 7); // YYYY-MM format
    monthlyExpenses[month] = (monthlyExpenses[month] || 0) + Number(expense.amount);
  });
  
  const monthlyValues = Object.values(monthlyExpenses);
  if (monthlyValues.length <= 1) {
    return categoryDiversityScore + 30; // Just use category diversity if not enough data
  }
  
  // Calculate coefficient of variation (standard deviation / mean)
  const mean = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
  const variance = monthlyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyValues.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1; // Coefficient of variation
  
  // Lower CV means more consistent spending (better)
  const consistencyScore = Math.max(0, Math.min(30, 30 * (1 - cv)));
  
  // Essential vs. non-essential ratio score
  // For simplicity, we'll consider some categories as essential
  const essentialCategories = ['groceries', 'utilities', 'transport'];
  const essentialSpending = expenses
    .filter(e => essentialCategories.includes(e.category.toLowerCase()))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Better ratio if essential spending is 50-70% of total
  const essentialRatio = totalSpending > 0 ? essentialSpending / totalSpending : 0;
  const essentialScore = Math.max(0, 30 - Math.abs(essentialRatio - 0.6) * 60);
  
  return Math.min(100, categoryDiversityScore + consistencyScore + essentialScore);
};

/**
 * Placeholder for budget score calculation
 * In a real app, this would compare actual spending to budget limits
 */
const calculateBudgetScore = (transactions: any[]): number => {
  // Since we don't have actual budget data, this is a simplified version
  // In a real app, you would compare spending by category against budget limits
  
  // For demo purposes, let's assume consistent spending is good budgeting
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const recentExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    new Date(t.created_at) >= oneMonthAgo
  );
  
  if (recentExpenses.length <= 3) return 50; // Not enough data
  
  // Group by category
  const categoryExpenses: Record<string, number[]> = {};
  recentExpenses.forEach(expense => {
    if (!categoryExpenses[expense.category]) {
      categoryExpenses[expense.category] = [];
    }
    categoryExpenses[expense.category].push(Number(expense.amount));
  });
  
  // Calculate variance for each category (lower variance = more consistent = better budgeting)
  const categoryVariances: number[] = [];
  Object.values(categoryExpenses).forEach(amounts => {
    if (amounts.length >= 2) {
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      categoryVariances.push(variance / Math.pow(mean, 2)); // Normalized variance
    }
  });
  
  if (categoryVariances.length === 0) return 50;
  
  const avgVariance = categoryVariances.reduce((sum, v) => sum + v, 0) / categoryVariances.length;
  
  // Lower variance = higher score
  return Math.min(100, Math.max(0, 100 - avgVariance * 200));
};

/**
 * Placeholder for debt management score
 * In a real app, this would analyze debt-related transactions
 */
const calculateDebtScore = (transactions: any[]): number => {
  // Since we don't have explicit debt data, use income vs expense as proxy
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.created_at) >= sixMonthsAgo
  );
  
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // If no income or expenses, return average score
  if (totalIncome === 0 || totalExpenses === 0) return 50;
  
  // Expense to income ratio (lower is better)
  const expenseToIncomeRatio = totalExpenses / totalIncome;
  
  if (expenseToIncomeRatio <= 0.5) return 90; // Excellent
  if (expenseToIncomeRatio <= 0.7) return 75; // Good
  if (expenseToIncomeRatio <= 0.9) return 55; // Fair
  if (expenseToIncomeRatio <= 1.0) return 40; // Poor
  return 20; // Very poor
};

/**
 * Calculate financial goals based on transaction history
 */
const calculateGoals = (transactions: any[]): { name: string, progress: number }[] => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.created_at) >= oneMonthAgo
  );
  
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Calculate savings rate
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  
  // Calculate category spending
  const categorySpending: Record<string, number> = {};
  recentTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });
  
  // Define goals based on actual spending patterns
  const goals = [
    { 
      name: 'Save 15% of income', 
      progress: Math.min(1, savingsRate / 0.15) 
    }
  ];
  
  // If food spending is significant, add a goal to reduce it
  if (categorySpending['food'] && totalExpenses > 0) {
    const foodRatio = categorySpending['food'] / totalExpenses;
    if (foodRatio > 0.2) {
      goals.push({
        name: 'Reduce food spending by 15%',
        progress: Math.min(1, Math.max(0, (0.3 - foodRatio) / 0.1))
      });
    }
  }
  
  // If we have spending in multiple categories, add a budget adherence goal
  if (Object.keys(categorySpending).length >= 3) {
    goals.push({
      name: 'Pay off credit card',
      progress: 0.3 // Placeholder progress
    });
  }
  
  return goals;
};

/**
 * Calculate achievements based on transaction history
 */
const calculateAchievements = (transactions: any[]): { name: string, unlocked: boolean, description: string }[] => {
  // Basic achievements
  const achievements = [
    {
      name: 'Budget Beginner',
      unlocked: transactions.length > 0, 
      description: 'Set up your first budget'
    },
    {
      name: 'Saving Specialist',
      unlocked: false,
      description: 'Save money for 3 consecutive months'
    },
    {
      name: 'Debt Destroyer',
      unlocked: false,
      description: 'Pay off a debt completely'
    }
  ];
  
  // Check for consistent income (indication of regular savings)
  if (transactions.length > 0) {
    const incomeMonths = new Set();
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeMonths.add(new Date(t.created_at).toISOString().slice(0, 7));
      });
    
    if (incomeMonths.size >= 3) {
      achievements[1].unlocked = true; // Unlock Saving Specialist
    }
  }
  
  return achievements;
};

/**
 * Get the overall status based on the score
 */
const getHealthStatus = (score: number): HealthStatus => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

/**
 * Calculate the overall financial health score and details
 */
export async function calculateFinancialHealth(): Promise<FinancialHealthResult> {
  try {
    // Fetch user transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*');
    
    if (error) {
      console.error('Error fetching transactions for health calculation:', error);
      throw error;
    }
    
    const transactionsData = transactions || [];
    
    // Calculate individual scores
    const savingsScore = calculateSavingsScore(transactionsData);
    const spendingScore = calculateSpendingScore(transactionsData);
    const budgetScore = calculateBudgetScore(transactionsData);
    const debtScore = calculateDebtScore(transactionsData);
    
    // Calculate overall score (equal weighting)
    const overallScore = Math.round((savingsScore + spendingScore + budgetScore + debtScore) / 4);
    
    // Get goals and achievements
    const goals = calculateGoals(transactionsData);
    const achievements = calculateAchievements(transactionsData);
    
    return {
      score: overallScore,
      status: getHealthStatus(overallScore),
      breakdown: {
        savingsScore,
        spendingScore,
        budgetScore,
        debtScore
      },
      goals,
      achievements
    };
  } catch (error) {
    console.error('Error calculating financial health:', error);
    
    // Return default values if calculation fails
    return {
      score: 50,
      status: 'fair',
      breakdown: {
        savingsScore: 50,
        spendingScore: 50,
        budgetScore: 50,
        debtScore: 50
      },
      goals: [
        { name: 'Save $500 emergency fund', progress: 0.5 },
        { name: 'Reduce food spending by 15%', progress: 0.3 },
        { name: 'Pay off credit card', progress: 0.2 },
      ],
      achievements: [
        { name: 'Budget Beginner', unlocked: true, description: 'Set up your first budget' },
        { name: 'Saving Specialist', unlocked: false, description: 'Save money for 3 consecutive months' },
        { name: 'Debt Destroyer', unlocked: false, description: 'Pay off a debt completely' },
      ]
    };
  }
}
