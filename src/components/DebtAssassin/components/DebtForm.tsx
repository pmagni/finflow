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
        {debts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-4">No tienes deudas registradas</p>
            <Button
              onClick={addDebt}
              className="bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Mi Primera Deuda
            </Button>
          </div>
        ) : (
          <>
            {debts.map((debt) => (
              <div key={debt.id} className="bg-gray-900 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Label className="mb-1 block text-xs">Nombre de la Deuda</Label>
                    <Input
                      value={debt.name}
                      onChange={e => updateDebt(debt.id, 'name', e.target.value)}
                      className="bg-gray-800 border-none text-white"
                      placeholder="Ej: Tarjeta de Crédito"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDebt(debt.id)}
                    className="ml-2 text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
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
              onClick={addDebt}
              variant="outline"
              className="w-full border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Otra Deuda
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DebtForm;
