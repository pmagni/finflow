
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { createCategory } from '@/services/categoryService';

interface CategoryManagementDialogProps {
  trigger?: React.ReactNode;
}

export function CategoryManagementDialog({ trigger }: CategoryManagementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreateCategory = async (values: any) => {
    try {
      await createCategory(values);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        {showForm ? (
          <CategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="space-y-4">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </Button>
            <CategoryList onEdit={() => setShowForm(true)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
