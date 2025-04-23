import React, { useState, useRef, useEffect } from 'react';
import { getFinancialContextForAssistant } from '@/services/transactionService';
import { Send, Bot, User, AlertTriangle, HistoryIcon, Plus, Trash2, Edit, ArrowLeftRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Message, 
  FinancialContext,
  AssistantRequestPayload,
  AssistantResponsePayload,
  AssistantMessage,
  AssistantAction,
  Conversation
} from './types';
import * as chatHistoryService from '@/services/localChatHistoryService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// URL del webhook
const WEBHOOK_URL = 'https://pmagni.app.n8n.cloud/webhook/106ac574-b117-498c-bb7b-2f930489aea7';

const AssistantChat = () => {
  const [input, setInput] = useState('');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [isNewConvDialogOpen, setIsNewConvDialogOpen] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [isEditConvDialogOpen, setIsEditConvDialogOpen] = useState(false);
  const [editConvTitle, setEditConvTitle] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para desplazarse hacia abajo cuando se agregan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Cargar conversaciones y contexto financiero al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingContext(true);
        
        // Cargar conversaciones
        const loadedConversations = chatHistoryService.getUserConversations();
        setConversations(loadedConversations);
        
        // Cargar la conversación actual o crear una nueva
        const currentConversation = chatHistoryService.getCurrentOrCreateConversation();
        setCurrentConversation(currentConversation);
        
        // Cargar el contexto financiero
        const context = await getFinancialContextForAssistant();
        setFinancialContext(context as FinancialContext);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast.error("Error al cargar información inicial");
        setErrorState('No se pudieron cargar los datos iniciales. Por favor, recarga la página.');
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadInitialData();
  }, []);

  // Extraer el objeto de respuesta del formato de la API
  const extractResponseObject = (rawData: any): AssistantResponsePayload => {
    console.log('Datos sin procesar recibidos:', rawData);
    
    // Caso 1: Si es un array, intentamos extraer el primer elemento
    if (Array.isArray(rawData) && rawData.length > 0) {
      const firstItem = rawData[0];
      
      // Si el primer elemento es un objeto con propiedad output
      if (firstItem && typeof firstItem === 'object' && 'output' in firstItem) {
        // Caso 1.1: Si output es un objeto, lo devolvemos como la respuesta
        if (typeof firstItem.output === 'object' && firstItem.output !== null) {
          console.log('Procesando output como objeto:', firstItem.output);
          return firstItem.output as AssistantResponsePayload;
        }
        
        // Caso 1.2: Si output es un string u otro tipo primitivo, creamos un objeto con ese valor
        console.log('Procesando output como valor primitivo:', firstItem.output);
        return {
          responseType: 'text',
          message: String(firstItem.output)
        };
      }
      
      // Si no tiene propiedad output, devolvemos el primer elemento directamente
      console.log('Procesando primer elemento del array:', firstItem);
      return firstItem as AssistantResponsePayload;
    }
    
    // Caso 2: Si ya es un objeto con la estructura correcta (no un array)
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      // Si tiene la propiedad 'output', procesamos el output
      if ('output' in rawData) {
        // Caso 2.1: Si output es un objeto, lo devolvemos como respuesta
        if (typeof rawData.output === 'object' && rawData.output !== null) {
          console.log('Procesando output de objeto como objeto:', rawData.output);
          return rawData.output as AssistantResponsePayload;
        }
        
        // Caso 2.2: Si output es un string u otro tipo primitivo, creamos un objeto con ese valor
        console.log('Procesando output de objeto como valor primitivo:', rawData.output);
        return {
          responseType: 'text',
          message: String(rawData.output)
        };
      }
      
      // Si no tiene propiedad output, devolvemos el objeto tal cual
      console.log('Procesando objeto:', rawData);
      return rawData as AssistantResponsePayload;
    }
    
    // Caso fallback: crear un objeto simple con mensaje genérico
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
      const baseMessage = data.message;
      
      // Si es tipo breakdown, agregar el desglose detallado
      if (data.responseType === 'breakdown' && data.breakdown) {
        const { breakdown } = data;
        let response = `${baseMessage}\n\n`;
        
        // Agregar título y total
        response += `📊 ${breakdown.title}\n`;
        response += `💰 Total: ${breakdown.total}${breakdown.currency}\n\n`;
        
        // Agregar desglose por categoría
        breakdown.items.forEach(item => {
          const trendIcon = item.trend === 'up' ? '↗️' : 
                          item.trend === 'down' ? '↘️' : '➡️';
          response += `${trendIcon} ${item.category}: ${item.amount}${breakdown.currency} (${item.percentage.toFixed(1)}%)\n`;
        });
        
        return response;
      }
      
      return baseMessage;
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
    if (!input.trim() || !currentConversation) return;

    // Limpiar sugerencias al enviar un nuevo mensaje
    setSuggestedQueries([]);

    // Agregar el mensaje del usuario al chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    // Actualizar la UI localmente para mostrar el mensaje inmediatamente
    const updatedMessages = [...currentConversation.messages, userMessage];
    setCurrentConversation({
      ...currentConversation,
      messages: updatedMessages
    });

    // Guardar en el servicio de historial
    chatHistoryService.addMessageToConversation(currentConversation.id, userMessage);

    // Generar título para la conversación si es el primer mensaje del usuario
    if (currentConversation.messages.filter(m => m.sender === 'user').length === 0) {
      setTimeout(() => {
        chatHistoryService.generateConversationTitle(currentConversation.id);
        // Recargar las conversaciones para mostrar el nuevo título
        refreshConversations();
      }, 500);
    }

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
          // Aumentar el timeout a 30 segundos
          signal: AbortSignal.timeout(30000) // 30 segundos de timeout
        });
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error('Timeout error:', fetchError);
          throw new Error('La conexión tardó demasiado tiempo. Por favor, verifica tu conexión a internet e intenta nuevamente.');
        }
        console.error('Network error:', fetchError);
        throw new Error(`Error de conexión: ${fetchError.message}`);
      }

      // Verificar respuesta HTTP con más detalles
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
        throw new Error(`Error del servidor (${response.status}): ${errorText || 'Sin detalles del error'}`);
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

      // Actualizar la conversación con el mensaje del asistente
      const updatedWithAssistantMessage = [...updatedMessages, assistantMessage];
      setCurrentConversation({
        ...currentConversation,
        messages: updatedWithAssistantMessage
      });

      // Guardar en el servicio de historial
      chatHistoryService.addMessageToConversation(currentConversation.id, assistantMessage);
      
      // Si hay consultas relacionadas, actualizar las sugerencias
      if (data.relatedQueries && Array.isArray(data.relatedQueries) && data.relatedQueries.length > 0) {
        setSuggestedQueries(data.relatedQueries);
      }
      
      // Recargar las conversaciones para actualizar la lista
      refreshConversations();
      
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      
      // Determinar un mensaje de error más específico
      let errorMessage = 'Lo siento, hubo un error al procesar tu solicitud.';
      if (error.message.includes('tardó demasiado tiempo')) {
        errorMessage = 'La conexión está tardando demasiado. Por favor, verifica tu conexión a internet e intenta nuevamente.';
      } else if (error.message.includes('Error de conexión')) {
        errorMessage = 'Hay problemas con la conexión al servidor. Por favor, verifica tu conexión a internet.';
      } else if (error.message.includes('Error del servidor')) {
        errorMessage = 'El servidor está experimentando problemas. Por favor, intenta nuevamente en unos momentos.';
      }
      
      // Guardar el error para mostrar detalles
      setErrorState(error.message || 'Error desconocido');
      
      // Mensaje de error en caso de fallo
      const errorResponseMessage: Message = {
        id: Date.now().toString(),
        text: errorMessage,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      // Actualizar la conversación con el mensaje de error
      const updatedWithErrorMessage = [...updatedMessages, errorResponseMessage];
      setCurrentConversation({
        ...currentConversation,
        messages: updatedWithErrorMessage
      });

      // Guardar en el servicio de historial
      chatHistoryService.addMessageToConversation(currentConversation.id, errorResponseMessage);
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recargar la lista de conversaciones
  const refreshConversations = () => {
    const updatedConversations = chatHistoryService.getUserConversations();
    setConversations(updatedConversations);
    
    // Actualizar también la conversación actual
    if (currentConversation) {
      const updatedCurrentConversation = chatHistoryService.getConversationById(currentConversation.id);
      if (updatedCurrentConversation) {
        setCurrentConversation(updatedCurrentConversation);
      }
    }
  };

  // Cambiar a una conversación específica
  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    chatHistoryService.setCurrentConversationId(conversation.id);
    setSuggestedQueries([]);
    setShowSidebar(false);
  };

  // Crear una nueva conversación
  const handleCreateNewConversation = () => {
    setIsNewConvDialogOpen(true);
  };

  // Guardar nueva conversación
  const handleSaveNewConversation = () => {
    const title = newConvTitle.trim() || 'Nueva conversación';
    const conversationId = chatHistoryService.createConversation(title);
    
    // Refrescar conversaciones y establecer la nueva como actual
    refreshConversations();
    
    // Cerrar diálogo y limpiar estado
    setIsNewConvDialogOpen(false);
    setNewConvTitle('');
    
    // Seleccionar la nueva conversación
    const newConversation = chatHistoryService.getConversationById(conversationId);
    if (newConversation) {
      setCurrentConversation(newConversation);
    }
  };

  // Abrir diálogo para editar título
  const handleEditConversation = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditConvTitle(conversation.title);
    setIsEditConvDialogOpen(true);
    
    // Guardar temporalmente el ID de la conversación a editar
    setCurrentConversation(conversation);
  };

  // Guardar título editado
  const handleSaveEditedTitle = () => {
    if (currentConversation) {
      const title = editConvTitle.trim() || 'Conversación sin título';
      chatHistoryService.updateConversationTitle(currentConversation.id, title);
      refreshConversations();
    }
    
    setIsEditConvDialogOpen(false);
    setEditConvTitle('');
  };

  // Confirmar eliminación de conversación
  const handleConfirmDelete = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setCurrentConversation(conversation);
    setIsDeleteDialogOpen(true);
  };

  // Eliminar conversación
  const handleDeleteConversation = () => {
    if (currentConversation) {
      chatHistoryService.deleteConversation(currentConversation.id);
      
      // Obtener una nueva lista de conversaciones
      const updatedConversations = chatHistoryService.getUserConversations();
      setConversations(updatedConversations);
      
      // Si hay conversaciones, seleccionar la primera, sino crear una nueva
      if (updatedConversations.length > 0) {
        setCurrentConversation(updatedConversations[0]);
        chatHistoryService.setCurrentConversationId(updatedConversations[0].id);
      } else {
        const newId = chatHistoryService.createConversation();
        const newConversation = chatHistoryService.getConversationById(newId);
        if (newConversation) {
          setCurrentConversation(newConversation);
        }
      }
    }
    
    setIsDeleteDialogOpen(false);
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
    <div className="flex h-full animate-fade-in">
      {/* Panel lateral de conversaciones */}
      <div 
        className={`fixed inset-y-0 left-0 z-20 transition-transform duration-300 transform
                   lg:relative lg:translate-x-0 bg-gray-900 border-r border-gray-800 w-72
                   ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Conversaciones</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar(false)}
              className="lg:hidden"
            >
              <X size={18} />
            </Button>
          </div>
          
          <div className="p-2">
            <Button 
              onClick={handleCreateNewConversation}
              className="w-full flex items-center justify-start gap-2"
            >
              <Plus size={16} />
              Nueva conversación
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-2 py-2">
            {conversations.length === 0 ? (
              <p className="text-center text-gray-400 p-4">No hay conversaciones</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`rounded-lg p-3 cursor-pointer flex justify-between items-start group
                                hover:bg-gray-800 transition-colors
                                ${currentConversation?.id === conversation.id ? 'bg-gray-800' : 'bg-gray-900'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conversation.updated_at), 'dd MMM, HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleEditConversation(e, conversation)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-red-400"
                        onClick={(e) => handleConfirmDelete(e, conversation)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Encabezado del chat - siempre visible */}
        <div className="bg-finflow-card rounded-2xl p-5 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <Menu size={18} />
              </Button>
              <h2 className="text-lg font-bold">
                {currentConversation?.title || 'Asistente Financiero'}
              </h2>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HistoryIcon size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva conversación
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
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
        
        {/* Área de mensajes - altura flexible con scroll */}
        <div className="flex-1 overflow-hidden bg-finflow-card rounded-2xl p-5 mb-4">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-4">
              {isLoadingContext ? (
                <div className="text-center py-4">
                  <p>Cargando tu información financiera...</p>
                </div>
              ) : (
                <>
                  {currentConversation?.messages.map((message) => (
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
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <ArrowLeftRight className="mr-1 h-3 w-3" />
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
          </ScrollArea>
        </div>
        
        {/* Área de entrada - siempre visible al final */}
        <div className="bg-finflow-card rounded-2xl p-3 flex items-center gap-2 flex-shrink-0 mb-1 z-10">
          <Textarea
            placeholder="Pregunta sobre tus finanzas..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-800 border-none text-white flex-1 min-h-10 resize-none"
            disabled={isLoading || isLoadingContext || !currentConversation}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || isLoadingContext || !input.trim() || !currentConversation}
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
      
      {/* Diálogos */}
      <Dialog open={isNewConvDialogOpen} onOpenChange={setIsNewConvDialogOpen}>
        <DialogContent className="bg-finflow-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Nueva conversación</DialogTitle>
            <DialogDescription>
              Crea una nueva conversación con el asistente financiero
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Título de la conversación"
              value={newConvTitle}
              onChange={(e) => setNewConvTitle(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewConvDialogOpen(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveNewConversation}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar título */}
      <Dialog open={isEditConvDialogOpen} onOpenChange={setIsEditConvDialogOpen}>
        <DialogContent className="bg-finflow-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar conversación</DialogTitle>
            <DialogDescription>
              Modifica el título de esta conversación
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Título de la conversación"
              value={editConvTitle}
              onChange={(e) => setEditConvTitle(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditConvDialogOpen(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEditedTitle}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-finflow-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConversation}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssistantChat; 