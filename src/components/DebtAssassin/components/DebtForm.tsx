
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { DebtItem } from '@/types';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';

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
    <div className="bg-finflow-card rounded-2xl p-5 transition-all duration-200 hover:bg-finflow-card/80">
      <h2 className="text-lg font-bold mb-4">1. Ingresa tus Deudas</h2>
      
      <div className="space-y-4">
        {debts.length === 0 ? (
          <TransitionWrapper type="fade">
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-4">No tienes deudas registradas</p>
              <Button
                onClick={addDebt}
                className="bg-finflow-mint text-black font-bold hover:bg-finflow-mint/90 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Mi Primera Deuda
              </Button>
            </div>
          </TransitionWrapper>
        ) : (
          <>
            {debts.map((debt, index) => (
              <TransitionWrapper key={debt.id} type="slide" delay={index * 0.1}>
                <div className="bg-gray-900 rounded-xl p-4 transition-all duration-200 hover:bg-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs">Nombre de la Deuda</Label>
                      <Input
                        value={debt.name}
                        onChange={e => updateDebt(debt.id, 'name', e.target.value)}
                        className="bg-gray-800 border-none text-white focus:ring-2 focus:ring-finflow-mint transition-all duration-200"
                        placeholder="Ej: Tarjeta de Crédito"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDebt(debt.id)}
                      className="ml-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
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
                        className="bg-gray-800 border-none text-white focus:ring-2 focus:ring-finflow-mint transition-all duration-200"
                        placeholder="Saldo de la deuda"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Tasa de Interés (%)</Label>
                      <NumberInput
                        value={debt.interestRate}
                        onChange={(value) => updateDebt(debt.id, 'interestRate', value)}
                        decimals={1}
                        className="bg-gray-800 border-none text-white focus:ring-2 focus:ring-finflow-mint transition-all duration-200"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Cuota Mensual</Label>
                      <CurrencyInput
                        value={debt.minimumPayment}
                        onChange={(value) => updateDebt(debt.id, 'minimumPayment', value)}
                        className="bg-gray-800 border-none text-white focus:ring-2 focus:ring-finflow-mint transition-all duration-200"
                        placeholder="Cuota mensual"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Cuotas Totales</Label>
                      <NumberInput
                        value={debt.totalPayments}
                        onChange={(value) => updateDebt(debt.id, 'totalPayments', value)}
                        className="bg-gray-800 border-none text-white focus:ring-2 focus:ring-finflow-mint transition-all duration-200"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </TransitionWrapper>
            ))}
            
            <Button
              onClick={addDebt}
              variant="outline"
              className="w-full border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
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
