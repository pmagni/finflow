import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TypeField } from './TypeField';
import { CategoryField } from './CategoryField';
import { DescriptionField } from './DescriptionField';
import { AmountField } from './AmountField';
import { DateField } from './DateField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionFormSchema, type TransactionFormValues, type Category } from './TransactionFormSchema';
import { Form } from '@/components/ui/form';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionForm = ({ isOpen, onClose, onSuccess }: TransactionFormProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      category: '',
      amount: 1000,
      transaction_date: new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

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
      // Find the selected category
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

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) throw error;

      toast.success('Transacción agregada exitosamente');
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Error al crear la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-finflow-card">
        <CardHeader>
          <CardTitle>Agregar Transacción</CardTitle>
          <CardDescription>
            Registra un nuevo ingreso o gasto
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-finflow-mint hover:bg-finflow-mint-dark text-black"
                >
                  {isLoading ? 'Guardando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionForm;
