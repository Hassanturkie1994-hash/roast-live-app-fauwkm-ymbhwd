
import { supabase } from '@/app/integrations/supabase/client';
import { deviceBanService } from './deviceBanService';

export type AdminRole = 'HEAD_ADMIN' | 'ADMIN' | 'SUPPORT' | 'MODERATOR';
export type ActionType = 'BAN' | 'SUSPEND' | 'WARN' | 'TIMEOUT' | 'DELETE_CONTENT' | 'RESET_BALANCE' | 'FORCE_STOP_STREAM' | 'EDIT_PROFILE' | 'MANAGE_BADGE' | 'DEVICE_BAN';
export type ReportType = 'profile' | 'comment' | 'message' | 'post' | 'stream';
export type ReportStatus = 'open' | 'closed' | 'in_review';
export type MessageType = 'warning' | 'notice' | 'verification';

interface AdminRoleData {
  id: string;
  user_id: string;
  role: AdminRole;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
}

interface AdminActionLog {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: ActionType;
  reason: string | null;
  expires_at: string | null;
  metadata: any;
  created_at: string;
}

interface UserReport {
  id: string;
  reported_user_id: string | null;
  reporter_user_id: string | null;
  type: ReportType;
  description: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface PublicBadge {
  id: string;
  user_id: string;
  badge_text: string;
  badge_color: string;
  approved_by: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminMessage {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  message_type: MessageType;
  subject: string;
  message: string;
  duration_days: number | null;
  read: boolean;
  created_at: string;
}

class AdminService {
  // Check if user has admin role - checks both admin_roles and profiles tables
  async checkAdminRole(userId: string): Promise<{ success: boolean; role: AdminRole | null }> {
    try {
      // First check admin_roles table
      const { data: adminRoleData, error: adminRoleError } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminRoleData && !adminRoleError) {
        return { success: true, role: adminRoleData.role as AdminRole };
      }

      // If not found in admin_roles, check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.log('Error checking profile role:', profileError);
        return { success: true, role: null };
      }

      if (profileData && profileData.role) {
        const role = profileData.role.toUpperCase();
        if (['HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'MODERATOR'].includes(role)) {
          return { success: true, role: role as AdminRole };
        }
      }

      console.log('User is not an admin');
      return { success: true, role: null };
    } catch (error) {
      console.error('Error checking admin role:', error);
      return { success: false, role: null };
    }
  }

  // Assign admin role
  async assignAdminRole(
    userId: string,
    role: AdminRole,
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('admin_roles').insert({
        user_id: userId,
        role,
        assigned_by: assignedBy,
      });

      if (error) throw error;

      // Log the action
      await this.logAction(assignedBy, userId, 'MANAGE_BADGE', `Assigned ${role} role`, null, {
        role,
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning admin role:', error);
      return { success: false, error: 'Failed to assign admin role' };
    }
  }

  // Remove admin role
  async removeAdminRole(
    userId: string,
    removedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await this.logAction(removedBy, userId, 'MANAGE_BADGE', 'Removed admin role', null, {});

      return { success: true };
    } catch (error) {
      console.error('Error removing admin role:', error);
      return { success: false, error: 'Failed to remove admin role' };
    }
  }

  // Log admin action
  async logAction(
    adminUserId: string,
    targetUserId: string | null,
    actionType: ActionType,
    reason: string | null,
    expiresAt: string | null,
    metadata: any = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('admin_actions_log').insert({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        action_type: actionType,
        reason,
        expires_at: expiresAt,
        metadata,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error logging admin action:', error);
      return { success: false, error: 'Failed to log action' };
    }
  }

  // Get admin action logs
  async getActionLogs(
    filters?: {
      adminUserId?: string;
      targetUserId?: string;
      actionType?: ActionType;
      limit?: number;
    }
  ): Promise<{ success: boolean; logs?: AdminActionLog[]; error?: string }> {
    try {
      let query = supabase
        .from('admin_actions_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      if (filters?.targetUserId) {
        query = query.eq('target_user_id', filters.targetUserId);
      }

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, logs: data as AdminActionLog[] };
    } catch (error) {
      console.error('Error fetching action logs:', error);
      return { success: false, error: 'Failed to fetch action logs' };
    }
  }

  // Create user report
  async createReport(
    reporterUserId: string,
    reportedUserId: string,
    type: ReportType,
    description: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .insert({
          reporter_user_id: reporterUserId,
          reported_user_id: reportedUserId,
          type,
          description,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, reportId: data.id };
    } catch (error) {
      console.error('Error creating report:', error);
      return { success: false, error: 'Failed to create report' };
    }
  }

  // Get user reports
  async getReports(
    filters?: {
      status?: ReportStatus;
      type?: ReportType;
      assignedTo?: string;
      limit?: number;
    }
  ): Promise<{ success: boolean; reports?: UserReport[]; error?: string }> {
    try {
      let query = supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, reports: data as UserReport[] };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return { success: false, error: 'Failed to fetch reports' };
    }
  }

