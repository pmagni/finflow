
import { supabase } from '@/integrations/supabase/client';
import { ChatHistoryItem } from '@/types';
import { localChatHistoryService } from './localChatHistoryService';

/**
 * Manages chat history using both Supabase (when authenticated) and local storage
 */
export const chatHistoryService = {
  /**
   * Get all chat conversations for the current user
   */
  async getAllConversations(): Promise<ChatHistoryItem[]> {
    // Attempt to get user session
    const { data: session } = await supabase.auth.getSession();

    // If no session, fall back to local storage
    if (!session || !session.session) {
      return localChatHistoryService.getAllConversations();
    }
    
    try {
      // For now, just use local storage as we haven't set up the conversations table yet
      return localChatHistoryService.getAllConversations();
    } catch (error) {
      console.error('Error getting chat conversations from Supabase:', error);
      // Fall back to local storage on error
      return localChatHistoryService.getAllConversations();
    }
  },

  /**
   * Get a specific conversation by ID
   */
  async getConversation(id: string): Promise<ChatHistoryItem | null> {
    // Fall back to local storage for now
    return localChatHistoryService.getConversation(id);
  },

  /**
   * Create a new conversation in the database
   */
  async createConversation(title: string): Promise<ChatHistoryItem> {
    // Use local storage for now
    return localChatHistoryService.createConversation(title);
  },

  /**
   * Update an existing conversation
   */
  async updateConversation(conversation: ChatHistoryItem): Promise<ChatHistoryItem> {
    // Use local storage for now
    return localChatHistoryService.updateConversation(conversation);
  },

  /**
   * Delete a conversation by ID
   */
  async deleteConversation(id: string): Promise<void> {
    // Use local storage for now
    return localChatHistoryService.deleteConversation(id);
  }
};
