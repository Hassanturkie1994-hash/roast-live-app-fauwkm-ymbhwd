
import { useState, useEffect } from 'react';
import { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'follow',
        title: 'New Follower',
        message: '@roastfan started following you',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
      },
      {
        id: '2',
        type: 'gift',
        title: 'Gift Received',
        message: 'You received a Fire emoji from @supporter',
        timestamp: new Date(Date.now() - 7200000),
        read: false,
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
