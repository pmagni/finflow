
import React from 'react';
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

export function CategoryField() {
  return (
    <FormField
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <div className="flex gap-2">
            <Select onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="bg-gray-800 border-gray-700 flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-gray-800 border-gray-700">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
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
