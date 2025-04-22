import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { CategoryManagementDialog } from '@/components/CategoryManagement/CategoryManagementDialog';
import { getCategories } from '@/services/categoryService';
import { Category } from './TransactionFormSchema';

export function CategoryField() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { control, watch, setValue } = useFormContext();
  
  const selectedType = watch('type');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const fetchedCategories = await getCategories() as Category[];
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Cuando cambia el tipo de transacción, resetear la categoría si no es compatible
  useEffect(() => {
    setValue('category', ''); // Se establecerá como undefined en el formulario
  }, [selectedType, setValue]);

  const filteredCategories = categories.filter(
    category => category.transaction_type === selectedType
  );

  return (
    <FormField
      control={control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categoría</FormLabel>
          <div className="flex gap-2">
            <Select 
              onValueChange={field.onChange} 
              value={field.value || undefined}
              defaultValue={undefined}
            >
              <FormControl>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Seleccione una categoría" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-gray-800 border-gray-700">
                {isLoading ? (
                  <SelectItem value="loading" disabled>Cargando categorías...</SelectItem>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>Sin categorías disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
            <CategoryManagementDialog
              trigger={
                <Button type="button" size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
