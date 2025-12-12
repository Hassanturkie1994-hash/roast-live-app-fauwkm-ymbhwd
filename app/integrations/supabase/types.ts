
// Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// User Profile Type
export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// Stream Type
export interface Stream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_live: boolean;
  viewer_count: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

// Message Type
export interface Message {
  id: string;
  stream_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Gift Type
export interface Gift {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  coin_value: number;
  created_at: string;
}

// Transaction Type
export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'earning';
  amount: number;
  description?: string;
  created_at: string;
}

// Notification Type
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Json;
  created_at: string;
}

// Follower Type
export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Database Schema Type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      streams: {
        Row: Stream;
        Insert: Omit<Stream, 'id' | 'created_at'>;
        Update: Partial<Omit<Stream, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      gifts: {
        Row: Gift;
        Insert: Omit<Gift, 'id' | 'created_at'>;
        Update: Partial<Omit<Gift, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      followers: {
        Row: Follower;
        Insert: Omit<Follower, 'id' | 'created_at'>;
        Update: Partial<Omit<Follower, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
