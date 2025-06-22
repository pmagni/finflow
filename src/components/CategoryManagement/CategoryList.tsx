
import { useEffect, useState } from 'react';
import { getCategories, deleteCategory } from '@/services/categoryService';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense';
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CategoryListProps {
  onEdit: (category: Category) => void;
}

export function CategoryList({ onEdit }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      // Type assertion to ensure proper typing
      const typedData = data.map(cat => ({
        ...cat,
        transaction_type: cat.transaction_type as 'income' | 'expense'
      })) as Category[];
      setCategories(typedData);
    };

    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <div className="space-y-2">
      {categories.map((category: Category) => {
        const Icon = getCategoryIcon(category.icon);
        return (
          <div
            key={category.id}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span>{category.name}</span>
                <div className="flex gap-2">
                  <Badge variant={category.transaction_type === 'income' ? 'default' : 'secondary'}>
                    {category.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
