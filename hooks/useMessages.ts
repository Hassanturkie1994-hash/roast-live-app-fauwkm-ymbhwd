
import { useState, useEffect } from 'react';
import { Message } from '../types';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: '2',
        senderName: 'Comedy Queen',
        content: 'Hey! Great stream yesterday!',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
      },
      {
        id: '2',
        senderId: '3',
        senderName: 'Roast Fan',
        content: 'When is your next stream?',
        timestamp: new Date(Date.now() - 7200000),
        read: true,
      },
    ];
    setMessages(mockMessages);
    setUnreadCount(mockMessages.filter(m => !m.read).length);
  };

  const sendMessage = (recipientId: string, content: string) => {
    console.log('Sending message to:', recipientId, content);
    // Implement send message logic
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, read: true } : m))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return {
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
  };
}
