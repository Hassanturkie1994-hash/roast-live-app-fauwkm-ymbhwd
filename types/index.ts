
// Core User Types
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  is_premium: boolean;
  is_moderator: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Ban Types
export interface Ban {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  expires_at?: string;
  is_permanent: boolean;
  created_at: string;
}

export interface BanRequest {
  user_id: string;
  reason: string;
  duration_hours?: number;
  is_permanent?: boolean;
}

// Timeout Types
export interface Timeout {
  id: string;
  user_id: string;
  stream_id: string;
  timeout_by: string;
  reason: string;
  expires_at: string;
  created_at: string;
}

export interface TimeoutRequest {
  user_id: string;
  stream_id: string;
  reason: string;
  duration_minutes: number;
}

// Moderator Types
export interface Moderator {
  id: string;
  user_id: string;
  assigned_by: string;
  permissions: string[];
  created_at: string;
}

export interface ModeratorRequest {
  user_id: string;
  permissions?: string[];
}

// Live Stream Types
export interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_key: string;
  is_live: boolean;
  viewer_count: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StartLiveRequest {
  title: string;
  description?: string;
  thumbnail_url?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export enum NotificationType {
  FOLLOW = 'follow',
  LIKE = 'like',
  COMMENT = 'comment',
  GIFT = 'gift',
  LIVE_START = 'live_start',
  SYSTEM = 'system',
  MODERATION = 'moderation',
}

export interface NotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushNotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Leaderboard Types
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  rank: number;
  period: LeaderboardPeriod;
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

// Story Types
export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  expires_at: string;
  view_count: number;
  created_at: string;
}

// Stripe Types
export interface StripeCheckoutRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface StripeSubscriptionRequest {
  price_id: string;
  payment_method_id: string;
}

export interface StripeCancelRequest {
  subscription_id: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database Table Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      bans: {
        Row: Ban;
        Insert: Omit<Ban, 'id' | 'created_at'>;
        Update: Partial<Omit<Ban, 'id' | 'created_at'>>;
      };
      timeouts: {
        Row: Timeout;
        Insert: Omit<Timeout, 'id' | 'created_at'>;
        Update: Partial<Omit<Timeout, 'id' | 'created_at'>>;
      };
      moderators: {
        Row: Moderator;
        Insert: Omit<Moderator, 'id' | 'created_at'>;
        Update: Partial<Omit<Moderator, 'id' | 'created_at'>>;
      };
      live_streams: {
        Row: LiveStream;
        Insert: Omit<LiveStream, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LiveStream, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      stories: {
        Row: Story;
        Insert: Omit<Story, 'id' | 'created_at'>;
        Update: Partial<Omit<Story, 'id' | 'created_at'>>;
      };
    };
  };
}
