
import { Expense, FinancialHealthScore } from "../types";

// Mock data provided
export const expenses: Expense[] = [
  // --- 2024 MOCK DATA ---
  { date: '2024-10-10', category: 'food', amount: 12, timeStamp: '12:15PM', currency: '$' },
  { date: '2024-10-12', category: 'transport', amount: 22, timeStamp: '07:45AM', currency: '$' },
  { date: '2024-10-28', category: 'groceries', amount: 85, timeStamp: '05:30PM', currency: '$' },
  { date: '2024-11-05', category: 'entertainment', amount: 40, timeStamp: '08:00PM', currency: '$' },
  { date: '2024-11-11', category: 'food', amount: 18, timeStamp: '01:30PM', currency: '$' },
  { date: '2024-11-23', category: 'subscriptions', amount: 12, timeStamp: '10:00AM', currency: '$' },
  { date: '2024-12-01', category: 'utilities', amount: 90, timeStamp: '03:20PM', currency: '$' },
  { date: '2024-12-17', category: 'groceries', amount: 130, timeStamp: '06:45PM', currency: '$' },
  { date: '2024-12-21', category: 'transport', amount: 55, timeStamp: '09:00AM', currency: '$' },
  { date: '2024-12-29', category: 'gifts', amount: 75, timeStamp: '04:50PM', currency: '$' },

  // --- 2025 MOCK DATA ---
  { date: '2025-01-05', category: 'food', amount: 15, timeStamp: '11:00AM', currency: '$' },
  { date: '2025-01-12', category: 'transport', amount: 40, timeStamp: '08:30AM', currency: '$' },
  { date: '2025-01-20', category: 'entertainment', amount: 30, timeStamp: '09:15PM', currency: '$' },
  { date: '2025-01-25', category: 'subscriptions', amount: 10, timeStamp: '08:00AM', currency: '$' },
  { date: '2025-02-03', category: 'groceries', amount: 120, timeStamp: '04:00PM', currency: '$' },
  { date: '2025-02-07', category: 'gifts', amount: 60, timeStamp: '05:15PM', currency: '$' },
  { date: '2025-02-11', category: 'food', amount: 18, timeStamp: '01:00PM', currency: '$' },
  { date: '2025-02-25', category: 'transport', amount: 60, timeStamp: '07:45AM', currency: '$' },
  { date: '2025-03-01', category: 'utilities', amount: 95, timeStamp: '02:30PM', currency: '$' },
  { date: '2025-03-05', category: 'transport', amount: 35, timeStamp: '10:30AM', currency: '$' },
  { date: '2025-03-12', category: 'food', amount: 15, timeStamp: '11:00AM', currency: '$' },
  { date: '2025-03-15', category: 'food', amount: 22, timeStamp: '12:45PM', currency: '$' },
  { date: '2025-03-19', category: 'entertainment', amount: 50, timeStamp: '09:00PM', currency: '$' },
  { date: '2025-03-22', category: 'entertainment', amount: 45, timeStamp: '08:50PM', currency: '$' },
  { date: '2025-03-28', category: 'groceries', amount: 110, timeStamp: '06:15PM', currency: '$' },
];

export function getExpensesByMonth() {
  const monthlyExpenses: Record<string, Record<string, number>> = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!monthlyExpenses[key]) {
      monthlyExpenses[key] = {};
    }
    
    if (!monthlyExpenses[key][expense.category]) {
      monthlyExpenses[key][expense.category] = 0;
    }
    
    monthlyExpenses[key][expense.category] += expense.amount;
  });
  
  return monthlyExpenses;
}

export function getFormattedDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getTotalExpenses() {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getRecentExpenses(limit = 10) {
  return [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
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

export function getCategoryTotal(category: string) {
  return expenses
    .filter(expense => expense.category === category)
    .reduce((total, expense) => total + expense.amount, 0);
}

export function getExpensesByCategory() {
  const categories: Record<string, number> = {};
  
  expenses.forEach(expense => {
    if (!categories[expense.category]) {
      categories[expense.category] = 0;
    }
    categories[expense.category] += expense.amount;
  });
  
  return categories;
}
