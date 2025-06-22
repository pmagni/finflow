
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';
import type { Goal } from '@/services/goalService';

const goalFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  target: z.coerce.number().positive('La meta debe ser positiva'),
  current_amount: z.coerce.number().min(0, 'El monto actual debe ser mayor o igual a 0'),
  monthly_contribution: z.coerce.number().positive('La contribución mensual debe ser positiva'),
  months_to_achieve: z.coerce.number().int().positive('Los meses deben ser un número entero positivo'),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
  onSubmit: (data: GoalFormValues) => void;
  isLoading: boolean;
}

export const GoalForm = ({ isOpen, onOpenChange, goal, onSubmit, isLoading }: GoalFormProps) => {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name || '',
      target: goal?.target || 0,
      current_amount: goal?.current_amount || 0,
      monthly_contribution: goal?.monthly_contribution || 0,
      months_to_achieve: goal?.months_to_achieve || 12,
    },
  });

  React.useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        target: goal.target,
        current_amount: goal.current_amount,
        monthly_contribution: goal.monthly_contribution,
        months_to_achieve: goal.months_to_achieve,
      });
    } else {
      form.reset({
        name: '',
        target: 0,
        current_amount: 0,
        monthly_contribution: 0,
        months_to_achieve: 12,
      });
    }
  }, [goal, form]);

  const handleSubmit = (data: GoalFormValues) => {
    onSubmit(data);
    if (!goal) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Meta' : 'Nueva Meta de Ahorro'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Modifica los datos de tu meta' : 'Crea una nueva meta de ahorro'}
          </DialogDescription>
        </DialogHeader>
        
        <TransitionWrapper type="fade">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Meta</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Vacaciones, Casa nueva..." 
                        {...field} 
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta ($)</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value || 0}
                        onChange={field.onChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Actual ($)</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value || 0}
                        onChange={field.onChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_contribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribución Mensual ($)</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value || 0}
                        onChange={field.onChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="months_to_achieve"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meses para Lograr</FormLabel>
                    <FormControl>
                      <NumberInput 
                        value={field.value || 12}
                        onChange={field.onChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 transition-all duration-200"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingIndicator size="sm" />
                      Guardando...
                    </div>
                  ) : (
                    goal ? 'Actualizar' : 'Crear Meta'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TransitionWrapper>
      </DialogContent>
    </Dialog>
  );
};
