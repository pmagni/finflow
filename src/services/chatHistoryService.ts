import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation } from '@/components/Assistant/types';

// ID estándar para el mensaje de bienvenida
export const WELCOME_MESSAGE_ID = 'welcome-message';

/**
 * Obtener todas las conversaciones del usuario actual
 */
export async function getUserConversations(): Promise<Conversation[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      console.log('No hay usuario autenticado');
      return [];
    }
    
    // Obtenemos conversaciones
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Error al obtener conversaciones:', error);
      return [];
    }
    
    // Convertimos los datos al formato esperado
    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title || 'Conversación sin título',
      created_at: item.created_at,
      updated_at: item.updated_at,
      messages: item.messages || []
    }));
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return [];
  }
}

/**
 * Obtener una conversación específica por ID
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
      
    if (error) {
      console.error(`Error al obtener conversación ${conversationId}:`, error);
      return null;
    }
    
    if (!data) return null;
    
    // Convertir al formato esperado
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title || 'Conversación sin título',
      created_at: data.created_at,
      updated_at: data.updated_at,
      messages: data.messages || []
    };
  } catch (error) {
    console.error(`Error al obtener conversación ${conversationId}:`, error);
    return null;
  }
}

/**
 * Crear una nueva conversación
 */
export async function createConversation(title: string = 'Nueva conversación'): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      console.error('No hay usuario autenticado');
      return null;
    }
    
    // Mensaje de bienvenida inicial
    const welcomeMessage: Message = {
      id: WELCOME_MESSAGE_ID,
      text: 'Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    // Preparar los datos de la conversación
    const conversationData = {
      user_id: user.user.id,
      title,
      messages: [welcomeMessage],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('assistant_conversations')
      .insert(conversationData)
      .select('id')
      .single();
      
    if (error) {
      console.error('Error al crear conversación:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error al crear conversación:', error);
    return null;
  }
}

/**
 * Actualizar el título de una conversación
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('assistant_conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
      
    if (error) {
      console.error(`Error al actualizar título de conversación ${conversationId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar título de conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Eliminar una conversación
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('assistant_conversations')
      .delete()
      .eq('id', conversationId);
      
    if (error) {
      console.error(`Error al eliminar conversación ${conversationId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Guardar mensajes en una conversación
 */
export async function saveMessages(conversationId: string, messages: Message[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('assistant_conversations')
      .update({ 
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
      
    if (error) {
      console.error(`Error al guardar mensajes en conversación ${conversationId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error al guardar mensajes en conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Añadir un mensaje a una conversación existente
 */
export async function addMessageToConversation(
  conversationId: string, 
  message: Message
): Promise<boolean> {
  try {
    // Primero obtenemos la conversación actual
    const conversation = await getConversationById(conversationId);
    
    if (!conversation) {
      console.error(`No se encontró la conversación ${conversationId}`);
      return false;
    }
    
    // Agregamos el nuevo mensaje a la lista existente
    const updatedMessages = [...conversation.messages, message];
    
    // Actualizamos la conversación con la nueva lista de mensajes
    return await saveMessages(conversationId, updatedMessages);
  } catch (error) {
    console.error(`Error al añadir mensaje a conversación ${conversationId}:`, error);
    return false;
  }
}

/**
 * Generar un título apropiado para la conversación basado en el primer mensaje del usuario
 */
export async function generateConversationTitle(conversationId: string): Promise<boolean> {
  try {
    const conversation = await getConversationById(conversationId);
    
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
    return await updateConversationTitle(conversationId, title);
  } catch (error) {
    console.error(`Error al generar título para conversación ${conversationId}:`, error);
    return false;
  }
} 