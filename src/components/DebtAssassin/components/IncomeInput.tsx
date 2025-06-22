
import React from 'react';
import { CurrencyInput } from '@/components/ui/currency-input';

interface IncomeInputProps {
  monthlyIncome: number;
  setMonthlyIncome: (income: number) => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ monthlyIncome, setMonthlyIncome }) => {
  return (
    <div className="bg-finflow-card rounded-2xl p-5 transition-all duration-200 hover:bg-finflow-card/80">
      <h2 className="text-lg font-bold mb-4">2. Ingresa tu Ingreso Mensual</h2>
      <div className="relative">
        <CurrencyInput
          value={monthlyIncome}
          onChange={setMonthlyIncome}
          className="bg-gray-900 border-gray-800 text-white"
          placeholder="Ingreso mensual"
        />
      </div>
    </div>
  );
};

export default IncomeInput;
