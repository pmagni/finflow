
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';

interface AmountFieldProps {
  form: UseFormReturn<any>;
}

export const AmountField = ({ form }: AmountFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Monto</FormLabel>
          <FormControl>
            <CurrencyInput 
              value={field.value || 0}
              onChange={field.onChange}
              className="bg-background"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
