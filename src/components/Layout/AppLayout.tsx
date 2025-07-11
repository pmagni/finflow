
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/Header/PageHeader';
import Navigation from '@/components/Navigation';
import TransactionForm from '@/components/ExpenseOverview/TransactionForm';
import Sidebar from '@/components/Layout/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const location = useLocation();
  
  // Ocultar Navigation en desktop para la página del asistente
  const isAssistantPage = location.pathname === '/assistant';

  const handleAddTransaction = () => {
    setIsTransactionFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-finflow-background text-white flex">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col md:ml-64">
        <div className={`${isAssistantPage ? 'w-full px-0' : 'container mx-auto px-4'} flex-1 flex flex-col`}>
          {!isAssistantPage && <PageHeader onAddTransaction={handleAddTransaction} />}
          {isAssistantPage && (
            <div className="hidden md:block py-4 px-6">
              <h1 className="text-2xl font-bold">AI Financial Assistant</h1>
            </div>
          )}
          <main className={`pb-20 flex-1 flex flex-col ${isAssistantPage ? 'md:pb-0' : ''}`}>
            {children}
          </main>
        </div>
        <Navigation className={`md:hidden ${isAssistantPage ? 'md:hidden' : ''}`} />
      </div>
      {!isAssistantPage && (
        <TransactionForm 
          isOpen={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
        />
      )}
    </div>
  );
};

export default AppLayout;
