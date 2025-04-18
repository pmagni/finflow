
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
