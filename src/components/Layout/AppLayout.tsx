import React, { useState } from 'react';
import PageHeader from '@/components/Header/PageHeader';
import Navigation from '@/components/Navigation';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  const handleAddTransaction = () => {
    setIsTransactionFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-finflow-background text-white">
      <div className="container mx-auto px-4">
        <PageHeader onAddTransaction={handleAddTransaction} />
        <main className="pb-20">
          {children}
        </main>
      </div>
      <Navigation />
      <TransactionForm 
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      />
    </div>
  );
};

export default AppLayout; 