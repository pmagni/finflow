
import React from 'react';
import ChatInterface from '@/components/Assistant/ChatInterface';
import Navigation from '@/components/Navigation';

const AssistantPage = () => {
  return (
    <div className="min-h-screen bg-finflow-dark text-white pb-20 flex flex-col">
      <div className="container max-w-md mx-auto p-4 flex flex-col flex-1">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <div className="w-10 h-10 bg-finflow-card rounded-full flex items-center justify-center">
            <span className="font-medium">JD</span>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default AssistantPage;
