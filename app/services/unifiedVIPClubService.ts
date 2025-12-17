
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface VIPClub {
  id: string;
  creator_id: string;
  club_name: string;
  badge_name: string;
  badge_color: string;
  description: string | null;
  monthly_price_sek: number;
  is_active: boolean;
  total_members: number;
  created_at: string;
  updated_at: string;
}

export interface VIPClubMember {
  id: string;
  club_id: string;
  user_id: string;
  vip_level: number;
  total_gifted_sek: number;
  joined_at: string;
  renewed_at: string;
  status: 'active' | 'canceled' | 'expired';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface VIPChatMessage {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface VIPBadgeData {
  isMember: boolean;
  badgeName?: string;
  badgeColor?: string;
  vipLevel?: number;
}

class UnifiedVIPClubService {
  /**
   * Check if creator can create VIP club (requires 10 hours streaming)
   */
  async canCreateVIPClub(creatorId: string): Promise<{ canCreate: boolean; hoursStreamed: number; hoursNeeded: number }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_streaming_hours')
        .eq('id', creatorId)
        .single();

      if (error) {
        console.error('Error checking streaming hours:', error);
        return { canCreate: false, hoursStreamed: 0, hoursNeeded: 10 };
      }

      const hoursStreamed = parseFloat(data.total_streaming_hours || '0');
      const canCreate = hoursStreamed >= 10;

      return { canCreate, hoursStreamed, hoursNeeded: 10 };
    } catch (error) {
      console.error('Error in canCreateVIPClub:', error);
      return { canCreate: false, hoursStreamed: 0, hoursNeeded: 10 };
    }
  }

  /**
   * Create a VIP club (FREE for creators, but requires 10 hours streaming)
   */
  async createVIPClub(
    creatorId: string,
    clubName: string,
    badgeName: string,
    badgeColor: string,
    description?: string,
    monthlyPriceSEK: number = 30.00
  ): Promise<{ success: boolean; data?: VIPClub; error?: string }> {
    try {
      // Check if creator has streamed 10 hours
      const eligibility = await this.canCreateVIPClub(creatorId);
      if (!eligibility.canCreate) {
        return {
          success: false,
          error: `You need at least 10 hours of live streaming to unlock VIP Club. You have ${eligibility.hoursStreamed.toFixed(1)} hours.`,
        };
      }

      // Check if club already exists
      const existing = await this.getVIPClubByCreator(creatorId);
      if (existing) {
        return { success: false, error: 'You already have a VIP Club' };
      }

      const { data, error } = await supabase
        .from('vip_clubs')
        .insert({
          creator_id: creatorId,
          club_name: clubName,
          badge_name: badgeName,
          badge_color: badgeColor,
          description,
          monthly_price_sek: monthlyPriceSEK,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating VIP club:', error);
        return { success: false, error: error.message };
      }

      // Create VIP club conversation
      await supabase
        .from('vip_club_conversations')
        .insert({ club_id: data.id });

      console.log('✅ VIP Club created successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error in createVIPClub:', error);
      return { success: false, error: 'Failed to create VIP Club' };
    }
  }

  /**
   * Update VIP club settings
   */
  async updateVIPClub(
    creatorId: string,
    updates: {
      club_name?: string;
      badge_name?: string;
      badge_color?: string;
      description?: string;
      monthly_price_sek?: number;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vip_clubs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error updating VIP club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ VIP Club updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateVIPClub:', error);
      return { success: false, error: 'Failed to update VIP Club' };
    }
  }

  /**
   * Get VIP club by creator ID
   */
  async getVIPClubByCreator(creatorId: string): Promise<VIPClub | null> {
    try {
      const { data, error } = await supabase
        .from('vip_clubs')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching VIP club:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getVIPClubByCreator:', error);
      return null;
    }
  }

  /**
   * Get VIP club by ID
   */
  async getVIPClubById(clubId: string): Promise<VIPClub | null> {
    try {
      const { data, error } = await supabase
        .from('vip_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching VIP club:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getVIPClubById:', error);
      return null;
    }
  }

  /**
   * Get all VIP club members
   */
  async getVIPClubMembers(clubId: string): Promise<VIPClubMember[]> {
    try {
      const { data, error } = await supabase
        .from('vip_club_members')
        .select('*, profiles(*)')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('vip_level', { ascending: false })
        .order('total_gifted_sek', { ascending: false });

      if (error) {
        console.error('Error fetching VIP club members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVIPClubMembers:', error);
      return [];
    }
  }

  /**
   * Check if user is a VIP member
   */
  async isVIPMember(creatorId: string, userId: string): Promise<boolean> {
    try {
      const club = await this.getVIPClubByCreator(creatorId);
      if (!club) return false;

      const { data, error } = await supabase
        .from('vip_club_members')
        .select('id')
        .eq('club_id', club.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return !!data && !error;
    } catch (error) {
      console.error('Error in isVIPMember:', error);
      return false;
    }
  }

  /**
   * Get VIP badge data for a user
   */
  async getVIPBadgeData(creatorId: string, userId: string): Promise<VIPBadgeData> {
    try {
      const club = await this.getVIPClubByCreator(creatorId);
      if (!club) {
        return { isMember: false };
      }

      const { data, error } = await supabase
        .from('vip_club_members')
        .select('vip_level, total_gifted_sek')
        .eq('club_id', club.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return { isMember: false };
      }

      return {
        isMember: true,
        badgeName: club.badge_name,
        badgeColor: club.badge_color,
        vipLevel: data.vip_level,
      };
    } catch (error) {
      console.error('Error in getVIPBadgeData:', error);
      return { isMember: false };
    }
  }

  /**
   * Add member to VIP club
   */
  async addVIPMember(
    clubId: string,
    userId: string,
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const renewedAt = new Date();
      renewedAt.setMonth(renewedAt.getMonth() + 1);

      const { data, error } = await supabase
        .from('vip_club_members')
        .insert({
          club_id: clubId,
          user_id: userId,
          vip_level: 1,
          total_gifted_sek: 0,
          renewed_at: renewedAt.toISOString(),
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding VIP member:', error);
        return { success: false, error: error.message };
      }

      // Get club and creator info for notifications
      const club = await this.getVIPClubById(clubId);
      if (club) {
        await notificationService.createNotification({
          type: 'subscription_renewed',
          sender_id: club.creator_id,
          receiver_id: userId,
          message: `Welcome to ${club.club_name}! You are now a VIP member.`,
          category: 'social',
        });

        await notificationService.createNotification({
          type: 'subscription_renewed',
          sender_id: userId,
          receiver_id: club.creator_id,
          message: 'New VIP Club member joined!',
          category: 'social',
        });
      }

      console.log('✅ VIP member added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in addVIPMember:', error);
      return { success: false, error: 'Failed to add VIP member' };
    }
  }

  /**
   * Remove member from VIP club
   */
  async removeVIPMember(clubId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vip_club_members')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing VIP member:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ VIP member removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeVIPMember:', error);
      return { success: false, error: 'Failed to remove VIP member' };
    }
  }

  /**
   * Get VIP club chat messages
   */
  async getVIPClubChatMessages(clubId: string, limit: number = 50): Promise<VIPChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('vip_club_chat_messages')
        .select('*, profiles(*)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching VIP club chat messages:', error);
        return [];
      }

