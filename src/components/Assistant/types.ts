/**
 * Tipos compartidos para el módulo del Asistente Financiero
 */

/**
 * Representa un mensaje en la conversación del chat
 */
export interface Message {
  /** Identificador único del mensaje */
  id: string;
  /** Contenido del mensaje */
  text: string;
  /** Indica si el mensaje es del asistente o del usuario */
  sender: 'user' | 'assistant';
  /** Marca de tiempo cuando se envió el mensaje */
  timestamp: Date;
}

/**
 * Estructura del contexto financiero que se envía al asistente
 */
export interface FinancialContext {
  /** Saldo actual considerando ingresos y gastos */
  currentBalance: number;
  /** Total de ingresos registrados */
  totalIncome: number;
  /** Total de gastos registrados */
  totalExpenses: number;
  /** Diccionario que muestra gastos por categoría */
  expensesByCategory: Record<string, number>;
  /** Lista de transacciones recientes */
  recentTransactions: Transaction[];
  /** Resumen de las transacciones */
  transactionsSummary: {
    /** Cantidad total de transacciones */
    count: number;
    /** Fecha de la transacción más antigua */
    oldestDate: string;
    /** Fecha de la transacción más reciente */
    newestDate: string;
  };
  monthlySummary: MonthlySummary;
  savingGoals: SavingGoal[];
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  topCategory: string;
  topExpenseAmount: number;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
}

/**
 * Estructura de un mensaje enviado al webhook del asistente
 */
export interface AssistantRequestPayload {
  /** Mensaje del usuario */
  message: string;
  /** Contexto financiero completo */
  financialContext: FinancialContext;
}

/**
 * Estructura de respuesta del webhook del asistente
 */
export interface AssistantResponsePayload {
  responseType: string;
  message: string | AssistantMessage;
  emotion?: string;
  confidence?: number;
  breakdown?: {
    title: string;
    total: number;
    currency: string;
    items: {
      category: string;
      amount: number;
      percentage: number;
      trend: string;
      trendPercentage: number;
    }[];
    comparisonPeriod?: string;
  };
  chartData?: {
    chartType: string;
    title: string;
    xAxis: {
      label: string;
      data: string[];
    };
    series: {
      name: string;
      data: number[];
      color: string;
    }[];
    legendPosition: string;
    dataLabels: boolean;
  };
  actions?: AssistantAction[];
  relatedQueries?: string[];
  output?: string;
}

export interface AssistantMessage {
  content: string;
  details?: string[];
  summary?: string;
}

export interface AssistantAction {
  type: string;
  description: string;
  data?: any;
}

/**
 * Representa una conversación completa con el asistente
 */
export interface Conversation {
  /** Identificador único de la conversación */
  id: string;
  /** ID del usuario propietario de la conversación */
  user_id: string;
  /** Título de la conversación */
  title: string;
  /** Fecha de creación */
  created_at: string;
  /** Fecha de última actualización */
  updated_at: string;
  /** Lista de mensajes en la conversación */
  messages: Message[];
} 