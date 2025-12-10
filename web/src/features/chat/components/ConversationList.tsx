/**
 * Conversation list component
 */

import { Link } from 'react-router-dom';
import { useConversations } from '../hooks/use-chat';

export const ConversationList = () => {
  const { data: conversations, isLoading, error } = useConversations();

  if (isLoading) return <div>Loading conversations...</div>;
  if (error) return <div>Error loading conversations</div>;
  if (!conversations || conversations.length === 0) {
    return <div className="empty-state">No conversations yet. Start a new chat!</div>;
  }

  return (
    <div className="conversation-list">
      <h2>Your Conversations</h2>
      <div className="conversations">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/chat/${conversation.id}`}
            className="conversation-item"
          >
            <div className="conversation-title">{conversation.title}</div>
            <div className="conversation-meta">
              <span>{conversation.message_count} messages</span>
              <span>{new Date(conversation.updated_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
