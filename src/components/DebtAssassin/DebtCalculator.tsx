
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { DebtItem } from '@/types';

const DebtCalculator = () => {
  const [debts, setDebts] = useState<DebtItem[]>([
    { id: '1', name: 'Credit Card', balance: 5000, interestRate: 18.99, minimumPayment: 150 },
    { id: '2', name: 'Car Loan', balance: 15000, interestRate: 5.25, minimumPayment: 300 },
  ]);
  
  const [monthlyBudget, setMonthlyBudget] = useState<number>(600);
  const [paymentPlan, setPaymentPlan] = useState<{ months: number; totalInterest: number }>({ 
    months: 0, 
    totalInterest: 0 
  });
  
  // Calculate payment plan using snowball method
  useEffect(() => {
    if (debts.length === 0) {
      setPaymentPlan({ months: 0, totalInterest: 0 });
      return;
    }
    
    // Clone debts for simulation
    const debtsCopy = [...debts].sort((a, b) => a.balance - b.balance);
    let remainingDebts = debtsCopy.map(debt => ({ ...debt }));
    let totalInterest = 0;
    let months = 0;
    
    while (remainingDebts.length > 0) {
      months++;
      
      // Calculate month's minimum payments
      let availableBudget = monthlyBudget;
      
      // Pay minimum on all debts
      remainingDebts.forEach(debt => {
        const minimumPayment = Math.min(debt.minimumPayment, debt.balance);
        availableBudget -= minimumPayment;
        
        // Calculate interest
        const monthlyInterest = debt.balance * (debt.interestRate / 100 / 12);
        totalInterest += monthlyInterest;
        
        // Apply payment
        debt.balance = Math.max(0, debt.balance - minimumPayment + monthlyInterest);
      });
      
      // Use remaining budget on smallest debt
      if (availableBudget > 0 && remainingDebts.length > 0) {
        remainingDebts[0].balance = Math.max(0, remainingDebts[0].balance - availableBudget);
      }
      
      // Remove paid off debts
      remainingDebts = remainingDebts.filter(debt => debt.balance > 0);
    }
    
    setPaymentPlan({
      months,
      totalInterest: Math.round(totalInterest)
    });
  }, [debts, monthlyBudget]);
  
  const addDebt = () => {
    const newDebt: DebtItem = {
      id: Date.now().toString(),
      name: 'New Debt',
      balance: 1000,
      interestRate: 10,
      minimumPayment: 50
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
    <div className="animate-fade-in">
      <div className="bg-finflow-card rounded-2xl p-5 mb-5">
        <h2 className="text-lg font-bold mb-4">Debt Snowball Calculator</h2>
        
        <div className="mb-5">
          <Label htmlFor="monthlyBudget" className="mb-2 block">Monthly Debt Payment Budget</Label>
          <Input
            id="monthlyBudget"
            type="number"
            value={monthlyBudget}
            onChange={e => setMonthlyBudget(Number(e.target.value))}
            className="bg-gray-900 border border-gray-800 text-white"
            min={0}
          />
        </div>
        
        <div className="space-y-4 mb-5">
          {debts.map((debt) => (
            <div key={debt.id} className="bg-gray-900 rounded-xl p-4 animate-slide-up">
              <div className="flex justify-between items-center mb-3">
                <Input
                  value={debt.name}
                  onChange={e => updateDebt(debt.id, 'name', e.target.value)}
                  className="bg-gray-800 border-none text-white max-w-[200px]"
                  placeholder="Debt name"
                />
                <button 
                  onClick={() => removeDebt(debt.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">Balance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={debt.balance}
                      onChange={e => updateDebt(debt.id, 'balance', Number(e.target.value))}
                      className="bg-gray-800 border-none text-white pl-7 number-change"
                      min={0}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1 block text-xs">Interest Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={debt.interestRate}
                      onChange={e => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                      className="bg-gray-800 border-none text-white pr-7 number-change"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1 block text-xs">Minimum Payment</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={debt.minimumPayment}
                      onChange={e => updateDebt(debt.id, 'minimumPayment', Number(e.target.value))}
                      className="bg-gray-800 border-none text-white pl-7 number-change"
                      min={0}
                    />
                  </div>
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
          <span>Add Another Debt</span>
        </Button>
      </div>
      
      <div className="bg-finflow-card rounded-2xl p-5 mb-5">
        <h2 className="text-lg font-bold mb-4">Payment Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-gray-400 mb-1">Time to Debt Freedom</p>
            <div className="text-finflow-mint flex gap-2 text-4xl justify-center items-baseline number-change">
              <span>{paymentPlan.months}</span>
              <span className="text-xl">months</span>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-gray-400 mb-1">Total Interest Paid</p>
            <div className="text-finflow-mint flex gap-1 text-4xl justify-center items-baseline number-change">
              <span>$</span>
              <span>{paymentPlan.totalInterest}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-5 bg-gray-900 rounded-xl p-4">
          <h3 className="font-medium mb-2">Snowball Strategy</h3>
          <p className="text-sm text-gray-400">
            The debt snowball method focuses on paying off your smallest debts first, 
            regardless of interest rates. This creates momentum and motivation as you see 
            debts disappear quickly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebtCalculator;
