
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for chat conversation data
 */
export interface ChatConversation {
  id?: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Manages chat history using Supabase
 */
export const chatHistoryService = {
  /**
   * Get all chat conversations for the current user
   */
  async getAllConversations(): Promise<ChatConversation[]> {
    // Attempt to get user session
    const { data: session } = await supabase.auth.getSession();

    // If no session, return empty array
    if (!session || !session.session) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', session.session.user.id);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting chat conversations from Supabase:', error);
      return [];
    }
  },

  /**
   * Get a specific conversation by ID
   */
  async getConversation(id: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  },

  /**
   * Create a new conversation in the database
   */
  async createConversation(title: string): Promise<ChatConversation | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        throw new Error('No active session');
      }
      
      const newConversation: ChatConversation = {
        title,
        user_id: session.session.user.id,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([newConversation])
        .select();
        
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  /**
   * Update an existing conversation
   */
  async updateConversation(conversation: ChatConversation): Promise<ChatConversation | null> {
    try {
      if (!conversation.id) {
        throw new Error('Conversation ID is required for updates');
      }
      
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(conversation)
        .eq('id', conversation.id)
        .select();
        
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return null;
    }
  },

  /**
   * Delete a conversation by ID
   */
  async deleteConversation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }
};
