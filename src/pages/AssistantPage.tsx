
import React from 'react';
import AssistantChat from '@/components/Assistant/AssistantChat';
import AppLayout from '@/components/Layout/AppLayout';

const AssistantPage = () => {
  return (
    <AppLayout>
      <div className="flex flex-col flex-1 h-full w-full">
        <header className="flex justify-between items-center py-4 md:hidden px-4">
          <h1 className="text-2xl font-bold">AI Financial Assistant</h1>
        </header>
        
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <AssistantChat />
        </div>
      </div>
    </AppLayout>
  );
};

export default AssistantPage;
