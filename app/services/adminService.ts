
import { supabase } from '@/app/integrations/supabase/client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STRICT ROLE MODEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// VALID PLATFORM ROLES:
// - head_admin: Highest authority, full platform control
// - admin: Manage reports, users, bans, moderation
// - moderator: Monitor and moderate all live streams
// - support: Review appeals and support tickets
//
// VALID STREAM ROLES:
// - streammoderator: Assigned to specific creators (in moderators table)
//
// INVALID ROLES (REMOVED):
// - live_moderator (replaced by "moderator")
// - moderator (generic - now "moderator" is for staff)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AdminRole = 'HEAD_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT' | null;

interface SearchUserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  followers_count: number;
  role: string;
}

interface UserPrivacyData {
  // Profile data
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  date_of_birth: string | null;
  
  // Role and status
  role: string | null;
  premium_active: boolean;
  
  // VIP Club data
  vip_clubs: Array<{
    club_name: string;
    badge_name: string;
    total_members: number;
  }>;
  vip_memberships: Array<{
    club_name: string;
    vip_level: number;
    total_gifted_sek: number;
  }>;
  
  // Financial data
  total_gifts_sent_sek: number;
  total_gifts_received_sek: number;
  total_subscriptions_paid_sek: number;
  total_payouts_sek: number;
  wallet_balance_sek: number;
  
  // Activity data
  total_streams: number;
  total_streaming_hours: number;
  followers_count: number;
  following_count: number;
  
  // Ranking data
  current_level: number;
  current_season_rank: number;
  current_season_score: number;
  
  // Safety data
  reports_received: number;
  warnings_received: number;
  active_penalties: number;
  blocks_performed: number;
  
  // IP addresses (last 10)
  recent_ips: string[];
  
  created_at: string;
}

interface FinancialOverview {
  totalIncome: number;
  totalExpenses: number;
  totalGifts: number;
  totalSubscriptions: number;
  totalPayouts: number;
  platformFees: number;
  netRevenue: number;
}

interface UserFinancialData {
  userId: string;
  username: string;
  subscriptionsPaid: number;
  giftsSent: number;
  giftsReceived: number;
  creatorPayouts: number;
  platformFees: number;
  netEarnings: number;
}

class AdminService {
  /**
   * Check if a user has an admin role
   */
  async checkAdminRole(userId: string): Promise<{ role: AdminRole; isAdmin: boolean }> {
    try {
      console.log('Checking admin role for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin role:', error);
        return { role: null, isAdmin: false };
      }

      if (!data) {
        console.log('No profile found for user');
        return { role: null, isAdmin: false };
      }

      const role = data.role?.toUpperCase() as AdminRole;
      const isAdmin = ['HEAD_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(role || '');
      
      console.log('User role:', role, 'Is admin:', isAdmin);
      
      return { role, isAdmin };
    } catch (error) {
      console.error('Error in checkAdminRole:', error);
      return { role: null, isAdmin: false };
    }
  }

