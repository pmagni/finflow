import React, { useEffect, useState } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

const formatNumber = (value: string | number): string => {
  const numbers = value.toString().replace(/\D/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('es-CL');
};

const unformatNumber = (value: string): string => {
  return value.replace(/\./g, '');
};

export function AmountField() {
  const { setValue, watch } = useFormContext();
  const formAmount = watch('amount');
  const [displayValue, setDisplayValue] = useState('');

  // Sincronizar el valor visual cuando cambia el valor real (por ejemplo, al editar)
  useEffect(() => {
    if (formAmount !== undefined && formAmount !== null && formAmount !== '') {
      setDisplayValue(formatNumber(formAmount));
    } else {
      setDisplayValue('');
    }
  }, [formAmount]);

  return (
    <FormField
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Monto (CLP)</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Ingrese monto en pesos chilenos"
                className="bg-gray-800 border-gray-700 pl-7"
                value={displayValue}
                onChange={(e) => {
                  const raw = unformatNumber(e.target.value);
                  setDisplayValue(formatNumber(raw));
                  setValue('amount', raw ? Number(raw) : undefined, { shouldValidate: true });
                }}
                onBlur={field.onBlur}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
