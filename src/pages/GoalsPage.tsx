
import React from 'react';
import { GoalsManager } from '@/components/Goals/GoalsManager';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';

const GoalsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <TransitionWrapper type="fade">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Metas de Ahorro</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Gestiona y realiza seguimiento de tus objetivos financieros
          </p>
        </div>
        <GoalsManager />
      </TransitionWrapper>
    </div>
  );
};

export default GoalsPage;
