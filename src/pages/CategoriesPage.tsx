import React, { useState, useEffect } from 'react';
import { getCategories, deleteCategory, createCategory, updateCategory } from '@/services/categoryService';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CategoryForm } from '@/components/CategoryManagement/CategoryForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense';
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await getCategories();
      // Asegurarse de que transaction_type sea 'income' o 'expense'
      const typedData = data.map(cat => ({
        ...cat,
        transaction_type: cat.transaction_type as 'income' | 'expense'
      }));
      setCategories(typedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter(cat => cat.id !== id));
        toast.success('Categoría eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Error al eliminar la categoría');
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowDialog(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await updateCategory({ ...values, id: editingCategory.id });
      } else {
        await createCategory(values);
      }
      setShowDialog(false);
      setEditingCategory(null);
      fetchCategories();
      toast.success(editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
    } catch (error) {
      console.error('Error managing category:', error);
      toast.error('Error al gestionar la categoría');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Categorías</h1>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setShowDialog(true);
          }}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Categoría
        </Button>
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        {isLoading ? (
          <div className="text-center">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="text-center">No hay categorías disponibles</div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant={category.transaction_type === 'income' ? 'default' : 'secondary'}>
                        {category.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            initialData={editingCategory}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowDialog(false);
              setEditingCategory(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage; 