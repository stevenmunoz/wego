/**
 * Chat page component
 */

import { useParams } from 'react-router-dom';
import { ChatInterface, useConversation } from '@/features/chat';

export const ChatPage = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { data: conversation, isLoading } = useConversation(conversationId || '');

  if (conversationId && isLoading) {
    return <div className="chat-page loading">Loading conversation...</div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>{conversation?.title || 'New Conversation'}</h1>
      </div>
      <ChatInterface
        conversationId={conversationId}
        initialMessages={conversation?.messages || []}
      />
    </div>
  );
};
