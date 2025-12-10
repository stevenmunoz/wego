/**
 * Types for chat/agent feature
 */

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  agent_config: Record<string, unknown>;
  message_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  agent_config?: Record<string, unknown>;
  use_rag?: boolean;
  stream?: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  message: Message;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  execution_id?: string;
}
