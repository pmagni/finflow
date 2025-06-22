
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionFormSchema, type TransactionFormValues, type Category } from './TransactionFormSchema';
import { Form } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TypeField } from './TypeField';
import { CategoryField } from './CategoryField';
import { DescriptionField } from './DescriptionField';
import { AmountField } from './AmountField';
import { DateField } from './DateField';

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
  isEditing?: boolean;
}

export const TransactionForm = ({ isOpen, onOpenChange, transaction, isEditing = false }: TransactionFormProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction?.type || 'expense',
      description: transaction?.description || '',
      category: transaction?.category_id || '',
      amount: transaction?.amount || 1000,
      transaction_date: transaction?.transaction_date ? new Date(transaction.transaction_date) : new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaction && isEditing) {
      form.reset({
        type: transaction.type,
        description: transaction.description || '',
        category: transaction.category_id || '',
        amount: transaction.amount,
        transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date) : new Date(),
      });
    }
  }, [transaction, isEditing, form]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar las categorías');
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar transacciones');
      return;
    }

    setIsLoading(true);

    try {
      const selectedCategory = categories.find(c => c.id === values.category);
      
      const transactionData = {
        type: values.type,
        description: values.description,
        amount: values.amount,
        category: selectedCategory?.name || 'Sin categoría',
        category_id: values.category,
        category_name: selectedCategory?.name || null,
        transaction_date: values.transaction_date.toISOString().split('T')[0],
        user_id: user.id,
        currency: 'CLP'
      };

      if (isEditing && transaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);

        if (error) throw error;
        toast.success('Transacción actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert(transactionData);

        if (error) throw error;
        toast.success('Transacción agregada exitosamente');
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error with transaction:', error);
      toast.error('Error al procesar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-finflow-card">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Transacción' : 'Agregar Transacción'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos de la transacción' : 'Registra un nuevo ingreso o gasto'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TypeField form={form} />
            <CategoryField form={form} categories={categories} />
            <DescriptionField form={form} />
            <AmountField form={form} />
            <DateField form={form} />
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-finflow-mint hover:bg-finflow-mint-dark text-black"
              >
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
