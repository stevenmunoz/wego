/**
 * Chat API service
 */

import { apiClient } from '@/core/api/client';
import { ChatRequest, ChatResponse, Conversation, ConversationDetail } from '../types';

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat/', request);
    return response.data;
  },

  createConversation: async (
    title: string,
    agentConfig?: Record<string, unknown>
  ): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>('/chat/conversations', {
      title,
      agent_config: agentConfig || {},
    });
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<ConversationDetail> => {
    const response = await apiClient.get<ConversationDetail>(
      `/chat/conversations/${conversationId}`
    );
    return response.data;
  },

  listConversations: async (skip: number = 0, limit: number = 100): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>('/chat/conversations', {
      params: { skip, limit },
    });
    return response.data;
  },
};
