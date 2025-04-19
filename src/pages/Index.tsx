import React, { useState, useEffect } from 'react';
import FinancialHealth from '@/components/ExpenseOverview/FinancialHealth';
import ExpenseChart from '@/components/ExpenseOverview/ExpenseChart';
import TransactionList from '@/components/ExpenseOverview/TransactionList';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryManagementDialog } from '@/components/CategoryManagement/CategoryManagementDialog';
import { useAuth } from '@/contexts/AuthContext';

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

  const { user } = useAuth();
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

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
              Add Transaction
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-10 h-10 rounded-full">
                  {userInitials}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <CategoryManagementDialog />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="mb-8">
          <h2 className="text-gray-400 text-sm">Balance</h2>
          <h1 className="text-4xl font-bold">${balance.toFixed(2)}</h1>
        </div>
        
        <FinancialHealth />
        <ExpenseChart />
        <TransactionList />
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
