
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { DebtItem } from '@/types';
import CurrencyInput from './CurrencyInput';

interface DebtFormProps {
  debts: DebtItem[];
  addDebt: () => void;
  removeDebt: (id: string) => void;
  updateDebt: (id: string, field: keyof DebtItem, value: string | number) => void;
}

const DebtForm: React.FC<DebtFormProps> = ({
  debts,
  addDebt,
  removeDebt,
  updateDebt
}) => {
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
};

export default DebtForm;
