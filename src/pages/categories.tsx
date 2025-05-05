import React from 'react';
import { CategoryManagementDialog } from '@/components/CategoryManagement/CategoryManagementDialog';

const CategoriesPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Administrar Categorías</h1>
      <CategoryManagementDialog />
    </div>
  );
};

export default CategoriesPage; 