      return (data || []).reverse();
    } catch (error) {
      console.error('Error in getVIPClubChatMessages:', error);
      return [];
    }
  }

  /**
   * Send VIP club chat message
   */
  async sendVIPClubChatMessage(
    clubId: string,
    userId: string,
    message: string
  ): Promise<{ success: boolean; data?: VIPChatMessage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('vip_club_chat_messages')
        .insert({
          club_id: clubId,
          user_id: userId,
          message,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error sending VIP club chat message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ VIP club chat message sent');
      return { success: true, data };
    } catch (error) {
      console.error('Error in sendVIPClubChatMessage:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Get top 50 VIP clubs by member count
   */
  async getTop50VIPClubs(): Promise<{ id: string; club_name: string; badge_name: string; badge_color: string; total_members: number; creator_name: string; creator_username: string }[]> {
    try {
      const { data, error } = await supabase
        .from('vip_clubs')
        .select(`
          *,
          profiles:creator_id(username, display_name)
        `)
        .eq('is_active', true)
        .order('total_members', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching top 50 VIP clubs:', error);
        return [];
      }

      const clubs: { id: string; club_name: string; badge_name: string; badge_color: string; total_members: number; creator_name: string; creator_username: string }[] = (data || []).map((club: any) => ({
        id: club.id,
        club_name: club.club_name,
        badge_name: club.badge_name,
        badge_color: club.badge_color,
        total_members: club.total_members,
        creator_name: club.profiles?.display_name || club.profiles?.username || 'Unknown',
        creator_username: club.profiles?.username || 'unknown',
      }));
      return clubs;
    } catch (error) {
      console.error('Error in getTop50VIPClubs:', error);
      return [];
    }
  }

  /**
   * Get VIP member details
   */
  async getVIPMemberDetails(clubId: string, userId: string): Promise<VIPClubMember | null> {
    try {
      const { data, error } = await supabase
        .from('vip_club_members')
        .select('*, profiles(*)')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching VIP member details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getVIPMemberDetails:', error);
      return null;
    }
  }

  /**
   * Calculate SEK needed for next level
   */
  calculateSEKForNextLevel(currentLevel: number, currentTotal: number): number {
    if (currentLevel >= 20) return 0;

    const nextLevel = currentLevel + 1;
    const sekPerLevel = 25000 / 19;
    const sekNeeded = (nextLevel - 1) * sekPerLevel;

    return Math.max(0, Math.ceil(sekNeeded - currentTotal));
  }

  /**
   * Get VIP club statistics
   */
  async getVIPClubStats(clubId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    topGifters: { userId: string; displayName: string; totalGifted: number; level: number }[];
  }> {
    try {
      const club = await this.getVIPClubById(clubId);
      if (!club) {
        return { totalMembers: 0, activeMembers: 0, monthlyRevenue: 0, topGifters: [] };
      }

      const members = await this.getVIPClubMembers(clubId);
      const activeMembers = members.filter(m => m.status === 'active').length;
      const monthlyRevenue = (activeMembers * club.monthly_price_sek * 0.7);

      const topGifters: { userId: string; displayName: string; totalGifted: number; level: number }[] = members
        .sort((a, b) => b.total_gifted_sek - a.total_gifted_sek)
        .slice(0, 10)
        .map(m => ({
          userId: m.user_id,
          displayName: m.profiles?.display_name || m.profiles?.username || 'Unknown',
          totalGifted: m.total_gifted_sek,
          level: m.vip_level,
        }));

      return {
        totalMembers: members.length,
        activeMembers,
        monthlyRevenue,
        topGifters,
      };
    } catch (error) {
      console.error('Error in getVIPClubStats:', error);
      return { totalMembers: 0, activeMembers: 0, monthlyRevenue: 0, topGifters: [] };
    }
  }

  /**
   * Subscribe to VIP club chat
   */
  subscribeToVIPClubChat(
    clubId: string,
    onMessage: (message: VIPChatMessage) => void
  ): any {
    const channel = supabase
      .channel(`vip_club:${clubId}:chat`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('💬 VIP Club chat message received:', payload);
        onMessage(payload.payload as VIPChatMessage);
      })
      .subscribe((status) => {
        console.log('📡 VIP Club chat subscription status:', status);
      });

    return channel;
  }

  /**
   * Broadcast VIP club chat message
   */
  async broadcastVIPClubChatMessage(clubId: string, message: VIPChatMessage): Promise<void> {
    try {
      const channel = supabase.channel(`vip_club:${clubId}:chat`);
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });
    } catch (error) {
      console.error('Error broadcasting VIP club chat message:', error);
    }
  }

  /**
   * Get VIP club conversation ID for inbox integration
   */
  async getVIPClubConversationId(clubId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('vip_club_conversations')
        .select('id')
        .eq('club_id', clubId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching VIP club conversation:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in getVIPClubConversationId:', error);
      return null;
    }
  }

  /**
   * Get user's VIP memberships
   */
  async getUserVIPMemberships(userId: string): Promise<(VIPClubMember & { club: VIPClub })[]> {
    try {
      const { data, error } = await supabase
        .from('vip_club_members')
        .select(`
          *,
          profiles(*),
          vip_clubs(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user VIP memberships:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        club: item.vip_clubs,
      }));
    } catch (error) {
      console.error('Error in getUserVIPMemberships:', error);
      return [];
    }
  }

  /**
   * Send announcement to all VIP members
   */
  async sendVIPClubAnnouncement(
    clubId: string,
    creatorId: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; sentCount: number; error?: string }> {
    try {
      const members = await this.getVIPClubMembers(clubId);

      let sentCount = 0;
      for (const member of members) {
        await notificationService.createNotification({
          type: 'admin_announcement',
          sender_id: creatorId,
          receiver_id: member.user_id,
          message: `${title}: ${message}`,
          category: 'admin',
        });
        sentCount++;
      }

      console.log(`✅ VIP Club announcement sent to ${sentCount} members`);
      return { success: true, sentCount };
    } catch (error) {
      console.error('Error in sendVIPClubAnnouncement:', error);
      return { success: false, sentCount: 0, error: 'Failed to send announcement' };
    }
  }
}

export const unifiedVIPClubService = new UnifiedVIPClubService();
