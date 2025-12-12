
import { supabase } from '@/app/integrations/supabase/client';

export interface FanClub {
  id: string;
  streamer_id: string;
  club_name: string;
  badge_color: string;
  created_at: string;
  updated_at: string;
}

export interface FanClubMember {
  id: string;
  fan_club_id: string;
  user_id: string;
  subscription_start: string;
  subscription_end: string;
  is_active: boolean;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class FanClubService {
  // Check if user has streamed 10+ hours
  async canCreateFanClub(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_streaming_hours')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking streaming hours:', error);
        return false;
      }

      const hours = parseFloat(data.total_streaming_hours || '0');
      return hours >= 10;
    } catch (error) {
      console.error('Error in canCreateFanClub:', error);
      return false;
    }
  }

  // Get streamer's total streaming hours
  async getStreamingHours(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_streaming_hours')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching streaming hours:', error);
        return 0;
      }

      return parseFloat(data.total_streaming_hours || '0');
    } catch (error) {
      console.error('Error in getStreamingHours:', error);
      return 0;
    }
  }

  // Create a fan club
  async createFanClub(
    streamerId: string,
    clubName: string,
    badgeColor: string
  ): Promise<{ success: boolean; error?: string; data?: FanClub }> {
    try {
      // Validate club name length
      if (clubName.length > 5) {
        return { success: false, error: 'Club name must be 5 characters or less' };
      }

      // Check if user can create fan club
      const canCreate = await this.canCreateFanClub(streamerId);
      if (!canCreate) {
        return { success: false, error: 'You need 10+ hours of streaming to create a fan club' };
      }

      // Check if fan club already exists
      const existing = await this.getFanClub(streamerId);
      if (existing) {
        return { success: false, error: 'You already have a fan club' };
      }

      const { data, error } = await supabase
        .from('fan_clubs')
        .insert({
          streamer_id: streamerId,
          club_name: clubName,
          badge_color: badgeColor,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fan club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Fan club created successfully');
      return { success: true, data: data as FanClub };
    } catch (error) {
      console.error('Error in createFanClub:', error);
      return { success: false, error: 'Failed to create fan club' };
    }
  }

  // Update fan club
  async updateFanClub(
    streamerId: string,
    clubName?: string,
    badgeColor?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };

      if (clubName !== undefined) {
        if (clubName.length > 5) {
          return { success: false, error: 'Club name must be 5 characters or less' };
        }
        updates.club_name = clubName;
      }

      if (badgeColor !== undefined) {
        updates.badge_color = badgeColor;
      }

      const { error } = await supabase
        .from('fan_clubs')
        .update(updates)
        .eq('streamer_id', streamerId);

      if (error) {
        console.error('Error updating fan club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Fan club updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateFanClub:', error);
      return { success: false, error: 'Failed to update fan club' };
    }
  }

  // Get fan club by streamer ID
  async getFanClub(streamerId: string): Promise<FanClub | null> {
    try {
      const { data, error } = await supabase
        .from('fan_clubs')
        .select('*')
        .eq('streamer_id', streamerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching fan club:', error);
        return null;
      }

      return data as FanClub;
    } catch (error) {
      console.error('Error in getFanClub:', error);
      return null;
    }
  }

  // Join fan club (subscribe)
  async joinFanClub(
    fanClubId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already a member
      const isMember = await this.isFanClubMember(fanClubId, userId);
      if (isMember) {
        return { success: false, error: 'You are already a member of this fan club' };
      }

      // Calculate subscription end date (1 month from now)
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      const { error } = await supabase
        .from('fan_club_members')
        .insert({
          fan_club_id: fanClubId,
          user_id: userId,
          subscription_end: subscriptionEnd.toISOString(),
          is_active: true,
        });

      if (error) {
        console.error('Error joining fan club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Joined fan club successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in joinFanClub:', error);
      return { success: false, error: 'Failed to join fan club' };
    }
  }

  // Leave fan club (unsubscribe)
  async leaveFanClub(
    fanClubId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('fan_club_members')
        .delete()
        .eq('fan_club_id', fanClubId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving fan club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Left fan club successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in leaveFanClub:', error);
      return { success: false, error: 'Failed to leave fan club' };
    }
  }

  // Remove member from fan club (streamer action)
  async removeMember(
    streamerId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get fan club
      const fanClub = await this.getFanClub(streamerId);
      if (!fanClub) {
        return { success: false, error: 'Fan club not found' };
      }

      const { error } = await supabase
        .from('fan_club_members')
        .delete()
        .eq('fan_club_id', fanClub.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Member removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeMember:', error);
      return { success: false, error: 'Failed to remove member' };
    }
  }

  // Check if user is a fan club member
  async isFanClubMember(fanClubId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('fan_club_members')
        .select('id, is_active, subscription_end')
        .eq('fan_club_id', fanClubId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking membership:', error);
        return false;
      }

      if (!data) return false;

      // Check if subscription is still active
      if (!data.is_active) return false;

      const subscriptionEnd = new Date(data.subscription_end);
      const now = new Date();
      return now < subscriptionEnd;
    } catch (error) {
      console.error('Error in isFanClubMember:', error);
      return false;
    }
  }

  // Check if user is a member of a specific streamer's fan club
  async isMemberOfStreamerFanClub(streamerId: string, userId: string): Promise<boolean> {
    try {
      const fanClub = await this.getFanClub(streamerId);
      if (!fanClub) return false;

      return await this.isFanClubMember(fanClub.id, userId);
    } catch (error) {
      console.error('Error in isMemberOfStreamerFanClub:', error);
      return false;
    }
  }

  // Get all members of a fan club
  async getFanClubMembers(fanClubId: string): Promise<FanClubMember[]> {
    try {
      const { data, error } = await supabase
        .from('fan_club_members')
        .select('*, profiles(*)')
        .eq('fan_club_id', fanClubId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fan club members:', error);
        return [];
      }

      // Filter out expired subscriptions
      const now = new Date();
      return (data as FanClubMember[]).filter((member) => {
        const subscriptionEnd = new Date(member.subscription_end);
        return subscriptionEnd > now;
      });
    } catch (error) {
      console.error('Error in getFanClubMembers:', error);
      return [];
    }
  }

  // Get fan club badge info for a user in a specific stream
  async getFanClubBadge(
    streamerId: string,
    userId: string
  ): Promise<{ isMember: boolean; badgeColor?: string; clubName?: string }> {
    try {
      const fanClub = await this.getFanClub(streamerId);
      if (!fanClub) {
        return { isMember: false };
      }

      const isMember = await this.isFanClubMember(fanClub.id, userId);
      if (!isMember) {
        return { isMember: false };
      }

      return {
        isMember: true,
        badgeColor: fanClub.badge_color,
        clubName: fanClub.club_name,
      };
    } catch (error) {
      console.error('Error in getFanClubBadge:', error);
      return { isMember: false };
    }
  }

  // Update streaming hours (called when stream ends)
  async updateStreamingHours(
    userId: string,
    additionalHours: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_streaming_hours')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const currentHours = parseFloat(profile.total_streaming_hours || '0');
      const newHours = currentHours + additionalHours;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_streaming_hours: newHours })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating streaming hours:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Updated streaming hours: ${newHours}`);
      return { success: true };
    } catch (error) {
      console.error('Error in updateStreamingHours:', error);
      return { success: false, error: 'Failed to update streaming hours' };
    }
  }
}

export const fanClubService = new FanClubService();