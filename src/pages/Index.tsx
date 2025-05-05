import React, { useState, useEffect } from 'react';
import FinancialHealth from '@/components/ExpenseOverview/FinancialHealth';
import ExpenseChart from '@/components/ExpenseOverview/ExpenseChart';
import TransactionList from '@/components/ExpenseOverview/TransactionList';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { supabase } from '@/integrations/supabase/client';
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
    <div className="max-w-md mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-gray-400 text-sm">Balance del Mes</h2>
        <h1 className="text-4xl font-bold">{formatCurrency(balance)}</h1>
      </div>
      
      <ExpenseChart />
      <TransactionList />
      <FinancialHealth />

      <TransactionForm 
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      />
    </div>
  );
};

export default Index;
