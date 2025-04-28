
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DebtItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type PaymentStrategy = 'snowball' | 'avalanche' | 'proportional';

interface MonthlyPayment {
  debtId: string;
  minimumPayment: number;
  extraPayment: number;
  interestPaid: number;
  remainingBalance: number;
  isPaidOff: boolean;
}

interface MonthlyPlan {
  month: number;
  payments: MonthlyPayment[];
  totalPayment: number;
}

interface PaymentPlanDetail {
  months: number;
  totalInterest: number;
  recommendedPercentage: number;
  monthlyPlans: MonthlyPlan[];
}

const STRATEGY_DESCRIPTIONS = {
  snowball: 'El método bola de nieve se enfoca en pagar primero las deudas más pequeñas, sin importar las tasas de interés. Esto crea impulso y motivación al ver desaparecer las deudas rápidamente.',
  avalanche: 'El método avalancha prioriza el pago de las deudas con las tasas de interés más altas primero. Esto minimiza el interés total pagado y es matemáticamente más eficiente.',
  proportional: 'El método proporcional distribuye el pago extra proporcionalmente entre todas las deudas según su saldo. Es un enfoque equilibrado que reduce todas las deudas gradualmente.'
};

// Función para formatear números como moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para formatear porcentajes
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Función para parsear string formateado a número
const parseCurrencyString = (value: string): number => {
  return Number(value.replace(/[^0-9-]/g, ''));
};

// Componente de input para moneda
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  placeholder?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  min = 0,
  placeholder
}) => {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setDisplayValue(rawValue);
    const numericValue = parseCurrencyString(rawValue);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatCurrency(value));
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value.toString());
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
      placeholder={placeholder}
    />
  );
};

