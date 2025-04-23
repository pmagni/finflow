import React from 'react';
import DebtCalculator from '@/components/DebtAssassin/DebtCalculator';
import Navigation from '@/components/Navigation';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';

const DebtPage = () => {
  return (
    <div className="min-h-screen bg-finflow-dark text-white pb-24">
      <div className="container max-w-md mx-auto p-4">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">Planificador de Deudas</h1>
          <ProfileMenu />
        </header>
        
        <DebtCalculator />
      </div>
      <Navigation />
    </div>
  );
};

export default DebtPage;
