
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DebtItem } from '@/types';
import { MonthlyPlan } from '../utils/debtCalculations';
import { formatCurrency } from '../utils/debtCalculations';

interface MonthlyPlanDetailProps {
  plan: MonthlyPlan;
  debts: DebtItem[];
  isExpanded: boolean;
  onToggle: () => void;
}

const MonthlyPlanDetail: React.FC<MonthlyPlanDetailProps> = ({
  plan,
  debts,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="bg-gray-900 rounded-xl p-4 mb-3">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <span className="text-finflow-mint font-semibold">Mes {plan.month}</span>
          <span className="text-gray-400">
            Pago Total: <span className="text-white">${formatCurrency(plan.totalPayment)}</span>
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {plan.payments.map((payment) => {
            const debt = debts.find(d => d.id === payment.debtId);
            if (!debt) return null;

            return (
              <div key={payment.debtId} className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{debt.name}</span>
                  {payment.isPaidOff && (
                    <span className="text-green-500 text-sm">¡Deuda Pagada!</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Pago Mínimo:</span>
                    <span className="ml-2">${formatCurrency(payment.minimumPayment)}</span>
                  </div>
                  
                  {payment.extraPayment > 0 && (
                    <div>
                      <span className="text-gray-400">Pago Extra:</span>
                      <span className="ml-2 text-finflow-mint">+${formatCurrency(payment.extraPayment)}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-400">Interés Pagado:</span>
                    <span className="ml-2 text-red-400">${formatCurrency(payment.interestPaid)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Saldo Restante:</span>
                    <span className="ml-2">${formatCurrency(payment.remainingBalance)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanDetail;
