
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';

interface PageHeaderProps {
  onAddTransaction: () => void;
}

const PageHeader = ({ onAddTransaction }: PageHeaderProps) => {
  return (
    <header className="flex justify-between items-center py-4">
      <h1 className="text-2xl font-bold">FinFlow</h1>
      <div className="flex items-center gap-4">
        <Button
          onClick={onAddTransaction}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
          size="sm"
        >
          <Plus className="mr-1" size={16} />
          Agregar Transacción
        </Button>
        <ProfileMenu />
      </div>
    </header>
  );
};

export default PageHeader;