  // Update report status
  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    resolutionNotes?: string,
    assignedTo?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
      };

      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes;
      }

      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      const { error } = await supabase
        .from('user_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { success: false, error: 'Failed to update report status' };
    }
  }

  // Ban user platform-wide
  async banUser(
    adminUserId: string,
    targetUserId: string,
    reason: string,
    expiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Log the ban action
      await this.logAction(adminUserId, targetUserId, 'BAN', reason, expiresAt || null, {
        platform_wide: true,
      });

      // TODO: Implement actual ban logic (e.g., update user status, prevent login)
      // This would typically involve updating a user status field or creating a bans table

      return { success: true };
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  // Ban device (new function)
  async banDevice(
    adminUserId: string,
    targetUserId: string,
    reason: string,
    expiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Ban all devices for this user
      const result = await deviceBanService.banDeviceByUserId(
        targetUserId,
        adminUserId,
        reason,
        expiresAt
      );

      if (!result.success) {
        return result;
      }

      // Log the action
      await this.logAction(adminUserId, targetUserId, 'DEVICE_BAN', reason, expiresAt || null, {
        device_ban: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error banning device:', error);
      return { success: false, error: 'Failed to ban device' };
    }
  }

  // Get user devices (admin function)
  async getUserDevices(userId: string): Promise<{
    success: boolean;
    devices?: any[];
    error?: string;
  }> {
    return await deviceBanService.getUserDevices(userId);
  }

  // Suspend user
  async suspendUser(
    adminUserId: string,
    targetUserId: string,
    reason: string,
    durationDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await this.logAction(
        adminUserId,
        targetUserId,
        'SUSPEND',
        reason,
        expiresAt.toISOString(),
        { duration_days: durationDays }
      );

      return { success: true };
    } catch (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: 'Failed to suspend user' };
    }
  }

  // Warn user
  async warnUser(
    adminUserId: string,
    targetUserId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.logAction(adminUserId, targetUserId, 'WARN', reason, null, {});

      return { success: true };
    } catch (error) {
      console.error('Error warning user:', error);
      return { success: false, error: 'Failed to warn user' };
    }
  }

  // Force stop stream
  async forceStopStream(
    adminUserId: string,
    streamId: string,
    broadcasterId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update stream status to ended
      const { error: streamError } = await supabase
        .from('streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', streamId);

      if (streamError) throw streamError;

      // Log the action
      await this.logAction(adminUserId, broadcasterId, 'FORCE_STOP_STREAM', reason, null, {
        stream_id: streamId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error force stopping stream:', error);
      return { success: false, error: 'Failed to force stop stream' };
    }
  }

  // Reset user balance
  async resetUserBalance(
    adminUserId: string,
    targetUserId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wallet')
        .update({ balance: 0 })
        .eq('user_id', targetUserId);

      if (error) throw error;

      await this.logAction(adminUserId, targetUserId, 'RESET_BALANCE', reason, null, {});

      return { success: true };
    } catch (error) {
      console.error('Error resetting user balance:', error);
      return { success: false, error: 'Failed to reset user balance' };
    }
  }

  // Send admin message to user
  async sendAdminMessage(
    adminUserId: string,
    targetUserId: string,
    messageType: MessageType,
    subject: string,
    message: string,
    durationDays?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('admin_messages').insert({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        message_type: messageType,
        subject,
        message,
        duration_days: durationDays || null,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending admin message:', error);
      return { success: false, error: 'Failed to send admin message' };
    }
  }

  // Get admin messages for user
  async getAdminMessages(
    userId: string
  ): Promise<{ success: boolean; messages?: AdminMessage[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, messages: data as AdminMessage[] };
    } catch (error) {
      console.error('Error fetching admin messages:', error);
      return { success: false, error: 'Failed to fetch admin messages' };
    }
  }

  // Mark admin message as read
  async markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: 'Failed to mark message as read' };
    }
  }

  // Get currently live streams
  async getLiveStreams(): Promise<{
    success: boolean;
    streams?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (error) throw error;

      return { success: true, streams: data };
    } catch (error) {
      console.error('Error fetching live streams:', error);
      return { success: false, error: 'Failed to fetch live streams' };
    }
  }

  // Get users under penalty
  async getUsersUnderPenalty(): Promise<{
    success: boolean;
    users?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select('*, profiles!admin_actions_log_target_user_id_fkey(*)')
        .in('action_type', ['BAN', 'SUSPEND', 'TIMEOUT', 'DEVICE_BAN'])
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, users: data };
    } catch (error) {
      console.error('Error fetching users under penalty:', error);
      return { success: false, error: 'Failed to fetch users under penalty' };
    }
  }

  // Get VIP subscribers overview
  async getVIPOverview(): Promise<{
    success: boolean;
    data?: { total: number; active: number; revenue: number };
    error?: string;
  }> {
    try {
      const { data: vipData, error: vipError } = await supabase
        .from('vip_memberships')
        .select('*');

      if (vipError) throw vipError;

      const total = vipData?.length || 0;
      const active = vipData?.filter((v) => v.is_active).length || 0;

      // Calculate revenue (assuming VIP costs 99 SEK/month)
      const revenue = active * 99;

      return { success: true, data: { total, active, revenue } };
    } catch (error) {
      console.error('Error fetching VIP overview:', error);
      return { success: false, error: 'Failed to fetch VIP overview' };
    }
  }

  // Get daily transaction volume
  async getDailyTransactionVolume(): Promise<{
    success: boolean;
    volume?: number;
    error?: string;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('gift_transactions')
        .select('amount')
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const volume = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      return { success: true, volume };
    } catch (error) {
      console.error('Error fetching daily transaction volume:', error);
      return { success: false, error: 'Failed to fetch daily transaction volume' };
    }
  }

  // Manage public badge
  async createPublicBadge(
    userId: string,
    badgeText: string,
    badgeColor: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('public_badges').insert({
        user_id: userId,
        badge_text: badgeText,
        badge_color: badgeColor,
        approved_by: approvedBy,
        is_active: true,
      });

      if (error) throw error;

      await this.logAction(approvedBy, userId, 'MANAGE_BADGE', `Created badge: ${badgeText}`, null, {
        badge_text: badgeText,
        badge_color: badgeColor,
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating public badge:', error);
      return { success: false, error: 'Failed to create public badge' };
    }
  }

  // Deactivate public badge
  async deactivatePublicBadge(
    badgeId: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('public_badges')
        .update({ is_active: false })
        .eq('id', badgeId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deactivating public badge:', error);
      return { success: false, error: 'Failed to deactivate public badge' };
    }
  }
}

export const adminService = new AdminService();