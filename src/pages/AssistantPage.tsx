import React from 'react';
import AssistantChat from '@/components/Assistant/AssistantChat';
import Layout from '@/components/Layout';

const AssistantPage = () => {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-4 flex flex-col flex-1">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">AI Financial Assistant</h1>
        </header>
        
        <div className="flex-1 flex flex-col">
          <AssistantChat />
        </div>
      </div>
    </Layout>
  );
};

export default AssistantPage;

