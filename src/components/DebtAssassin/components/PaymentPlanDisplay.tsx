import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DebtItem } from '@/types';
import MonthlyPlanDetail from './MonthlyPlanDetail';
import { formatCurrency, formatPercentage, PaymentPlanDetail } from '../utils/debtCalculations';

interface PaymentPlanDisplayProps {
  paymentPlan: PaymentPlanDetail;
  monthlyBudget: number;
  budgetPercentage: number;
  setBudgetPercentage: (percentage: number) => void;
  debts: DebtItem[];
  expandedMonth: number | null;
  setExpandedMonth: (month: number | null) => void;
  goToEditDebts: () => void;
}

const PaymentPlanDisplay: React.FC<PaymentPlanDisplayProps> = ({
  paymentPlan,
  monthlyBudget,
  budgetPercentage,
  setBudgetPercentage,
  debts,
  expandedMonth,
  setExpandedMonth,
  goToEditDebts
}) => {
  const { user } = useUser();

  const handleResetPlan = async () => {
    if (!confirm('¿Estás seguro que quieres eliminar tu plan de pagos y comenzar uno nuevo?')) return;
    const { error } = await supabase
      .from('debt_plans')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      alert('Ocurrió un error al eliminar el plan. Intenta nuevamente.');
      return;
    }

    window.location.reload();
  };

  return (
    <div className="space-y-5">
      <div className="bg-finflow-card rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">Tu Plan de Pagos Óptimo</h2>
        <div className="grid grid-cols-1 gap-4 mb-5">
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-3 text-sm">Meses para ser Libre</p>
            <div className="text-finflow-mint flex gap-2 text-4xl justify-center items-baseline">
              <span className="font-semibold">{paymentPlan.months}</span>
              <span className="text-xl font-[650]">meses</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-3 text-sm">Total Intereses</p>
            <div className="text-finflow-mint flex gap-1 text-4xl justify-center items-baseline">
              <span>$</span>
              <span className="font-semibold truncate">{formatCurrency(paymentPlan.totalInterest)}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-3 text-sm">Presupuesto Mensual</p>
            <div className="text-finflow-mint flex gap-1 text-4xl justify-center items-baseline">
              <span>$</span>
              <span className="font-semibold truncate">{formatCurrency(monthlyBudget)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <Label>Porcentaje de Ingreso para Deudas</Label>
            <span className="text-finflow-mint font-semibold">{formatPercentage(budgetPercentage)}%</span>
          </div>
          <Slider
            value={[budgetPercentage]}
            onValueChange={([value]) => setBudgetPercentage(value)}
            min={paymentPlan.recommendedPercentage}
            max={70}
            step={1}
            className="my-4"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="w-full bg-gray-800 text-white hover:bg-gray-700"
            onClick={goToEditDebts}
          >
            {debts.length > 0 ? 'Editar Mis Deudas' : 'Agregar Deudas'}
          </Button>
          {debts.length > 0 && (
            <Button
              className="w-full bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90"
              onClick={() => setExpandedMonth(1)}
            >
              Ver Plan de Pagos Mensual
            </Button>
          )}
          <Button
            className="w-full bg-red-700 text-white font-bold hover:bg-red-600"
            onClick={handleResetPlan}
          >
            Eliminar Plan de Pagos
          </Button>
        </div>
      </div>

      {expandedMonth && (
        <div className="bg-finflow-card rounded-2xl p-5">
          <h3 className="text-lg font-semibold mb-4">Desglose Mensual del Plan</h3>
          <div className="space-y-2">
            {paymentPlan.monthlyPlans.map((plan) => (
              <MonthlyPlanDetail
                key={plan.month}
                plan={plan}
                debts={debts}
                isExpanded={expandedMonth === plan.month}
                onToggle={() => setExpandedMonth(expandedMonth === plan.month ? null : plan.month)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPlanDisplay;
