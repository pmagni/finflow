import React from 'react';
import DebtCalculator from '@/components/DebtAssassin/DebtCalculator';
import Navigation from '@/components/Navigation';

const DebtPage = () => {
  return (
    <div className="min-h-screen bg-finflow-dark text-white pb-24">
      <div className="container max-w-md mx-auto p-4">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">Debt Assassin</h1>
          <div className="w-10 h-10 bg-finflow-card rounded-full flex items-center justify-center">
            <span className="font-medium">JD</span>
          </div>
        </header>
        
        <DebtCalculator />
      </div>
      <Navigation />
    </div>
  );
};

export default DebtPage;
