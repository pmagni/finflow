import React, { useState, useEffect } from 'react';
import FinancialHealth from '@/components/ExpenseOverview/FinancialHealth';
import ExpenseChart from '@/components/ExpenseOverview/ExpenseChart';
import TransactionList from '@/components/ExpenseOverview/TransactionList';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { supabase } from '@/integrations/supabase/client';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';
import { formatCurrency } from '@/utils/formatters';

const Index = () => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const calculateBalance = async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*');
      
      let calculatedBalance = 0;
      
      if (transactions) {
        calculatedBalance = transactions.reduce((total, transaction) => {
          if (transaction.type === 'income') {
            return total + Number(transaction.amount);
          } else if (transaction.type === 'expense') {
            return total - Number(transaction.amount);
          }
          return total;
        }, 0);
      }
      
      setBalance(calculatedBalance);
    };
    
    calculateBalance();
    
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          calculateBalance();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-finflow-dark text-white pb-20">
      <div className="container max-w-md mx-auto p-4">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">FinFlow</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsTransactionFormOpen(true)}
              className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
              size="sm"
            >
              <Plus className="mr-1" size={16} />
              Agregar Transacción
            </Button>
            <ProfileMenu />
          </div>
        </header>
        
        <div className="mb-8">
          <h2 className="text-gray-400 text-sm">Balance del Mes</h2>
          <h1 className="text-4xl font-bold">{formatCurrency(balance)}</h1>
        </div>
        
        <ExpenseChart />
        <TransactionList />
        <FinancialHealth />
      </div>
      <Navigation />
      <TransactionForm 
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      />
    </div>
  );
};

export default Index;
