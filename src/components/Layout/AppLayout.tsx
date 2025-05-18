import React, { useState } from 'react';
import PageHeader from '@/components/Header/PageHeader';
import Navigation from '@/components/Navigation';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import Sidebar from '@/components/Layout/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  const handleAddTransaction = () => {
    setIsTransactionFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-finflow-background text-white flex">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex flex-col">
          <PageHeader onAddTransaction={handleAddTransaction} />
          <main className="pb-20 flex-1 flex flex-col">
            {children}
          </main>
        </div>
        <Navigation className="md:hidden" />
      </div>
      <TransactionForm 
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      />
    </div>
  );
};

export default AppLayout; 