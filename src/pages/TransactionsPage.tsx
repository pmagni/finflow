import React, { useState } from 'react';
import { TransactionsTable } from '@/components/TransactionsPage/TransactionsTable';
import { TransactionStats } from '@/components/TransactionsPage/TransactionStats';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TransactionsPage = () => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
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
            <TransactionsTable />
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
    </Layout>
  );
};

export default TransactionsPage; 