import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

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
  const [loadingDebts, setLoadingDebts] = useState(false);

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
    
    setLoadingDebts(true);
    try {
      const { debtPlan, debts } = await debtService.loadUserDebts(user.id);
      
      if (debtPlan) {
        // Configuramos el plan existente
        setDebtPlanId(debtPlan.id);
        const income = debtPlan.monthly_income || 0;
        const percentage = debtPlan.budget_percentage || 30;
        const strategy = (debtPlan.payment_strategy as PaymentStrategy) || 'snowball';
        
        // Actualizamos los estados
        setMonthlyIncome(income);
        setBudgetPercentage(percentage);
        setMonthlyBudget((income * percentage) / 100);
        setSelectedStrategy(strategy);
        setDebts(debts);
        
        // Calculamos el plan de pagos
        const calculatedPlan = calculatePaymentPlan(
          debts,
          (income * percentage) / 100,
          strategy,
          income
        );
        setPaymentPlan(calculatedPlan);
        
        // Mostramos el plan
        setShowPlan(true);
      } else {
        // Si no hay plan, reseteamos todo a valores iniciales
        setDebtPlanId(null);
        setDebts([]);
        setMonthlyIncome(0);
        setBudgetPercentage(30);
        setMonthlyBudget(0);
        setSelectedStrategy('snowball');
        setShowPlan(false);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error al cargar el plan de deudas:', error);
      toast.error('Error al cargar el plan de deudas');
    } finally {
      setLoadingDebts(false);
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
        if (typeof result === 'object' && !result.success) {
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
  
  // Calculate payment plan based on debts and strategy
  useEffect(() => {
    if (debts.length > 0 && monthlyIncome > 0) {
      const plan = calculatePaymentPlan(debts, monthlyBudget, selectedStrategy, monthlyIncome);
      setPaymentPlan(plan);
    }
  }, [debts, monthlyBudget, selectedStrategy, monthlyIncome]);
  
  // Update debt plan in database when budget changes
  useEffect(() => {
    if (debtPlanId && user && monthlyIncome > 0) {
      const debounceTimer = setTimeout(() => {
        saveDebtPlan(false);
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [monthlyIncome, budgetPercentage, selectedStrategy]);

  const handleGeneratePlan = async () => {
    const confirmModal = confirm('¿Estás seguro que quieres generar tu plan de pagos?');
    if (!confirmModal) return;

    await toast.promise(
      async () => {
        await saveDebtPlan();
        setShowPlan(true);
      },
      {
        loading: 'Generando plan de pagos...',
        success: 'Plan generado exitosamente',
        error: 'Error al generar el plan'
      }
    );
  };

  // Render the appropriate step of the debt calculator
  const renderStep = () => {
    if (loadingDebts) {
      return (
        <div className="bg-finflow-card rounded-2xl p-5">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-finflow-mint mb-2" />
            <p className="text-gray-400">Cargando tu plan de deudas...</p>
          </div>
        </div>
      );
    }

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
              onClick={handleGeneratePlan}
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
      {loadingDebts ? (
        <div className="bg-finflow-card rounded-2xl p-5">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-finflow-mint mb-2" />
            <p className="text-gray-400">Cargando tu plan de deudas...</p>
          </div>
        </div>
      ) : !showPlan ? (
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
              disabled={currentStep === 4 || savingInProgress}
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
          goToEditDebts={() => {
            setCurrentStep(1);
            setShowPlan(false);
          }}
        />
      )}
    </div>
  );
};

export default DebtCalculator;
