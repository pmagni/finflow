import React, { useState, useRef, useEffect } from 'react';
import { getFinancialContextForAssistant } from '@/services/transactionService';
import { Send, Bot, User, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Message, 
  FinancialContext,
  AssistantRequestPayload,
  AssistantResponsePayload,
  AssistantMessage,
  AssistantAction
} from './types';

// URL del webhook
const WEBHOOK_URL = 'https://pmagni.app.n8n.cloud/webhook-test/106ac574-b117-498c-bb7b-2f930489aea7';

const AssistantChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);

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
        toast.error("Error al cargar tu información financiera");
        setErrorState('No se pudo cargar el contexto financiero. Por favor, recarga la página.');
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadFinancialContext();
  }, []);

  // Extraer el objeto de respuesta del formato de la API
  const extractResponseObject = (rawData: any): AssistantResponsePayload => {
    console.log('Datos sin procesar recibidos:', rawData);
    
    // Caso 1: Si es un array, intentamos extraer el primer elemento
    if (Array.isArray(rawData) && rawData.length > 0) {
      // Si el primer elemento tiene una propiedad 'output', la devolvemos
      if (rawData[0].output && typeof rawData[0].output === 'object') {
        return rawData[0].output as AssistantResponsePayload;
      }
      // Si no, devolvemos el primer elemento
      return rawData[0] as AssistantResponsePayload;
    }
    
    // Caso 2: Si ya es un objeto con la estructura correcta
    if (rawData && typeof rawData === 'object') {
      // Si tiene la propiedad 'output', devolvemos esa propiedad
      if (rawData.output && typeof rawData.output === 'object') {
        return rawData.output as AssistantResponsePayload;
      }
      // Si no, devolvemos el objeto tal cual
      return rawData as AssistantResponsePayload;
    }
    
    // Caso fallback: crear un objeto simple con mensaje
    console.error('Formato inesperado de respuesta:', rawData);
    return {
      responseType: 'text',
      message: 'No pude interpretar correctamente la respuesta.'
    };
  };

  // Procesar la respuesta del asistente para extraer el texto
  const getResponseText = (data: AssistantResponsePayload): string => {
    // Caso 1: Si hay un campo 'output' (compatibilidad con versión anterior)
    if (data.output && typeof data.output === 'string') {
      return data.output;
    }
    
    // Caso 2: Si message es un string
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    
    // Caso 3: Si message es un objeto
    if (data.message && typeof data.message === 'object') {
      const messageObj = data.message as AssistantMessage;
      return messageObj.content || "No pude generar una respuesta clara.";
    }
    
    // Caso por defecto
    return "No pude entender esa solicitud.";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Limpiar sugerencias al enviar un nuevo mensaje
    setSuggestedQueries([]);

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
    setErrorState(null);

    try {
      if (!financialContext) {
        throw new Error('No se ha cargado el contexto financiero');
      }

      // Preparar el payload para el webhook
      const payload: AssistantRequestPayload = {
        message: input,
        financialContext
      };

      // Intento de envío al webhook
      let response;
      try {
        console.log('Enviando mensaje al webhook:', payload);
        
        response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          // Agregar timeout
          signal: AbortSignal.timeout(15000) // 15 segundos de timeout
        });
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado tiempo en responder');
        }
        throw new Error(`Error de red: ${fetchError.message}`);
      }

      // Verificar respuesta HTTP
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`El servidor respondió con estado ${response.status}: ${errorText || 'Sin detalles'}`);
      }

      // Verificar que la respuesta tenga contenido
      const rawResponse = await response.text();
      if (!rawResponse || rawResponse.trim() === '') {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      // Intentar analizar JSON
      let rawData;
      try {
        rawData = JSON.parse(rawResponse);
      } catch (jsonError) {
        console.error('Respuesta no JSON:', rawResponse);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }

      // Extraer el objeto de respuesta correctamente
      const data = extractResponseObject(rawData);

      console.log('Respuesta procesada:', data);
      
      // Extraer el texto de respuesta de la estructura compleja
      const assistantResponseText = getResponseText(data);
      
      // Agregar la respuesta del asistente al chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: assistantResponseText,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Si hay consultas relacionadas, actualizar las sugerencias
      if (data.relatedQueries && Array.isArray(data.relatedQueries) && data.relatedQueries.length > 0) {
        setSuggestedQueries(data.relatedQueries);
      }
      
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      
      // Guardar el error para mostrar detalles
      setErrorState(error.message || 'Error desconocido');
      
      // Mensaje de error en caso de fallo
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("No se pudo obtener una respuesta del asistente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
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
        <h2 className="text-lg font-bold">Asistente Financiero</h2>
        <p className="text-gray-400 text-sm mt-1">
          Pregúntame sobre tus gastos, metas de ahorro o consejos financieros.
        </p>
        {errorState && (
          <div className="mt-2 p-2 bg-red-950 border border-red-900 rounded-md text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error:</p>
              <p>{errorState}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto bg-finflow-card rounded-2xl p-5 mb-4 space-y-4">
        {isLoadingContext ? (
          <div className="text-center py-4">
            <p>Cargando tu información financiera...</p>
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
            
            {/* Sugerencias de consultas */}
            {suggestedQueries.length > 0 && !isLoading && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2 flex items-center">
                  <HelpCircle size={12} className="mr-1" />
                  Preguntas sugeridas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((query, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-gray-800 border-gray-700"
                      onClick={() => handleSuggestedQuery(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
          placeholder="Pregunta sobre tus finanzas..."
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