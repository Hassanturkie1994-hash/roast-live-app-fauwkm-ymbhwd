
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followers: number;
  following: number;
  verified?: boolean;
}

export interface Stream {
  id: string;
  title: string;
  thumbnail: string;
  user: User;
  viewers: number;
  isLive: boolean;
  category?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'gift' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface Gift {
  id: string;
  name: string;
  image: string;
  coins: number;
  category: string;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'earning';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  tier: 'basic' | 'premium' | 'vip';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}