const MonthlyPlanDetail: React.FC<{ 
  plan: MonthlyPlan;
  debts: DebtItem[];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ plan, debts, isExpanded, onToggle }) => {
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

const DebtCalculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [budgetPercentage, setBudgetPercentage] = useState<number>(30);
  const [selectedStrategy, setSelectedStrategy] = useState<PaymentStrategy>('snowball');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanDetail>({ 
    months: 0, 
    totalInterest: 0,
    recommendedPercentage: 0,
    monthlyPlans: []
  });
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [debtPlanId, setDebtPlanId] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [newDebt, setNewDebt] = useState<DebtItem>({
    id: '',
    name: '',
    balance: 0,
    interestRate: 0,
    minimumPayment: 0,
    totalPayments: 0
  });
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Separate useEffect for initial data loading
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
    if (!user?.id) {
      console.log('No user ID available for loading debts');
      return;
    }
    
    try {
      const { data: debtPlans, error: debtPlanError } = await supabase
        .from('debt_plans')
        .select('*')
        .eq('is_active', true)
        .eq('user_id', user.id)
        .limit(1);
      
      console.log('[loadDebts] Planes recibidos:', debtPlans);
      
      if (debtPlanError) {
        console.error('[loadDebts] Error al cargar el plan de deudas:', debtPlanError);
        return;
      }

      const debtPlan = debtPlans && debtPlans.length > 0 ? debtPlans[0] : null;

      if (debtPlan) {
        setDebtPlanId(debtPlan.id);
        setMonthlyIncome(debtPlan.monthly_income || 0);
        setMonthlyBudget(debtPlan.monthly_budget || 0);
        setBudgetPercentage(debtPlan.budget_percentage || 30);
        setSelectedStrategy((debtPlan.payment_strategy as PaymentStrategy) || 'snowball');

        // Cargar las deudas asociadas al plan
        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*')
          .eq('debt_plan_id', debtPlan.id);
        
        console.log('[loadDebts] Deudas recibidas:', debtsData);
        
        if (debtsError) {
          console.error('[loadDebts] Error al cargar las deudas:', debtsError);
          return;
        }

        if (debtsData && debtsData.length > 0) {
          setDebts(debtsData.map(debt => ({
            id: debt.id,
            name: debt.name,
            balance: debt.balance,
            interestRate: debt.interest_rate,
            minimumPayment: debt.minimum_payment,
            totalPayments: debt.total_payments
          })));
          
          // If there are debts, show the plan automatically
          setShowPlan(true);
        } else {
          setDebts([]);
        }
      } else {
        setDebts([]);
        setDebtPlanId(null);
        setShowPlan(false);
      }
    } catch (error) {
      console.error('[loadDebts] Error al cargar los datos:', error);
      toast.error('Error al cargar los datos de deudas');
    }
  };

  // Guardar o actualizar plan de deudas
  const saveDebtPlan = async (showToast = true) => {
    if (savingInProgress) return null;
    setSavingInProgress(true);
    
    try {
      if (!user?.id) {
        toast.error('Debes iniciar sesión para guardar tu plan de deudas');
        setSavingInProgress(false);
        return null;
      }

      const debtPlanData = {
        monthly_income: Math.round(monthlyIncome),
        monthly_budget: Math.round(monthlyBudget),
        budget_percentage: Math.round(budgetPercentage),
        payment_strategy: selectedStrategy,
        is_active: true,
        user_id: user.id
      };
      
      console.log('[saveDebtPlan] Enviando datos a Supabase:', debtPlanData);
      
      let newPlanId = debtPlanId;
      if (debtPlanId) {
        const { error } = await supabase
          .from('debt_plans')
          .update(debtPlanData)
          .eq('id', debtPlanId);
          
        if (error) {
          console.error('[saveDebtPlan] Error actualizando plan:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('debt_plans')
          .insert([debtPlanData])
          .select();
          
        if (error) {
          console.error('[saveDebtPlan] Error creando plan:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          newPlanId = data[0].id;
          setDebtPlanId(data[0].id);
        } else {
          toast.error('Error al crear el plan de deudas: no se recibió ID');
          setSavingInProgress(false);
          return null;
        }
      }
      
      if (showToast) toast.success('Plan de deudas guardado correctamente');
      setSavingInProgress(false);
      return newPlanId;
    } catch (error: any) {
      console.error('[saveDebtPlan] Error al guardar el plan de deudas:', error);
      if (showToast) toast.error(`Error al guardar el plan de deudas: ${error.message || error}`);
      setSavingInProgress(false);
      return null;
    }
  };

  // Agregar una nueva deuda
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
  
  // Eliminar una deuda
  const removeDebt = async (id: string) => {
    if (savingInProgress) return;
    setSavingInProgress(true);
    
    // For existing debts in database
    if (!id.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('[removeDebt] Error eliminando deuda:', error);
          throw error;
        }
        toast.success('Deuda eliminada correctamente');
      } catch (error: any) {
        console.error('[removeDebt] Error al eliminar la deuda:', error);
        toast.error(`Error al eliminar la deuda: ${error.message || error}`);
        setSavingInProgress(false);
        return;
      }
    }
    
    // Remove from state
    setDebts(debts.filter(debt => debt.id !== id));
    setSavingInProgress(false);
  };
  
  // Actualizar datos de una deuda
  const updateDebt = (id: string, field: keyof DebtItem, value: string | number) => {
    const updatedDebts = debts.map(debt => {
      if (debt.id === id) {
        return { ...debt, [field]: typeof value === 'string' ? value : Number(value) };
      }
      return debt;
    });
    setDebts(updatedDebts);
  };

  // Auto save debt when modified (debounced)
  useEffect(() => {
    const autoSaveDebts = async () => {
      // Find any temp debts that need to be saved
      const tempDebts = debts.filter(d => d.id.startsWith('temp_') && isDebtValid(d));
      if (tempDebts.length > 0 && debtPlanId) {
        for (const debt of tempDebts) {
          await saveDebt(debt);
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

  // Save debt to database
  const saveDebt = async (debt: DebtItem) => {
    if (savingInProgress) return false;
    setSavingInProgress(true);
    
    if (!isDebtValid(debt)) {
      setSavingInProgress(false);
      return false;
    }

    if (!debtPlanId) {
      const newPlanId = await saveDebtPlan(false);
      if (!newPlanId) {
        toast.error('Error al guardar el plan de deudas');
        setSavingInProgress(false);
        return false;
      }
    }
    
    try {
      // Get plan ID either from state or from newly created plan
      const planId = debtPlanId;
      
      if (!planId) {
        toast.error('No se pudo obtener el ID del plan de deudas');
        setSavingInProgress(false);
        return false;
      }
      
      const debtData = {
        name: debt.name,
        balance: Math.round(debt.balance),
        interest_rate: Math.round(debt.interestRate * 100) / 100,
        minimum_payment: Math.round(debt.minimumPayment),
        total_payments: Math.round(debt.totalPayments),
        debt_plan_id: planId,
        is_paid: false
      };
      
      console.log('[saveDebt] Enviando datos a Supabase:', debtData);
      
      // For new debts with temporary IDs
      if (debt.id.startsWith('temp_')) {
        const { data, error } = await supabase
          .from('debts')
          .insert([debtData])
          .select();
          
        if (error) {
          console.error('[saveDebt] Error insertando deuda:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Replace temp ID with real DB ID in state
          setDebts(prev => prev.map(d => 
            d.id === debt.id ? { ...d, id: data[0].id } : d
          ));
        } else {
          console.error('[saveDebt] No se recibió ID para la deuda nueva');
        }
      } else {
        // For updating existing debts
        const { error } = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', debt.id);
          
        if (error) {
          console.error('[saveDebt] Error actualizando deuda:', error);
          throw error;
        }
      }
      
      setSavingInProgress(false);
      return true;
    } catch (error: any) {
      console.error('[saveDebt] Error al guardar la deuda:', error);
      toast.error(`Error al guardar la deuda: ${error.message || error}`);
      setSavingInProgress(false);
      return false;
    }
  };

  // Save all debts and continue
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
    
    // Save each debt that needs saving (temporary IDs)
    for (const debt of debts) {
      if (isDebtValid(debt)) {
        // For new debts (temp IDs)
        if (debt.id.startsWith('temp_')) {
          const result = await saveDebt(debt);
          if (!result) {
            success = false;
          }
        } 
        // For existing debts that may have been modified
        else {
          const result = await saveDebt(debt);
          if (!result) {
            success = false;
          }
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

  // Validate debt before saving
  const isDebtValid = (debt: DebtItem) => {
    return (
      debt.name.trim() !== '' &&
      debt.balance > 0 &&
      debt.interestRate > 0 &&
      debt.minimumPayment > 0 &&
      debt.totalPayments > 0
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-finflow-card rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4">1. Ingresa tus Deudas</h2>
            <div className="space-y-4">
              {debts.map((debt) => (
                <div key={debt.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Input
                      value={debt.name}
                      onChange={e => updateDebt(debt.id, 'name', e.target.value)}
                      className="bg-gray-800 border-none text-white max-w-[200px]"
                      placeholder="Nombre de la deuda"
                    />
                    <button 
                      onClick={() => removeDebt(debt.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 block text-xs">Saldo</Label>
                      <CurrencyInput
                        value={debt.balance}
                        onChange={(value) => updateDebt(debt.id, 'balance', value)}
                        className="bg-gray-800 border-none text-white"
                        min={0}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Tasa de Interés (%)</Label>
                      <Input
                        type="number"
                        value={debt.interestRate}
                        onChange={e => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                        className="bg-gray-800 border-none text-white"
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Cuota Mensual</Label>
                      <CurrencyInput
                        value={debt.minimumPayment}
                        onChange={(value) => updateDebt(debt.id, 'minimumPayment', value)}
                        className="bg-gray-800 border-none text-white"
                        min={0}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Cuotas Totales</Label>
                      <Input
                        type="number"
                        value={debt.totalPayments}
                        onChange={e => updateDebt(debt.id, 'totalPayments', Number(e.target.value))}
                        className="bg-gray-800 border-none text-white"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                className="w-full bg-gray-800 text-white hover:bg-gray-700"
                onClick={addDebt}
              >
                <Plus size={16} className="mr-2" />
                Agregar Deuda
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-finflow-card rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4">2. Ingresa tu Ingreso Mensual</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <CurrencyInput
                value={monthlyIncome}
                onChange={value => setMonthlyIncome(value)}
                className="bg-gray-900 border-gray-800 text-white pl-7"
                min={0}
                placeholder="Ingreso mensual"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-finflow-card rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4">3. Selecciona tu Estrategia</h2>
            <Select value={selectedStrategy} onValueChange={(value: PaymentStrategy) => setSelectedStrategy(value)}>
              <SelectTrigger className="bg-gray-900 border-gray-800">
                <SelectValue placeholder="Selecciona una estrategia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snowball">Bola de Nieve</SelectItem>
                <SelectItem value="avalanche">Avalancha</SelectItem>
                <SelectItem value="proportional">Proporcional</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-400">
                {STRATEGY_DESCRIPTIONS[selectedStrategy]}
              </p>
            </div>
          </div>
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

  // Calcular plan de pagos según la estrategia seleccionada
  useEffect(() => {
    if (debts.length === 0) {
      setPaymentPlan({ months: 0, totalInterest: 0, recommendedPercentage: 0, monthlyPlans: [] });
      return;
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
    
    setPaymentPlan({
      months,
      totalInterest: Math.round(totalInterest),
      recommendedPercentage,
      monthlyPlans
    });
  }, [debts, monthlyBudget, selectedStrategy, monthlyIncome]);
  
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
        <div className="space-y-5">
          <div className="bg-finflow-card rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4">Tu Plan de Pagos Óptimo</h2>
            <div className="grid grid-cols-1 gap-4 mb-5">
              <div className="bg-gray-900 rounded-xl p-6 text-center">
                <p className="text-gray-400 mb-3 text-sm">Meses para ser Libre</p>
                <div className="text-finflow-mint flex gap-2 text-4xl justify-center items-baseline">
                  <span className="font-semibold">{paymentPlan.months}</span>
                  <span className="text-xl">meses</span>
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

            <div className="flex gap-4">
              <Button
                className="flex-1 bg-gray-800 text-white hover:bg-gray-700"
                onClick={() => setCurrentStep(1)}
              >
                Ver/Editar Mis Deudas
              </Button>
              <Button
                className="flex-1 bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90"
                onClick={() => setExpandedMonth(1)}
              >
                Ver Plan de Pagos Mensual
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
      )}
    </div>
  );
};

export default DebtCalculator;
