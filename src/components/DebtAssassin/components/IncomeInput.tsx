
import React from 'react';
import CurrencyInput from './CurrencyInput';

interface IncomeInputProps {
  monthlyIncome: number;
  setMonthlyIncome: (income: number) => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ monthlyIncome, setMonthlyIncome }) => {
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
};

export default IncomeInput;
