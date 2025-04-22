import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { transactionFormSchema, type TransactionFormValues } from './TransactionFormSchema';
import { TypeField } from './TypeField';
import { DescriptionField } from './DescriptionField';
import { CategoryField } from './CategoryField';
import { AmountField } from './AmountField';
import { DateField } from './DateField';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: {
    id: string;
    type: "expense" | "income";
    description: string;
    category_id: string;
    amount: number;
    transaction_date?: string;
  };
  isEditing?: boolean;
}

export function TransactionForm({ 
  isOpen, 
  onOpenChange, 
  transaction, 
  isEditing = false 
}: TransactionFormProps) {
  const { user } = useAuth();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      description: "",
      category: undefined,
      amount: undefined,
      transaction_date: new Date(),
    },
  });

  // Update form values when editing an existing transaction
  useEffect(() => {
    if (isEditing && transaction) {
      form.reset({
        type: transaction.type,
        description: transaction.description,
        category: transaction.category_id,
        amount: transaction.amount,
        transaction_date: transaction.transaction_date 
          ? new Date(transaction.transaction_date) 
          : new Date(),
      });
    } else if (!isEditing) {
      form.reset({
        type: "expense",
        description: "",
        category: undefined,
        amount: undefined,
        transaction_date: new Date(),
      });
    }
  }, [form, isEditing, transaction, isOpen]);

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast.error("You need to be logged in to add a transaction");
      return;
    }

    try {
      const selectedDate = values.transaction_date.toISOString();
      
      if (isEditing && transaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update({
            type: values.type,
            description: values.description,
            category_id: values.category,
            amount: values.amount,
            transaction_date: selectedDate,
            currency: 'CLP',
          })
          .eq('id', transaction.id);

        if (error) throw error;
        toast.success("Transacción actualizada correctamente");
      } else {
        // Insert new transaction
        const { error } = await supabase
          .from('transactions')
          .insert({
            type: values.type,
            description: values.description,
            category_id: values.category,
            amount: values.amount,
            user_id: user.id,
            transaction_date: selectedDate,
            currency: 'CLP',
          });

        if (error) throw error;
        toast.success("Transacción agregada correctamente");
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error with transaction:', error);
      toast.error(`No se pudo ${isEditing ? 'actualizar' : 'agregar'} la transacción`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-finflow-card border-gray-800 text-white"
        aria-describedby="transaction-form-description"
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Agregar'} Transacción</DialogTitle>
          <DialogDescription id="transaction-form-description">
            {isEditing ? 'Edita la' : 'Completa el formulario para agregar una nueva'} transacción.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TypeField />
              <DescriptionField />
              <CategoryField />
              <AmountField />
              <DateField />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
                >
                  {isEditing ? 'Actualizar' : 'Agregar'} Transacción
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
