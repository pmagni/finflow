import React, { useState } from 'react';
import { TransactionsTable } from '@/components/TransactionsPage/TransactionsTable';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { PlusCircle } from 'lucide-react';
import Layout from '@/components/Layout';

const TransactionsPage = () => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <Button 
            onClick={() => setIsTransactionFormOpen(true)}
            className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <TransactionsTable />

        <TransactionForm
          isOpen={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
        />
      </div>
    </Layout>
  );
};

export default TransactionsPage; 