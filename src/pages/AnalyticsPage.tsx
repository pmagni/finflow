
import React from 'react';
import { FinancialAnalytics } from '@/components/Analytics/FinancialAnalytics';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';

const AnalyticsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <TransitionWrapper type="fade">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Análisis Financiero</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Visualiza el comportamiento de tus finanzas con gráficos detallados
          </p>
        </div>
        <FinancialAnalytics />
      </TransitionWrapper>
    </div>
  );
};

export default AnalyticsPage;
