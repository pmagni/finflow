import React from 'react';
import Layout from '@/components/Layout';
import ProgressExamples from '@/components/ui/examples/ProgressExamples';

const UIComponentsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Componentes UI</h1>
        
        <div className="space-y-8">
          {/* Progress Component */}
          <div className="mb-8">
            <ProgressExamples />
          </div>
          
          {/* Se pueden agregar más ejemplos de componentes aquí */}
        </div>
      </div>
    </Layout>
  );
};

export default UIComponentsPage; 