import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';
import FinFlowIcon from '@/assets/favicon.svg';

interface PageHeaderProps {
  onAddTransaction: () => void;
}

const PageHeader = ({ onAddTransaction }: PageHeaderProps) => {
  return (
    <header className="flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <img src={FinFlowIcon} alt="FinFlow Icon" className="w-6 h-6" />
        <h1 className="text-2xl font-bold">FinFlow</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={onAddTransaction}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Agregar Transacción</span>
        </Button>
        <ProfileMenu />
      </div>
    </header>
  );
};

export default PageHeader;
