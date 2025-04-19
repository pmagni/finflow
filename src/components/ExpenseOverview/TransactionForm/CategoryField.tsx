
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
  const { watch } = useFormContext();
  
  // Watch for changes to the transaction type
  const transactionType = watch("type");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on the selected transaction type
  const filteredCategories = categories.filter(
    (category) => category.transaction_type === transactionType
  );

  return (
    <FormField
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <div className="flex gap-2">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-gray-800 border-gray-700 flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-gray-800 border-gray-700">
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                ) : filteredCategories.length === 0 ? (
                  <SelectItem value="no-categories" disabled>
                    No {transactionType} categories found
                  </SelectItem>
                ) : (
                  filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </SelectItem>
                  ))
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
