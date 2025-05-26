import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense';
  expense_type?: 'fixed' | 'variable';
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data;
}

export async function createCategory({ name, icon, transaction_type, expense_type }: Omit<Category, 'id'>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    toast.error('You need to be logged in to create a category');
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, icon, transaction_type, expense_type, user_id: user.id })
    .select()
    .single();

  if (error) {
    toast.error('Failed to create category');
    throw error;
  }

  toast.success('Category created successfully');
  return data;
}

export async function updateCategory({ id, name, icon, transaction_type, expense_type }: Category) {
  const { error } = await supabase
    .from('categories')
    .update({ name, icon, transaction_type, expense_type })
    .eq('id', id);

  if (error) {
    toast.error('Failed to update category');
    throw error;
  }

  toast.success('Category updated successfully');
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Failed to delete category');
    throw error;
  }

  toast.success('Category deleted successfully');
}
