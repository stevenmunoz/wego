/**
 * Hook for chat functionality
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/chat-api';
import { ChatRequest } from '../types';

export const useChat = (conversationId?: string) => {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: (request: ChatRequest) => chatApi.sendMessage(request),
    onSuccess: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    sendMessage: sendMessage.mutate,
    isLoading: sendMessage.isPending,
    error: sendMessage.error,
  };
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
    enabled: !!conversationId,
  });
};

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(),
  });
};
