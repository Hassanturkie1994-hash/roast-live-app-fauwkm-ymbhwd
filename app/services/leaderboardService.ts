
import { supabase } from '@/app/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  total_value: number;
  is_vip: boolean;
  is_moderator: boolean;
  vip_badge?: string;
}

class LeaderboardService {
  /**
   * Get per-stream leaderboard (top supporters during a specific stream)
   */
  async getStreamLeaderboard(
    streamId: string,
    creatorId: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      // Get gift transactions for this stream
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select(`
          sender_id,
          amount,
          sender:profiles!gift_transactions_sender_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .eq('receiver_id', creatorId);

      if (giftError) {
        console.error('Error fetching gift transactions:', giftError);
        return [];
      }

      // Aggregate by sender
      const aggregated = new Map<string, { total: number; user: any }>();

      giftData?.forEach((gift: any) => {
        if (!gift.sender_id) {
          console.log('Gift without sender_id:', gift);
          return;
        }
        const existing = aggregated.get(gift.sender_id);
        if (existing) {
          existing.total += gift.amount;
        } else {
          aggregated.set(gift.sender_id, {
            total: gift.amount,
            user: gift.sender,
          });
        }
      });

      // Convert to array and sort
      const leaderboard = Array.from(aggregated.entries())
        .map(([userId, data]) => ({
          user_id: userId,
          username: data.user?.username || 'Unknown',
          display_name: data.user?.display_name || 'Unknown',
          avatar_url: data.user?.avatar_url || '',
          total_value: data.total,
          is_vip: false,
          is_moderator: false,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, limit);

      // Check VIP and moderator status
      const userIds = leaderboard.map((entry) => entry.user_id);

      // Check VIP memberships
      const { data: vipData } = await supabase
        .from('creator_club_memberships')
        .select(`
          member_id,
          club:creator_clubs!creator_club_memberships_club_id_fkey(
            creator_id,
            tag
          )
        `)
        .in('member_id', userIds)
        .eq('is_active', true);

      const vipMap = new Map<string, string>();
      vipData?.forEach((vip: any) => {
        if (vip.club?.creator_id === creatorId) {
          vipMap.set(vip.member_id, vip.club.tag);
        }
      });

      // Check moderator status
      const { data: modData } = await supabase
        .from('moderators')
        .select('user_id')
        .in('user_id', userIds)
        .eq('streamer_id', creatorId);

      const modSet = new Set(modData?.map((mod) => mod.user_id) || []);

      // Update leaderboard with badges
      leaderboard.forEach((entry) => {
        entry.is_vip = vipMap.has(entry.user_id);
        entry.vip_badge = vipMap.get(entry.user_id);
        entry.is_moderator = modSet.has(entry.user_id);
      });

      return leaderboard;
    } catch (error) {
      console.error('Error in getStreamLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get global leaderboard for a creator (all time)
   */
  async getGlobalLeaderboard(
    creatorId: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      // Get all gift transactions for this creator
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select(`
          sender_id,
          amount,
          sender:profiles!gift_transactions_sender_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('receiver_id', creatorId);

      if (giftError) {
        console.error('Error fetching gift transactions:', giftError);
        return [];
      }

      // Get subscription payments for this creator
      const { data: subData, error: subError } = await supabase
        .from('wallet_transactions_v2')
        .select(`
          related_user_id,
          amount_cents,
          user:profiles!wallet_transactions_v2_related_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', creatorId)
        .eq('type', 'subscription_payment')
        .gt('amount_cents', 0);

      if (subError) {
        console.error('Error fetching subscription payments:', subError);
      }

      // Aggregate by user
      const aggregated = new Map<string, { total: number; user: any }>();

      // Add gifts
      giftData?.forEach((gift: any) => {
        if (!gift.sender_id) {
          console.log('Gift without sender_id:', gift);
          return;
        }
        const existing = aggregated.get(gift.sender_id);
        if (existing) {
          existing.total += gift.amount;
        } else {
          aggregated.set(gift.sender_id, {
            total: gift.amount,
            user: gift.sender,
          });
        }
      });

      // Add subscriptions
      subData?.forEach((sub: any) => {
        if (!sub.related_user_id) {
          console.log('Subscription without related_user_id:', sub);
          return;
        }
        const existing = aggregated.get(sub.related_user_id);
        if (existing) {
          existing.total += sub.amount_cents / 100; // Convert cents to SEK
        } else {
          aggregated.set(sub.related_user_id, {
            total: sub.amount_cents / 100,
            user: sub.user,
          });
        }
      });

      // Convert to array and sort
      const leaderboard = Array.from(aggregated.entries())
        .map(([userId, data]) => ({
          user_id: userId,
          username: data.user?.username || 'Unknown',
          display_name: data.user?.display_name || 'Unknown',
          avatar_url: data.user?.avatar_url || '',
          total_value: data.total,
          is_vip: false,
          is_moderator: false,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, limit);

      // Check VIP and moderator status
      const userIds = leaderboard.map((entry) => entry.user_id);

      // Check VIP memberships
      const { data: vipData } = await supabase
        .from('creator_club_memberships')
        .select(`
          member_id,
          club:creator_clubs!creator_club_memberships_club_id_fkey(
            creator_id,
            tag
          )
        `)
        .in('member_id', userIds)
        .eq('is_active', true);

      const vipMap = new Map<string, string>();
      vipData?.forEach((vip: any) => {
        if (vip.club?.creator_id === creatorId) {
          vipMap.set(vip.member_id, vip.club.tag);
        }
      });

      // Check moderator status
      const { data: modData } = await supabase
        .from('moderators')
        .select('user_id')
        .in('user_id', userIds)
        .eq('streamer_id', creatorId);

      const modSet = new Set(modData?.map((mod) => mod.user_id) || []);

      // Update leaderboard with badges
      leaderboard.forEach((entry) => {
        entry.is_vip = vipMap.has(entry.user_id);
        entry.vip_badge = vipMap.get(entry.user_id);
        entry.is_moderator = modSet.has(entry.user_id);
      });

      return leaderboard;
    } catch (error) {
      console.error('Error in getGlobalLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get weekly leaderboard for a creator
   */
  async getWeeklyLeaderboard(
    creatorId: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get gift transactions from the last week
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select(`
          sender_id,
          amount,
          sender:profiles!gift_transactions_sender_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('receiver_id', creatorId)
        .gte('created_at', oneWeekAgo.toISOString());

      if (giftError) {
        console.error('Error fetching gift transactions:', giftError);
        return [];
      }

      // Get subscription payments from the last week
      const { data: subData, error: subError } = await supabase
        .from('wallet_transactions_v2')
        .select(`
          related_user_id,
          amount_cents,
          user:profiles!wallet_transactions_v2_related_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', creatorId)
        .eq('type', 'subscription_payment')
        .gt('amount_cents', 0)
        .gte('created_at', oneWeekAgo.toISOString());

      if (subError) {
        console.error('Error fetching subscription payments:', subError);
      }

      // Aggregate by user
      const aggregated = new Map<string, { total: number; user: any }>();

      // Add gifts
      giftData?.forEach((gift: any) => {
        if (!gift.sender_id) {
          console.log('Gift without sender_id:', gift);
          return;
        }
        const existing = aggregated.get(gift.sender_id);
        if (existing) {
          existing.total += gift.amount;
        } else {
          aggregated.set(gift.sender_id, {
            total: gift.amount,
            user: gift.sender,
          });
        }
      });

      // Add subscriptions
      subData?.forEach((sub: any) => {
        if (!sub.related_user_id) {
          console.log('Subscription without related_user_id:', sub);
          return;
        }
        const existing = aggregated.get(sub.related_user_id);
        if (existing) {
          existing.total += sub.amount_cents / 100;
        } else {
          aggregated.set(sub.related_user_id, {
            total: sub.amount_cents / 100,
            user: sub.user,
          });
        }
      });

      // Convert to array and sort
      const leaderboard = Array.from(aggregated.entries())
        .map(([userId, data]) => ({
          user_id: userId,
          username: data.user?.username || 'Unknown',
          display_name: data.user?.display_name || 'Unknown',
          avatar_url: data.user?.avatar_url || '',
          total_value: data.total,
          is_vip: false,
          is_moderator: false,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, limit);

      // Check VIP and moderator status
      const userIds = leaderboard.map((entry) => entry.user_id);

      // Check VIP memberships
      const { data: vipData } = await supabase
        .from('creator_club_memberships')
        .select(`
          member_id,
          club:creator_clubs!creator_club_memberships_club_id_fkey(
            creator_id,
            tag
          )
        `)
        .in('member_id', userIds)
        .eq('is_active', true);

      const vipMap = new Map<string, string>();
      vipData?.forEach((vip: any) => {
        if (vip.club?.creator_id === creatorId) {
          vipMap.set(vip.member_id, vip.club.tag);
        }
      });

      // Check moderator status
      const { data: modData } = await supabase
        .from('moderators')
        .select('user_id')
        .in('user_id', userIds)
        .eq('streamer_id', creatorId);

      const modSet = new Set(modData?.map((mod) => mod.user_id) || []);

      // Update leaderboard with badges
      leaderboard.forEach((entry) => {
        entry.is_vip = vipMap.has(entry.user_id);
        entry.vip_badge = vipMap.get(entry.user_id);
        entry.is_moderator = modSet.has(entry.user_id);
      });

      return leaderboard;
    } catch (error) {
      console.error('Error in getWeeklyLeaderboard:', error);
      return [];
    }
  }
}

export const leaderboardService = new LeaderboardService();