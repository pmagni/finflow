import React, { useState, useRef, useEffect } from 'react';
import { getFinancialContextForAssistant } from '@/services/transactionService';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { 
  Message, 
  FinancialContext,
  AssistantRequestPayload,
  AssistantResponsePayload
} from './types';

const AssistantChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your financial assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para desplazarse hacia abajo cuando se agregan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar el contexto financiero al inicio
  useEffect(() => {
    const loadFinancialContext = async () => {
      try {
        setIsLoadingContext(true);
        const context = await getFinancialContextForAssistant();
        setFinancialContext(context as FinancialContext);
      } catch (error) {
        console.error('Error loading financial context:', error);
        toast.error("Failed to load your financial information");
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadFinancialContext();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Agregar el mensaje del usuario al chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!financialContext) {
        throw new Error('Financial context not loaded');
      }

      // Preparar el payload para el webhook
      const payload: AssistantRequestPayload = {
        message: input,
        financialContext
      };

      // Registro para depuración
      console.log('Sending message to webhook with financial data:', payload);
      
      // Enviar la solicitud al webhook especificado
      const response = await fetch('https://pmagni.app.n8n.cloud/webhook-test/106ac574-b117-498c-bb7b-2f930489aea7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response from assistant: ${response.status}`);
      }

      const data = await response.json() as AssistantResponsePayload;
      console.log('Response received:', data);
      
      // Agregar la respuesta del asistente al chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: data.output || "I couldn't understand that request.",
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mensaje de error en caso de fallo
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to get a response from the assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      
      <div className="flex-1 overflow-y-auto bg-finflow-card rounded-2xl p-5 mb-4 space-y-4">
        {isLoadingContext ? (
          <div className="text-center py-4">
            <p>Loading your financial information...</p>
          </div>
        ) : (
          <>
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
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isLoading && (
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
        <Textarea
          placeholder="Ask about your finances..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-gray-800 border-none text-white flex-1 min-h-10"
          disabled={isLoading || isLoadingContext}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || isLoadingContext || !input.trim()}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
        >
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <Send size={18} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default AssistantChat; 