
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formatNumber = (value: string): string => {
  // Eliminar cualquier caracter que no sea número
  const numbers = value.replace(/\D/g, '');
  
  // Si no hay números, retornar vacío
  if (!numbers) return '';
  
  // Convertir a número y formatear con puntos
  const formatted = Number(numbers).toLocaleString('es-CL');
  
  return formatted;
};

const unformatNumber = (value: string): string => {
  // Eliminar todos los puntos y retornar solo números
  return value.replace(/\./g, '');
};

export function AmountField() {
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
                pattern="[0-9]*"
                placeholder="Ingrese monto en pesos chilenos"
                className="bg-gray-800 border-gray-700 pl-7"
                value={formatNumber(field.value?.toString() || '')}
                onChange={(e) => {
                  const unformatted = unformatNumber(e.target.value);
                  field.onChange(unformatted);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  const value = unformatNumber(e.target.value);
                  if (value && !isNaN(Number(value))) {
                    field.onChange(value);
                  }
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
