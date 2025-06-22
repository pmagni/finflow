
import React from 'react';
import BudgetPlanner from '@/components/Budget/BudgetPlanner';
import PageContainer from '@/components/Layout/PageContainer';
import AppHeader from '@/components/Layout/AppHeader';

const BudgetPage = () => {
  return (
    <PageContainer>
      <AppHeader 
        title="Presupuesto Mensual"
        subtitle="Planifica y gestiona tus ingresos y gastos"
      />
      <div className="max-w-3xl mx-auto py-8">
        <BudgetPlanner />
      </div>
    </PageContainer>
  );
};

export default BudgetPage;
