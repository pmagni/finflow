
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
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

export async function createCategory({ name, color, icon }: Omit<Category, 'id'>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    toast.error('You need to be logged in to create a category');
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, color, icon, user_id: user.id })
    .select()
    .single();

  if (error) {
    toast.error('Failed to create category');
    throw error;
  }

  toast.success('Category created successfully');
  return data;
}

export async function updateCategory({ id, name, color, icon }: Category) {
  const { error } = await supabase
    .from('categories')
    .update({ name, color, icon })
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
