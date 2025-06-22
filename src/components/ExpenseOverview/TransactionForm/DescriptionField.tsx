
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface DescriptionFieldProps {
  form: UseFormReturn<any>;
}

export const DescriptionField = ({ form }: DescriptionFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción</FormLabel>
          <FormControl>
            <Input placeholder="Descripción de la transacción" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
