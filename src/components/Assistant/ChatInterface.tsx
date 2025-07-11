/**
 * @deprecated This component is deprecated. 
 * Please use AssistantChat.tsx instead for all new development.
 * This file is kept for historical reference only.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { Message } from '@/types';
import { toast } from '@/components/ui/sonner';
import { getRecentExpenses, getExpensesByCategory, getTotalExpenses, getFinancialHealthScore } from '@/services/expenseService';

const ChatInterfaceDeprecated = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. Ask me anything about your finances.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      // These should be awaited in production code
      const recentTransactions = await getRecentExpenses();
      const expensesByCategory = await getExpensesByCategory();
      const totalExpenses = await getTotalExpenses();
      const financialHealth = getFinancialHealthScore();

      console.log('Sending message to webhook with financial data:', {
        message: inputMessage,
        financialContext: {
          recentTransactions,
          expensesByCategory,
          totalExpenses,
          financialHealth
        }
      });
      
      const response = await fetch('https://pmagni.app.n8n.cloud/webhook/106ac574-b117-498c-bb7b-2f930489aea7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          financialContext: {
            recentTransactions,
            expensesByCategory,
            totalExpenses,
            financialHealth
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get response from assistant: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response received:', data);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: data.output || "I couldn't understand that request.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to get a response from the assistant");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] animate-fade-in">
      <div className="bg-finflow-card rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-bold">Finance Assistant</h2>
        <p className="text-gray-400 text-sm mt-1">
          Ask me about your spending, saving goals, or financial advice.
        </p>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-finflow-card rounded-2xl p-5 mb-4 space-y-4"
      >
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex items-start gap-3 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-finflow-mint flex items-center justify-center">
                <Bot size={18} className="text-black" />
              </div>
            )}
            
            <div 
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.sender === 'user' 
                  ? 'bg-finflow-mint text-black rounded-tr-none' 
                  : 'bg-gray-800 rounded-tl-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-finflow-mint flex items-center justify-center">
              <Bot size={18} className="text-black" />
            </div>
            <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none max-w-[80%]">
              <div className="flex space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-finflow-card rounded-2xl p-3 flex items-center gap-2">
        <Input
          placeholder="Ask about your expenses..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="bg-gray-800 border-none text-white flex-1"
          disabled={loading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim()}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterfaceDeprecated;
