
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStrategy, STRATEGY_DESCRIPTIONS } from '../utils/debtCalculations';

interface StrategySelectorProps {
  selectedStrategy: PaymentStrategy;
  setSelectedStrategy: (strategy: PaymentStrategy) => void;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({ selectedStrategy, setSelectedStrategy }) => {
  return (
    <div className="bg-finflow-card rounded-2xl p-5">
      <h2 className="text-lg font-bold mb-4">3. Selecciona tu Estrategia</h2>
      <Select 
        value={selectedStrategy} 
        onValueChange={(value: PaymentStrategy) => setSelectedStrategy(value)}
      >
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
};

export default StrategySelector;
