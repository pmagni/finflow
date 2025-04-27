import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DebtItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

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
  const [debts, setDebts] = useState<DebtItem[]>([
    { 
      id: '1', 
      name: 'Tarjeta de Crédito', 
      balance: 5000, 
      interestRate: 18.99, 
      minimumPayment: 150,
      totalPayments: 24
    }
  ]);
  
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2000);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(600);
  const [budgetPercentage, setBudgetPercentage] = useState<number>(30);
  const [selectedStrategy, setSelectedStrategy] = useState<PaymentStrategy>('snowball');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanDetail>({ 
    months: 0, 
    totalInterest: 0,
    recommendedPercentage: 0,
    monthlyPlans: []
  });
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  useEffect(() => {
    const calculatedBudget = (monthlyIncome * budgetPercentage) / 100;
    setMonthlyBudget(calculatedBudget);
  }, [monthlyIncome, budgetPercentage]);
  
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
  
  const addDebt = () => {
    const newDebt: DebtItem = {
      id: Date.now().toString(),
      name: 'Nueva Deuda',
      balance: 1000,
      interestRate: 10,
      minimumPayment: 50,
      totalPayments: 12
    };
    setDebts([...debts, newDebt]);
  };
  
  const removeDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id));
  };
  
  const updateDebt = (id: string, field: keyof DebtItem, value: string | number) => {
    setDebts(debts.map(debt => {
      if (debt.id === id) {
        return { ...debt, [field]: typeof value === 'string' ? value : Number(value) };
      }
      return debt;
    }));
  };
  
  return (
    <div className="animate-fade-in space-y-5">
      <div className="bg-finflow-card rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">1. Ingresa tus Deudas</h2>
        
        <div className="space-y-4 mb-5">
          {debts.map((debt) => (
            <div key={debt.id} className="bg-gray-900 rounded-xl p-4 animate-slide-up">
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
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <CurrencyInput
                      value={debt.balance}
                      onChange={(value) => updateDebt(debt.id, 'balance', value)}
                      className="bg-gray-800 border-none text-white pl-7"
                      min={0}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1 block text-xs">Tasa de Interés</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={debt.interestRate}
                      onChange={e => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                      className="bg-gray-800 border-none text-white pr-7"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1 block text-xs">Cuota Mínima</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <CurrencyInput
                      value={debt.minimumPayment}
                      onChange={(value) => updateDebt(debt.id, 'minimumPayment', value)}
                      className="bg-gray-800 border-none text-white pl-7"
                      min={0}
                    />
                  </div>
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
        </div>
        
        <Button
          onClick={addDebt}
          variant="outline"
          className="w-full border-dashed border-gray-700 bg-transparent text-finflow-mint hover:bg-gray-900 hover:text-finflow-mint flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Agregar otra Deuda</span>
        </Button>
      </div>

      <div className="bg-finflow-card rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">2. Selecciona tu Estrategia</h2>
        
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

      <div className="bg-finflow-card rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">3. Ingresa tu Ingreso Mensual</h2>
        
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

      <div className="bg-finflow-card rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">Plan de Pagos Óptimo</h2>
        
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
          
          <p className="text-sm text-gray-400">
            {paymentPlan.recommendedPercentage > 0 && 
              `Se recomienda destinar al menos el ${formatPercentage(paymentPlan.recommendedPercentage)}% de tus ingresos para pagar tus deudas.`
            }
          </p>
        </div>

        <div className="mt-6">
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
      </div>
    </div>
  );
};

export default DebtCalculator;
