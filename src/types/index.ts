export interface Expense {
  date: string;
  category: string;
  amount: number;
  timeStamp: string;
  currency: string;
}

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  totalPayments: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface FinancialHealthScore {
  score: number;
  status: 'poor' | 'fair' | 'good' | 'excellent';
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

// Add the missing Transaction interface
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category_id: string | null;
  user_id: string | null;
  created_at: string | null;
  transaction_date: string | null;
  currency: string | null;
  category?: {
    name: string;
    icon: string;
  } | null;
}
