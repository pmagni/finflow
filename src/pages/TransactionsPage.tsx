import React, { useState, useEffect } from 'react';
import TransactionsTable from '@/components/TransactionsPage/TransactionsTable';
import { TransactionStats } from '@/components/TransactionsPage/TransactionStats';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';

const TransactionsPage = () => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            category:categories(name, icon)
          `)
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar las transacciones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <Button 
          onClick={() => setIsTransactionFormOpen(true)}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black h-9 px-3"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" />
          Nueva
        </Button>
      </div>

      <Tabs defaultValue="list" className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <TransactionsTable 
            transactions={transactions} 
            error={error}
          />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <TransactionStats />
        </TabsContent>
      </Tabs>

      <TransactionForm
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      />
    </div>
  );
};

export default TransactionsPage;
