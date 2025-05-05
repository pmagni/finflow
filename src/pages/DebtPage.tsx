import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import DebtCalculator from '@/components/DebtAssassin/DebtCalculator';
import PaymentPlanDisplay from '@/components/DebtAssassin/components/PaymentPlanDisplay';
import { DebtItem } from '@/types';
import { calculatePaymentPlan, PaymentStrategy } from '@/components/DebtAssassin/utils/debtCalculations';
import { Loader2 } from 'lucide-react';

interface SupabaseDebt {
  id: string;
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  total_payments: number;
  debt_plan_id: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

const DebtPage = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Estados para el plan de pagos
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [budgetPercentage, setBudgetPercentage] = useState(30);
  const [selectedStrategy, setSelectedStrategy] = useState<PaymentStrategy>('snowball');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [paymentPlan, setPaymentPlan] = useState({ 
    months: 0, 
    totalInterest: 0,
    recommendedPercentage: 0,
    monthlyPlans: []
  });

  // Función para convertir deuda de Supabase a DebtItem
  const mapSupabaseDebtToDebtItem = (supabaseDebt: SupabaseDebt): DebtItem => ({
    id: supabaseDebt.id,
    name: supabaseDebt.name,
    balance: supabaseDebt.balance,
    interestRate: supabaseDebt.interest_rate,
    minimumPayment: supabaseDebt.minimum_payment,
    totalPayments: supabaseDebt.total_payments
  });

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const { data: planData, error: planError } = await supabase
          .from('debt_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (planError) {
          setError('Error al cargar el plan de pagos.');
          return;
        }

        if (!planData || planData.length === 0) {
          setShowCalculator(true);
          return;
        }

        const plan = planData[0];

        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*')
          .eq('debt_plan_id', plan.id)
          .eq('is_active', true);

        if (debtsError) {
          setError('Error al cargar las deudas.');
          return;
        }

        if (plan && debtsData) {
          // Mapear las deudas al formato correcto
          const mappedDebts = (debtsData as SupabaseDebt[]).map(mapSupabaseDebtToDebtItem);
          
          // Configurar estados con los datos del plan
          setMonthlyIncome(plan.monthly_income || 0);
          setBudgetPercentage(plan.budget_percentage || 30);
          setSelectedStrategy(plan.payment_strategy as PaymentStrategy || 'snowball');
          setDebts(mappedDebts);

          // Calcular el plan de pagos
          const calculatedPlan = calculatePaymentPlan(
            mappedDebts,
            (plan.monthly_income * plan.budget_percentage) / 100,
            plan.payment_strategy as PaymentStrategy || 'snowball',
            plan.monthly_income
          );
          setPaymentPlan(calculatedPlan);
        }
      } catch (error) {
        console.error('Error al cargar el plan:', error);
        setError('Error al cargar el plan de pagos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-finflow-mint mb-2" />
        <p className="text-gray-400">Cargando plan de pagos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-finflow-card rounded-2xl p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  // Si no hay plan o el usuario quiere crear uno nuevo
  if (showCalculator) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Plan de Deudas</h1>
          {paymentPlan.months > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowCalculator(false)}
            >
              Ver Plan Actual
            </Button>
          )}
        </div>
        <DebtCalculator />
      </div>
    );
  }

  // Vista del plan existente
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Plan de Deudas</h1>
        <Button
          variant="outline"
          onClick={() => setShowCalculator(true)}
        >
          Crear Nuevo Plan
        </Button>
      </div>

      <PaymentPlanDisplay
        paymentPlan={paymentPlan}
        monthlyBudget={(monthlyIncome * budgetPercentage) / 100}
        budgetPercentage={budgetPercentage}
        setBudgetPercentage={setBudgetPercentage}
        debts={debts}
        expandedMonth={expandedMonth}
        setExpandedMonth={setExpandedMonth}
        goToEditDebts={() => setShowCalculator(true)}
      />
    </div>
  );
};

export default DebtPage;
