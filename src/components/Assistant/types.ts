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
  sender: 'assistant' | 'user';
  /** Marca de tiempo cuando se envió el mensaje */
  timestamp: Date;
}

/**
 * Estructura del contexto financiero que se envía al asistente
 */
export interface FinancialContext {
  /** Saldo actual considerando ingresos y gastos */
  balance: number;
  /** Total de ingresos registrados */
  totalIncome: number;
  /** Total de gastos registrados */
  totalExpenses: number;
  /** Diccionario que muestra gastos por categoría */
  expensesByCategory: Record<string, number>;
  /** Lista de transacciones recientes */
  recentTransactions: any[];
  /** Resumen de las transacciones */
  transactionsSummary: {
    /** Cantidad total de transacciones */
    count: number;
    /** Fecha de la transacción más antigua */
    oldestDate: string;
    /** Fecha de la transacción más reciente */
    newestDate: string;
  };
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
  /** Respuesta generada por el asistente */
  output: string;
} 