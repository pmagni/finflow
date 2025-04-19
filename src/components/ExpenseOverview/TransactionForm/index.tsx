
import React from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionForm({ isOpen, onOpenChange }: TransactionFormProps) {
  const { user } = useAuth();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      description: "",
      category: "",
      amount: undefined,
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast.error("You need to be logged in to add a transaction");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          type: values.type,
          description: values.description,
          category_id: values.category, // Use category_id instead of category
          amount: values.amount,
          user_id: user.id, // Add user_id to satisfy RLS policy
        });

      if (error) throw error;

      toast.success("Transaction added successfully");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("Failed to add transaction");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-finflow-card border-gray-800 text-white"
        aria-describedby="transaction-form-description"
      >
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription id="transaction-form-description">
            Fill out the form below to add a new transaction.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TypeField />
              <DescriptionField />
              <CategoryField />
              <AmountField />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
                >
                  Add Transaction
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
