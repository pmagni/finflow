
import React from 'react';
import FinancialHealth from '@/components/ExpenseOverview/FinancialHealth';
import ExpenseChart from '@/components/ExpenseOverview/ExpenseChart';
import TransactionList from '@/components/ExpenseOverview/TransactionList';
import Navigation from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-finflow-dark text-white pb-20">
      <div className="container max-w-md mx-auto p-4">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">FinFlow</h1>
          <div className="w-10 h-10 bg-finflow-card rounded-full flex items-center justify-center">
            <span className="font-medium">JD</span>
          </div>
        </header>
        
        <div className="mb-8">
          <h2 className="text-gray-400 text-sm">Balance</h2>
          <h1 className="text-4xl font-bold">$3,578.00</h1>
        </div>
        
        <FinancialHealth />
        <ExpenseChart />
        <TransactionList />
      </div>
      <Navigation />
    </div>
  );
};

export default Index;
