
import { DebtItem } from '@/types';

// Función para formatear números como moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para formatear porcentajes
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Función para parsear string formateado a número
export const parseCurrencyString = (value: string): number => {
  return Number(value.replace(/[^0-9-]/g, ''));
};

export interface MonthlyPayment {
  debtId: string;
  minimumPayment: number;
  extraPayment: number;
  interestPaid: number;
  remainingBalance: number;
  isPaidOff: boolean;
}

export interface MonthlyPlan {
  month: number;
  payments: MonthlyPayment[];
  totalPayment: number;
}

export interface PaymentPlanDetail {
  months: number;
  totalInterest: number;
  recommendedPercentage: number;
  monthlyPlans: MonthlyPlan[];
}

export type PaymentStrategy = 'snowball' | 'avalanche' | 'proportional';

export const STRATEGY_DESCRIPTIONS = {
  snowball: 'El método bola de nieve se enfoca en pagar primero las deudas más pequeñas, sin importar las tasas de interés. Esto crea impulso y motivación al ver desaparecer las deudas rápidamente.',
  avalanche: 'El método avalancha prioriza el pago de las deudas con las tasas de interés más altas primero. Esto minimiza el interés total pagado y es matemáticamente más eficiente.',
  proportional: 'El método proporcional distribuye el pago extra proporcionalmente entre todas las deudas según su saldo. Es un enfoque equilibrado que reduce todas las deudas gradualmente.'
};

export const calculatePaymentPlan = (
  debts: DebtItem[],
  monthlyBudget: number,
  selectedStrategy: PaymentStrategy,
  monthlyIncome: number
): PaymentPlanDetail => {
  if (debts.length === 0) {
    return { months: 0, totalInterest: 0, recommendedPercentage: 0, monthlyPlans: [] };
  }
  
  let debtsCopy = [...debts].map(debt => ({ ...debt }));
  
  // Ordenar según la estrategia seleccionada
  if (selectedStrategy === 'snowball') {
    debtsCopy.sort((a, b) => a.balance - b.balance);
  } else if (selectedStrategy === 'avalanche') {
    debtsCopy.sort((a, b) => b.interestRate - a.interestRate);
  }
  
  let remainingDebts = debtsCopy;
  let totalInterest = 0;
  let months = 0;
  let monthlyPlans: MonthlyPlan[] = [];
  
  // Calcular porcentaje mínimo recomendado
  const totalMinimumPayments = debtsCopy.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const recommendedPercentage = Math.ceil((totalMinimumPayments / monthlyIncome) * 100);
  
  while (remainingDebts.length > 0 && months < 360) { // Límite de 30 años
    months++;
    let availableBudget = monthlyBudget;
    let monthlyPayments: MonthlyPayment[] = [];
    let monthTotalPayment = 0;
    
    // Pagar mínimos en todas las deudas
    remainingDebts.forEach(debt => {
      const minimumPayment = Math.min(debt.minimumPayment, debt.balance);
      availableBudget -= minimumPayment;
      
      const monthlyInterest = debt.balance * (debt.interestRate / 100 / 12);
      totalInterest += monthlyInterest;
      
      const newBalance = Math.max(0, debt.balance - minimumPayment + monthlyInterest);
      
      monthlyPayments.push({
        debtId: debt.id,
        minimumPayment,
        extraPayment: 0,
        interestPaid: monthlyInterest,
        remainingBalance: newBalance,
        isPaidOff: newBalance === 0
      });
      
      monthTotalPayment += minimumPayment;
      debt.balance = newBalance;
    });
    
    // Usar presupuesto restante según la estrategia
    if (availableBudget > 0) {
      if (selectedStrategy === 'proportional') {
        // Distribuir proporcionalmente
        const totalBalance = remainingDebts.reduce((sum, debt) => sum + debt.balance, 0);
        remainingDebts.forEach(debt => {
          if (debt.balance > 0) {
            const proportion = debt.balance / totalBalance;
            const extraPayment = availableBudget * proportion;
            const payment = monthlyPayments.find(p => p.debtId === debt.id);
            if (payment) {
              payment.extraPayment = extraPayment;
              payment.remainingBalance = Math.max(0, payment.remainingBalance - extraPayment);
              payment.isPaidOff = payment.remainingBalance === 0;
              monthTotalPayment += extraPayment;
            }
            debt.balance = payment?.remainingBalance || 0;
          }
        });
      } else {
        // Snowball o Avalanche: pagar extra a la primera deuda
        const firstDebt = remainingDebts[0];
        const payment = monthlyPayments.find(p => p.debtId === firstDebt.id);
        if (payment) {
          payment.extraPayment = availableBudget;
          payment.remainingBalance = Math.max(0, payment.remainingBalance - availableBudget);
          payment.isPaidOff = payment.remainingBalance === 0;
          monthTotalPayment += availableBudget;
        }
        firstDebt.balance = payment?.remainingBalance || 0;
      }
    }
    
    monthlyPlans.push({
      month: months,
      payments: monthlyPayments,
      totalPayment: monthTotalPayment
    });
    
    remainingDebts = remainingDebts.filter(debt => debt.balance > 0);
  }
  
  return {
    months,
    totalInterest: Math.round(totalInterest),
    recommendedPercentage,
    monthlyPlans
  };
};

// Validate debt before saving
export const isDebtValid = (debt: DebtItem): boolean => {
  return (
    debt.name.trim() !== '' &&
    debt.balance > 0 &&
    debt.interestRate > 0 &&
    debt.minimumPayment > 0 &&
    debt.totalPayments > 0
  );
};
