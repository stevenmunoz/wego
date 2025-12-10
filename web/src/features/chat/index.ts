/**
 * Chat feature barrel export
 */

export { ChatInterface } from './components/ChatInterface';
export { ConversationList } from './components/ConversationList';
export { useChat, useConversation, useConversations } from './hooks/use-chat';
export { chatApi } from './services/chat-api';
export type { Message, Conversation, ConversationDetail, ChatRequest, ChatResponse } from './types';
