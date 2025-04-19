
import { useEffect, useState } from 'react';
import { getCategories, deleteCategory } from '@/services/categoryService';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Badge } from '@/components/ui/badge';

interface CategoryListProps {
  onEdit: (category: any) => void;
}

export function CategoryList({ onEdit }: CategoryListProps) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
    };

    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((cat: any) => cat.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <div className="space-y-2">
      {categories.map((category: any) => {
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
                <Badge variant={category.transaction_type === 'income' ? 'default' : 'secondary'}>
                  {category.transaction_type}
                </Badge>
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
