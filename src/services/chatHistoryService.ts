
import { supabase } from '@/integrations/supabase/client';

/**
 * Manages chat history using Supabase
 */
export const chatHistoryService = {
  /**
   * Get all chat conversations for the current user
   */
  async getAllConversations(): Promise<any[]> {
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
  async getConversation(id: string): Promise<any | null> {
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
  async createConversation(title: string): Promise<any> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        throw new Error('No active session');
      }
      
      const newConversation = {
        title,
        user_id: session.session.user.id,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([newConversation])
        .select();
        
      if (error) throw error;
      return data?.[0] || newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  /**
   * Update an existing conversation
   */
  async updateConversation(conversation: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(conversation)
        .eq('id', conversation.id)
        .select();
        
      if (error) throw error;
      return data?.[0] || conversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  /**
   * Delete a conversation by ID
   */
  async deleteConversation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};
