import { Message, Conversation } from '@/components/Assistant/types';

// Constantes
const STORAGE_KEY = 'finflow_assistant_conversations';
const CURRENT_CONVERSATION_KEY = 'finflow_current_conversation';

// ID estándar para el mensaje de bienvenida
export const WELCOME_MESSAGE_ID = 'welcome-message';

/**
 * Obtener todas las conversaciones guardadas
 */
export function getUserConversations(): Conversation[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    
    const conversations = JSON.parse(storedData) as Conversation[];
    
    // Convertir strings de fecha a objetos Date para los mensajes
    return conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error al obtener conversaciones del localStorage:', error);
    return [];
  }
}

/**
 * Obtener una conversación específica por ID
 */
export function getConversationById(conversationId: string): Conversation | null {
  try {
    const conversations = getUserConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) return null;
    
    return conversation;
  } catch (error) {
    console.error(`Error al obtener conversación ${conversationId}:`, error);
    return null;
  }
}

/**
 * Guardar todas las conversaciones
 */
function saveConversations(conversations: Conversation[]): boolean {
  try {
    // Preparar conversaciones para almacenamiento (mantiene compatibilidad con JSON)
    const conversationsToStore = conversations.map(conversation => ({
      ...conversation,
      // No es necesario hacer nada con las fechas, se convertirán automáticamente a strings
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationsToStore));
    return true;
  } catch (error) {
    console.error('Error al guardar conversaciones en localStorage:', error);
    return false;
  }
}

/**
 * Crear una nueva conversación
 */
export function createConversation(title: string = 'Nueva conversación'): string {
  try {
    const conversations = getUserConversations();
    
    // Mensaje de bienvenida inicial
    const welcomeMessage: Message = {
      id: WELCOME_MESSAGE_ID,
      text: 'Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    // Crear nueva conversación con ID único
    const newConversation: Conversation = {
      id: Date.now().toString(),
      user_id: 'local-user', // No hay concepto de usuario en localStorage
      title,
      messages: [welcomeMessage],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Agregar la nueva conversación y guardar
    const updatedConversations = [newConversation, ...conversations];
    saveConversations(updatedConversations);
    
    // Guardar como conversación actual
    setCurrentConversationId(newConversation.id);
    
    return newConversation.id;
  } catch (error) {
    console.error('Error al crear conversación:', error);
    return '';
  }
}

/**
 * Actualizar el título de una conversación
 */
export function updateConversationTitle(conversationId: string, title: string): boolean {
  try {
    const conversations = getUserConversations();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex === -1) return false;
    
    // Actualizar título y fecha de actualización
    conversations[conversationIndex] = {
      ...conversations[conversationIndex],
      title,
      updated_at: new Date().toISOString()
    };
    
    return saveConversations(conversations);
  } catch (error) {
    console.error(`Error al actualizar título de conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Eliminar una conversación
 */
export function deleteConversation(conversationId: string): boolean {
  try {
    let conversations = getUserConversations();
    
    // Filtrar para eliminar la conversación
    conversations = conversations.filter(c => c.id !== conversationId);
    
    // Si la conversación eliminada era la actual, limpiar la referencia
    if (getCurrentConversationId() === conversationId) {
      clearCurrentConversationId();
    }
    
    return saveConversations(conversations);
  } catch (error) {
    console.error(`Error al eliminar conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Guardar mensajes en una conversación
 */
export function saveMessages(conversationId: string, messages: Message[]): boolean {
  try {
    const conversations = getUserConversations();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex === -1) return false;
    
    // Actualizar mensajes y fecha de actualización
    conversations[conversationIndex] = {
      ...conversations[conversationIndex],
      messages,
      updated_at: new Date().toISOString()
    };
    
    return saveConversations(conversations);
  } catch (error) {
    console.error(`Error al guardar mensajes en conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Añadir un mensaje a una conversación existente
 */
export function addMessageToConversation(
  conversationId: string, 
  message: Message
): boolean {
  try {
    const conversation = getConversationById(conversationId);
    
    if (!conversation) {
      console.error(`No se encontró la conversación ${conversationId}`);
      return false;
    }
    
    // Agregar el nuevo mensaje a la lista existente
    const updatedMessages = [...conversation.messages, message];
    
    // Actualizar la conversación con la nueva lista de mensajes
    return saveMessages(conversationId, updatedMessages);
  } catch (error) {
    console.error(`Error al añadir mensaje a conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Generar un título apropiado para la conversación basado en el primer mensaje del usuario
 */
export function generateConversationTitle(conversationId: string): boolean {
  try {
    const conversation = getConversationById(conversationId);
    
    if (!conversation) {
      return false;
    }
    
    // Buscar el primer mensaje del usuario
    const firstUserMessage = conversation.messages.find(m => m.sender === 'user');
    
    if (!firstUserMessage) {
      return false;
    }
    
    // Crear un título basado en el mensaje (limitado a 50 caracteres)
    let title = firstUserMessage.text.substring(0, 50);
    if (firstUserMessage.text.length > 50) {
      title += '...';
    }
    
    // Actualizar el título de la conversación
    return updateConversationTitle(conversationId, title);
  } catch (error) {
    console.error(`Error al generar título para conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Guardar ID de la conversación actual
 */
export function setCurrentConversationId(conversationId: string): void {
  localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
}

/**
 * Obtener ID de la conversación actual
 */
export function getCurrentConversationId(): string | null {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
}

/**
 * Limpiar ID de la conversación actual
 */
export function clearCurrentConversationId(): void {
  localStorage.removeItem(CURRENT_CONVERSATION_KEY);
}

/**
 * Obtener conversación actual o crear una nueva
 */
export function getCurrentOrCreateConversation(): Conversation {
  // Intentar obtener la conversación actual
  const currentId = getCurrentConversationId();
  
  if (currentId) {
    const conversation = getConversationById(currentId);
    if (conversation) {
      return conversation;
    }
  }
  
  // Crear nueva conversación si no existe una actual
  const newId = createConversation();
  const newConversation = getConversationById(newId);
  
  if (!newConversation) {
    throw new Error('Error al crear una nueva conversación');
  }
  
  return newConversation;
} 