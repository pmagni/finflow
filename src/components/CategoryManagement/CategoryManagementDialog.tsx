import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { DisplaySection } from './DisplaySection';
import { createCategory, updateCategory } from '@/services/categoryService';

interface CategoryManagementDialogProps {
  onCategoryChange?: () => void;
  initialData?: any;
  onClose?: () => void;
}

export function CategoryManagementDialog({ 
  onCategoryChange,
  initialData,
  onClose 
}: CategoryManagementDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    if (initialData) {
      setEditingCategory(initialData);
      setShowForm(true);
    }
  }, [initialData]);

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await updateCategory({ ...values, id: editingCategory.id });
      } else {
        await createCategory(values);
      }
      setShowForm(false);
      setEditingCategory(null);
      onCategoryChange?.();
      handleClose();
    } catch (error) {
      console.error('Error managing category:', error);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías</DialogTitle>
        </DialogHeader>
        {showForm ? (
          <CategoryForm
            initialData={editingCategory}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <DisplaySection
            setShowForm={setShowForm}
            onEdit={handleEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
