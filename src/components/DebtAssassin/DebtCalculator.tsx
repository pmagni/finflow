import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DebtItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { calculatePaymentPlan, isDebtValid, PaymentStrategy } from './utils/debtCalculations';
import DebtForm from './components/DebtForm';
import PaymentPlanDisplay from './components/PaymentPlanDisplay';
import IncomeInput from './components/IncomeInput';
import StrategySelector from './components/StrategySelector';
import { debtService } from '@/services/debtService';

const DebtCalculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [budgetPercentage, setBudgetPercentage] = useState<number>(30);
  const [selectedStrategy, setSelectedStrategy] = useState<PaymentStrategy>('snowball');
  const [paymentPlan, setPaymentPlan] = useState({ 
    months: 0, 
    totalInterest: 0,
    recommendedPercentage: 0,
    monthlyPlans: []
  });
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [debtPlanId, setDebtPlanId] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Load user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error al obtener el usuario:', error);
          setLoadingUser(false);
          return;
        }
        
        setUser(data.user);
        setLoadingUser(false);
      } catch (err) {
        console.error('Error inesperado:', err);
        setLoadingUser(false);
      }
    };
    getUser();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loadingUser && !user) {
      toast.error('Debes iniciar sesión para acceder a esta función');
      navigate('/auth');
    }
  }, [loadingUser, user, navigate]);

  // Load debt plan and debts
  useEffect(() => {
    if (user) {
      loadUserDebts();
    }
  }, [user]);

  // Function to load user debts from database
  const loadUserDebts = async () => {
    if (!user?.id) return;
    
    const { debtPlan, debts } = await debtService.loadUserDebts(user.id);
    
    if (debtPlan) {
      setDebtPlanId(debtPlan.id);
      setMonthlyIncome(debtPlan.monthly_income || 0);
      setMonthlyBudget(debtPlan.monthly_budget || 0);
      setBudgetPercentage(debtPlan.budget_percentage || 30);
      setSelectedStrategy((debtPlan.payment_strategy as PaymentStrategy) || 'snowball');
      
      if (debts && debts.length > 0) {
        setDebts(debts);
        // If there are debts, show the plan automatically
        setShowPlan(true);
      }
    }
  };

  // Save debt plan to database
  const saveDebtPlan = async (showToast = true) => {
    if (savingInProgress || !user?.id) return null;
    setSavingInProgress(true);
    
    const newPlanId = await debtService.saveDebtPlan(
      user.id,
      monthlyIncome,
      monthlyBudget,
      budgetPercentage,
      selectedStrategy,
      debtPlanId
    );
    
    if (newPlanId && debtPlanId !== newPlanId) {
      setDebtPlanId(newPlanId);
    }
    
    if (showToast && newPlanId) {
      toast.success('Plan de deudas guardado correctamente');
    }
    
    setSavingInProgress(false);
    return newPlanId;
  };

  // Add a new debt
  const addDebt = () => {
    const newDebtItem: DebtItem = {
      id: `temp_${Date.now()}`,
      name: '',
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
      totalPayments: 0
    };
    setDebts([...debts, newDebtItem]);
  };
  
  // Remove a debt
  const removeDebt = async (id: string) => {
    if (savingInProgress) return;
    setSavingInProgress(true);
    
    const success = await debtService.deleteDebt(id);
    
    if (success) {
      setDebts(debts.filter(debt => debt.id !== id));
      if (!id.startsWith('temp_')) {
        toast.success('Deuda eliminada correctamente');
      }
    }
    
    setSavingInProgress(false);
  };
  
  // Update debt information
  const updateDebt = (id: string, field: keyof DebtItem, value: string | number) => {
    const updatedDebts = debts.map(debt => {
      if (debt.id === id) {
        return { ...debt, [field]: typeof value === 'string' ? value : Number(value) };
      }
      return debt;
    });
    setDebts(updatedDebts);
  };

  // Auto save debts when modified (debounced)
  useEffect(() => {
    const autoSaveDebts = async () => {
      // Find any temp debts that need to be saved
      const tempDebts = debts.filter(d => d.id.startsWith('temp_') && isDebtValid(d));
      if (tempDebts.length > 0 && debtPlanId) {
        for (const debt of tempDebts) {
          const result = await saveDebt(debt);
          // Check if result is not false before accessing its properties
          if (result && typeof result === 'object' && result.success && result.id) {
            // Update the debt ID in state to match the database
            setDebts(prev => prev.map(d => 
              d.id === debt.id ? { ...d, id: result.id as string } : d
            ));
          }
        }
      }
    };
    
    // Only autosave if we have a debtPlanId and we're not currently showing the plan
    if (debtPlanId && !showPlan && debts.length > 0) {
      const debounceTimer = setTimeout(() => {
        autoSaveDebts();
      }, 2000);
      return () => clearTimeout(debounceTimer);
    }
  }, [debts, debtPlanId, showPlan]);

  // Save a single debt
  const saveDebt = async (debt: DebtItem) => {
    if (savingInProgress) return { success: false, id: null };
    setSavingInProgress(true);
    
    if (!isDebtValid(debt)) {
      setSavingInProgress(false);
      return { success: false, id: null };
    }

    if (!debtPlanId) {
      const newPlanId = await saveDebtPlan(false);
      if (!newPlanId) {
        toast.error('Error al guardar el plan de deudas');
        setSavingInProgress(false);
        return { success: false, id: null };
      }
      setDebtPlanId(newPlanId);
    }
    
    const result = await debtService.saveDebt(debt, debtPlanId!);
    setSavingInProgress(false);
    return result;
  };

  // Save all debts and continue to next step
  const saveAllDebtsAndContinue = async () => {
    if (savingInProgress) return;
    setSavingInProgress(true);
    
    if (debts.length === 0) {
      nextStep();
      setSavingInProgress(false);
      return;
    }
    
    // Create or update debt plan first
    const planId = await saveDebtPlan(false);
    if (!planId) {
      toast.error('Error al guardar el plan de deudas');
      setSavingInProgress(false);
      return;
    }
    
    let success = true;
    
    // Save each debt that needs saving
    for (const debt of debts) {
      if (isDebtValid(debt)) {
        const result = await saveDebt(debt);
        if (!result.success) {
          success = false;
        }
      } else {
        // If any debt is invalid, we can't proceed
        toast.error(`La deuda "${debt.name || 'Sin nombre'}" tiene campos inválidos`);
        success = false;
      }
    }
    
    if (success) {
      toast.success('Deudas guardadas correctamente');
      nextStep();
    } else {
      toast.error('Hubo un problema al guardar algunas deudas');
    }
    
    setSavingInProgress(false);
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate budget when income or percentage changes
  useEffect(() => {
    const calculatedBudget = (monthlyIncome * budgetPercentage) / 100;
    setMonthlyBudget(calculatedBudget);
  }, [monthlyIncome, budgetPercentage]);
  
  // Update debt plan in database when budget changes
  useEffect(() => {
    if (debtPlanId && user && monthlyIncome > 0) {
      const debounceTimer = setTimeout(() => {
        saveDebtPlan(false);
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [monthlyIncome, budgetPercentage, selectedStrategy]);

  // Calculate payment plan based on debts and strategy
  useEffect(() => {
    const plan = calculatePaymentPlan(debts, monthlyBudget, selectedStrategy, monthlyIncome);
    setPaymentPlan(plan);
  }, [debts, monthlyBudget, selectedStrategy, monthlyIncome]);

  // Render the appropriate step of the debt calculator
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DebtForm
            debts={debts}
            addDebt={addDebt}
            removeDebt={removeDebt}
            updateDebt={updateDebt}
          />
        );
      case 2:
        return (
          <IncomeInput 
            monthlyIncome={monthlyIncome} 
            setMonthlyIncome={setMonthlyIncome} 
          />
        );
      case 3:
        return (
          <StrategySelector 
            selectedStrategy={selectedStrategy} 
            setSelectedStrategy={setSelectedStrategy} 
          />
        );
      case 4:
        return (
          <div className="bg-finflow-card rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4">4. Genera tu Plan de Pagos</h2>
            <Button
              className="w-full bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90"
              onClick={async () => {
                await saveDebtPlan();
                setShowPlan(true);
              }}
            >
              Generar Mi Plan de Pagos
            </Button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="animate-fade-in space-y-5">
      {!showPlan ? (
        <>
          {renderStep()}
          <div className="flex justify-between mt-4">
            <Button
              className="bg-gray-800 text-white hover:bg-gray-700"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            <Button
              className="bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90"
              onClick={currentStep === 1 ? saveAllDebtsAndContinue : nextStep}
              disabled={currentStep === 4}
            >
              {currentStep === 1 ? 'Guardar y Continuar' : 'Siguiente'}
            </Button>
          </div>
        </>
      ) : (
        <PaymentPlanDisplay
          paymentPlan={paymentPlan}
          monthlyBudget={monthlyBudget}
          budgetPercentage={budgetPercentage}
          setBudgetPercentage={setBudgetPercentage}
          debts={debts}
          expandedMonth={expandedMonth}
          setExpandedMonth={setExpandedMonth}
          goToEditDebts={() => setCurrentStep(1)}
        />
      )}
    </div>
  );
};

export default DebtCalculator;
