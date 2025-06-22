
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

// Updated Transaction interface to match database schema
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string | null;
  amount: number;
  category: string;
  category_id: string | null;
  category_name: string | null;
  user_id: string;
  created_at: string | null;
  transaction_date: string;
  currency: string | null;
}
