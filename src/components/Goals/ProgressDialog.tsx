
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';

interface ProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => void;
}

export const ProgressDialog = ({ isOpen, onOpenChange, onSubmit }: ProgressDialogProps) => {
  const [amount, setAmount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0) {
      onSubmit(amount);
      setAmount(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar Progreso</DialogTitle>
          <DialogDescription>
            Ingresa la cantidad que deseas agregar a tu meta
          </DialogDescription>
        </DialogHeader>
        
        <TransitionWrapper type="fade">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Cantidad ($)</Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 transition-all duration-200"
                disabled={!amount || amount <= 0}
              >
                Agregar
              </Button>
            </div>
          </form>
        </TransitionWrapper>
      </DialogContent>
    </Dialog>
  );
};
