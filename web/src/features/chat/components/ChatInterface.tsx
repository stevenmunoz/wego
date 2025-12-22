/**
 * Chat interface component
 */

import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/use-chat';
import { Message } from '../types';

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Message[];
}

export const ChatInterface = ({ conversationId, initialMessages = [] }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading } = useChat(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Partial<Message> = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage as Message]);
    setInput('');

    sendMessage(
      {
        message: input,
        conversation_id: conversationId,
      },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, data.message]);
        },
        onError: (error) => {
          console.error('Chat error:', error);
          // Remove the optimistic user message on error
          setMessages((prev) => prev.slice(0, -1));
        },
      }
    );
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.role}`}>
            <div className="message-role">{message.role}</div>
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-assistant">
            <div className="message-role">assistant</div>
            <div className="message-content typing">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="chat-send-button">
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
