/**
 * Conversations list page
 */

import { Link } from 'react-router-dom';
import { ConversationList } from '@/features/chat';

export const ConversationsPage = () => {
  return (
    <div className="conversations-page">
      <div className="page-header">
        <h1>Conversations</h1>
        <Link to="/chat" className="new-chat-button">
          New Chat
        </Link>
      </div>
      <ConversationList />
    </div>
  );
};