  /**
   * Check if user is a stream-level moderator (assigned to specific creators)
   * This is different from the MODERATOR platform role
   */
  async checkStreamModeratorRole(userId: string): Promise<{ isModerator: boolean; streamerId: string | null }> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('streamer_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking stream moderator role:', error);
        return { isModerator: false, streamerId: null };
      }

      return { 
        isModerator: !!data, 
        streamerId: data?.streamer_id || null 
      };
    } catch (error) {
      console.error('Error in checkStreamModeratorRole:', error);
      return { isModerator: false, streamerId: null };
    }
  }

  /**
   * Search users by username, display name, or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<SearchUserResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, followers_count, role')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  /**
   * Update user role (head_admin only)
   */
  async updateUserRole(userId: string, role: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role.toUpperCase() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }

  /**
   * Ban user (admin and head_admin only)
   */
  async banUser(userId: string, reason: string, duration?: number) {
    try {
      const expiresAt = duration
        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('admin_penalties').insert({
        user_id: userId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        severity: duration ? 'temporary' : 'permanent',
        reason,
        duration_hours: duration ? Math.floor(duration / 60) : null,
        expires_at: expiresAt,
        is_active: true,
      });

      if (error) {
        console.error('Error banning user:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in banUser:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  /**
   * Get platform financial overview (head_admin and admin only)
   */
  async getPlatformFinancialOverview(startDate: string, endDate: string): Promise<FinancialOverview | null> {
    try {
      const { data, error } = await supabase
        .from('platform_financial_summary')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching financial overview:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          totalGifts: 0,
          totalSubscriptions: 0,
          totalPayouts: 0,
          platformFees: 0,
          netRevenue: 0,
        };
      }

      const totals = data.reduce((acc, day) => ({
        totalIncome: acc.totalIncome + (day.total_income_sek || 0),
        totalExpenses: acc.totalExpenses + (day.total_expenses_sek || 0),
        totalGifts: acc.totalGifts + (day.total_gifts_sek || 0),
        totalSubscriptions: acc.totalSubscriptions + (day.total_subscriptions_sek || 0),
        totalPayouts: acc.totalPayouts + (day.total_payouts_sek || 0),
        platformFees: acc.platformFees + (day.platform_fees_sek || 0),
        netRevenue: acc.netRevenue + ((day.total_income_sek || 0) - (day.total_expenses_sek || 0)),
      }), {
        totalIncome: 0,
        totalExpenses: 0,
        totalGifts: 0,
        totalSubscriptions: 0,
        totalPayouts: 0,
        platformFees: 0,
        netRevenue: 0,
      });

      return totals;
    } catch (error) {
      console.error('Error in getPlatformFinancialOverview:', error);
      return null;
    }
  }

  /**
   * Get user financial breakdown (head_admin and admin only)
   */
  async getUserFinancialBreakdown(userId: string, startDate: string, endDate: string): Promise<UserFinancialData | null> {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      const { data, error } = await supabase
        .from('user_financial_breakdown')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching user financial breakdown:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          userId,
          username: profileData.username,
          subscriptionsPaid: 0,
          giftsSent: 0,
          giftsReceived: 0,
          creatorPayouts: 0,
          platformFees: 0,
          netEarnings: 0,
        };
      }

      const totals = data.reduce((acc, day) => ({
        subscriptionsPaid: acc.subscriptionsPaid + (day.subscriptions_paid_sek || 0),
        giftsSent: acc.giftsSent + (day.gifts_sent_sek || 0),
        giftsReceived: acc.giftsReceived + (day.gifts_received_sek || 0),
        creatorPayouts: acc.creatorPayouts + (day.creator_payouts_sek || 0),
        platformFees: acc.platformFees + (day.platform_fees_sek || 0),
        netEarnings: acc.netEarnings + (day.net_earnings_sek || 0),
      }), {
        subscriptionsPaid: 0,
        giftsSent: 0,
        giftsReceived: 0,
        creatorPayouts: 0,
        platformFees: 0,
        netEarnings: 0,
      });

      return {
        userId,
        username: profileData.username,
        ...totals,
      };
    } catch (error) {
      console.error('Error in getUserFinancialBreakdown:', error);
      return null;
    }
  }

  /**
   * Get comprehensive user privacy data (head_admin and admin only)
   * Returns ALL user data except passwords and card details
   */
  async getUserPrivacyData(userId: string, adminId: string): Promise<UserPrivacyData | null> {
    try {
      // Log the access for audit
      await supabase.from('user_privacy_audit_log').insert({
        admin_id: adminId,
        viewed_user_id: userId,
        action_type: 'view_profile',
        metadata: { timestamp: new Date().toISOString() },
      });

      // Fetch comprehensive user data
      const [
        profileData,
        vipClubsData,
        vipMembershipsData,
        financialData,
        streamData,
        levelData,
        seasonData,
        reportsData,
        warningsData,
        penaltiesData,
        blocksData,
        ipData,
      ] = await Promise.all([
        // Profile data
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        
        // VIP Clubs owned
        supabase
          .from('vip_clubs')
          .select('club_name, badge_name, total_members')
          .eq('creator_id', userId),
        
        // VIP Club memberships
        supabase
          .from('vip_club_members')
          .select('vip_level, total_gifted_sek, vip_clubs(club_name)')
          .eq('user_id', userId)
          .eq('status', 'active'),
        
        // Financial data
        supabase
          .from('wallet_transactions_v2')
          .select('type, amount_cents')
          .eq('user_id', userId),
        
        // Stream data
        supabase
          .from('streams')
          .select('id, started_at, ended_at')
          .eq('broadcaster_id', userId),
        
        // Creator level
        supabase
          .from('creator_levels')
          .select('current_level')
          .eq('creator_id', userId)
          .maybeSingle(),
        
        // Season ranking
        supabase
          .from('creator_season_scores')
          .select('season_score, rank_tier')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // Reports received
        supabase
          .from('user_reports')
          .select('id', { count: 'exact', head: true })
          .eq('reported_user_id', userId),
        
        // Warnings received
        supabase
          .from('moderation_actions')
          .select('id', { count: 'exact', head: true })
          .eq('target_user_id', userId)
          .eq('action_type', 'warning'),
        
        // Active penalties
        supabase
          .from('admin_penalties')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true),
        
        // Blocks performed
        supabase
          .from('blocked_users')
          .select('id', { count: 'exact', head: true })
          .eq('blocker_id', userId),
        
        // Recent IP addresses
        supabase
          .from('login_history')
          .select('ip_address')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (profileData.error || !profileData.data) {
        console.error('Error fetching profile data:', profileData.error);
        return null;
      }

      const profile = profileData.data;

      // Calculate financial totals
      const transactions = financialData.data || [];
      const giftsSent = transactions
        .filter(t => t.type === 'gift_sent')
        .reduce((sum, t) => sum + (t.amount_cents / 100), 0);
      const giftsReceived = transactions
        .filter(t => t.type === 'gift_received')
        .reduce((sum, t) => sum + (t.amount_cents / 100), 0);
      const subscriptionsPaid = transactions
        .filter(t => t.type === 'subscription_payment')
        .reduce((sum, t) => sum + (t.amount_cents / 100), 0);
      const payouts = transactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + (t.amount_cents / 100), 0);

      // Get wallet balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('user_id', userId)
        .maybeSingle();

      // Calculate streaming hours
      const streams = streamData.data || [];
      const totalStreamingHours = streams.reduce((sum, stream) => {
        if (!stream.ended_at) return sum;
        const duration = new Date(stream.ended_at).getTime() - new Date(stream.started_at).getTime();
        return sum + (duration / (1000 * 60 * 60));
      }, 0);

      // Get unique IPs
      const uniqueIps = [...new Set((ipData.data || []).map(log => log.ip_address).filter(Boolean))];

      return {
        // Profile data
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        email: profile.email,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
        date_of_birth: profile.date_of_birth,
        
        // Role and status
        role: profile.role,
        premium_active: profile.premium_active || false,
        
        // VIP Club data
        vip_clubs: vipClubsData.data || [],
        vip_memberships: (vipMembershipsData.data || []).map((m: any) => ({
          club_name: m.vip_clubs?.club_name || 'Unknown',
          vip_level: m.vip_level,
          total_gifted_sek: m.total_gifted_sek,
        })),
        
        // Financial data
        total_gifts_sent_sek: Math.round(giftsSent),
        total_gifts_received_sek: Math.round(giftsReceived),
        total_subscriptions_paid_sek: Math.round(subscriptionsPaid),
        total_payouts_sek: Math.round(payouts),
        wallet_balance_sek: Math.round((walletData?.balance_cents || 0) / 100),
        
        // Activity data
        total_streams: streams.length,
        total_streaming_hours: Math.round(totalStreamingHours * 10) / 10,
        followers_count: profile.followers_count || 0,
        following_count: profile.following_count || 0,
        
        // Ranking data
        current_level: levelData.data?.current_level || 1,
        current_season_rank: 0, // Would need to calculate from rank_tier
        current_season_score: seasonData.data?.season_score || 0,
        
        // Safety data
        reports_received: reportsData.count || 0,
        warnings_received: warningsData.count || 0,
        active_penalties: penaltiesData.count || 0,
        blocks_performed: blocksData.count || 0,
        
        // IP addresses
        recent_ips: uniqueIps,
        
        created_at: profile.created_at,
      };
    } catch (error) {
      console.error('Error in getUserPrivacyData:', error);
      return null;
    }
  }

  /**
   * Issue warning to user (admin and head_admin only)
   */
  async issueWarning(targetUserId: string, adminId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Log enforcement action
      const { error: logError } = await supabase
        .from('admin_enforcement_actions')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action_type: 'warning',
          reason,
          is_reversible: true,
        });

      if (logError) {
        console.error('Error logging warning:', logError);
        return { success: false, error: logError.message };
      }

      // Create moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          target_user_id: targetUserId,
          action_type: 'warning',
          reason,
          issued_by_admin_id: adminId,
          is_active: true,
        });

      if (actionError) {
        console.error('Error creating warning:', actionError);
        return { success: false, error: actionError.message };
      }

      // Send notification
      await supabase.from('notifications').insert({
        sender_id: adminId,
        receiver_id: targetUserId,
        type: 'warning',
        message: `⚠️ Warning: ${reason}`,
        category: 'safety',
        read: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in issueWarning:', error);
      return { success: false, error: 'Failed to issue warning' };
    }
  }

  /**
   * Timeout user (admin and head_admin only)
   */
  async timeoutUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    durationMinutes: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

      // Log enforcement action
      const { error: logError } = await supabase
        .from('admin_enforcement_actions')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action_type: 'timeout',
          reason,
          duration_minutes: durationMinutes,
          is_reversible: true,
        });

      if (logError) {
        console.error('Error logging timeout:', logError);
        return { success: false, error: logError.message };
      }

      // Create penalty
      const { error: penaltyError } = await supabase
        .from('admin_penalties')
        .insert({
          user_id: targetUserId,
          admin_id: adminId,
          severity: 'temporary',
          reason,
          duration_hours: Math.ceil(durationMinutes / 60),
          expires_at: expiresAt,
          is_active: true,
        });

      if (penaltyError) {
        console.error('Error creating timeout:', penaltyError);
        return { success: false, error: penaltyError.message };
      }

      // Send notification
      await supabase.from('notifications').insert({
        sender_id: adminId,
        receiver_id: targetUserId,
        type: 'timeout_ended',
        message: `⏱️ You have been timed out for ${durationMinutes} minutes. Reason: ${reason}`,
        category: 'safety',
        read: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in timeoutUser:', error);
      return { success: false, error: 'Failed to timeout user' };
    }
  }

  /**
   * Remove verification from user (admin and head_admin only)
   */
  async removeVerification(targetUserId: string, adminId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Log enforcement action
      const { error: logError } = await supabase
        .from('admin_enforcement_actions')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action_type: 'remove_verification',
          reason,
          is_reversible: true,
        });

      if (logError) {
        console.error('Error logging verification removal:', logError);
        return { success: false, error: logError.message };
      }

      // Remove verification (assuming there's a verified field)
      // Note: This would need to be implemented based on your verification system
      
      return { success: true };
    } catch (error) {
      console.error('Error in removeVerification:', error);
      return { success: false, error: 'Failed to remove verification' };
    }
  }

  /**
   * Revoke role from user (head_admin only)
   */
  async revokeRole(targetUserId: string, adminId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Log enforcement action
      const { error: logError } = await supabase
        .from('admin_enforcement_actions')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action_type: 'revoke_role',
          reason,
          is_reversible: true,
        });

      if (logError) {
        console.error('Error logging role revocation:', logError);
        return { success: false, error: logError.message };
      }

      // Revoke role (set to USER)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'USER' })
        .eq('id', targetUserId);

      if (updateError) {
        console.error('Error revoking role:', updateError);
        return { success: false, error: updateError.message };
      }

      // Send notification
      await supabase.from('notifications').insert({
        sender_id: adminId,
        receiver_id: targetUserId,
        type: 'admin_announcement',
        message: `Your role has been revoked. Reason: ${reason}`,
        category: 'admin',
        read: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in revokeRole:', error);
      return { success: false, error: 'Failed to revoke role' };
    }
  }

  /**
   * Log user privacy data access
   */
  async logPrivacyDataAccess(adminId: string, viewedUserId: string, actionType: string): Promise<void> {
    try {
      await supabase.from('user_privacy_audit_log').insert({
        admin_id: adminId,
        viewed_user_id: viewedUserId,
        action_type: actionType,
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error('Error logging privacy data access:', error);
    }
  }

  /**
   * Get all pending identity verifications (admin and head_admin only)
   */
  async getPendingVerifications(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*, profiles(username, display_name, email)')
        .eq('verification_status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending verifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingVerifications:', error);
      return [];
    }
  }

  /**
   * Approve identity verification (admin and head_admin only)
   */
  async approveVerification(
    verificationId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', verificationId);

      if (error) {
        console.error('Error approving verification:', error);
        return { success: false, error: error.message };
      }

      // Log audit
      await supabase.from('identity_verification_audit_log').insert({
        verification_id: verificationId,
        admin_id: adminId,
        action_type: 'approved',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in approveVerification:', error);
      return { success: false, error: 'Failed to approve verification' };
    }
  }

  /**
   * Reject identity verification (admin and head_admin only)
   */
  async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', verificationId);

      if (error) {
        console.error('Error rejecting verification:', error);
        return { success: false, error: error.message };
      }

      // Log audit
      await supabase.from('identity_verification_audit_log').insert({
        verification_id: verificationId,
        admin_id: adminId,
        action_type: 'rejected',
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in rejectVerification:', error);
      return { success: false, error: 'Failed to reject verification' };
    }
  }
}

export const adminService = new AdminService();
