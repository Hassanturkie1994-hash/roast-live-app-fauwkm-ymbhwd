
import { supabase } from '@/app/integrations/supabase/client';

export interface CreatorClub {
  id: string;
  creator_id: string;
  name: string;
  tag: string;
  monthly_price_cents: number;
  currency: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreatorClubMembership {
  id: string;
  club_id: string;
  member_id: string;
  started_at: string;
  renews_at: string;
  is_active: boolean;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  creator_clubs?: CreatorClub;
}

class CreatorClubService {
  /**
   * Create a creator club
   */
  async createClub(
    creatorId: string,
    name: string,
    tag: string,
    monthlyPriceCents: number = 300,
    description?: string,
    currency: string = 'SEK'
  ): Promise<{ success: boolean; error?: string; data?: CreatorClub }> {
    try {
      // Validate tag length
      if (tag.length > 5) {
        return { success: false, error: 'Tag must be 5 characters or less' };
      }

      // Validate name length
      if (name.length > 32) {
        return { success: false, error: 'Name must be 32 characters or less' };
      }

      // Check if club already exists
      const existing = await this.getClubByCreator(creatorId);
      if (existing) {
        return { success: false, error: 'You already have a creator club' };
      }

      const { data, error } = await supabase
        .from('creator_clubs')
        .insert({
          creator_id: creatorId,
          name,
          tag: tag.toUpperCase(),
          monthly_price_cents: monthlyPriceCents,
          currency,
          description,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating creator club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Creator club created successfully');
      return { success: true, data: data as CreatorClub };
    } catch (error) {
      console.error('Error in createClub:', error);
      return { success: false, error: 'Failed to create creator club' };
    }
  }

  /**
   * Update a creator club
   */
  async updateClub(
    creatorId: string,
    updates: {
      name?: string;
      tag?: string;
      monthly_price_cents?: number;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (updates.tag && updates.tag.length > 5) {
        return { success: false, error: 'Tag must be 5 characters or less' };
      }

      if (updates.name && updates.name.length > 32) {
        return { success: false, error: 'Name must be 32 characters or less' };
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tag !== undefined) updateData.tag = updates.tag.toUpperCase();
      if (updates.monthly_price_cents !== undefined) updateData.monthly_price_cents = updates.monthly_price_cents;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { error } = await supabase
        .from('creator_clubs')
        .update(updateData)
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error updating creator club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Creator club updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateClub:', error);
      return { success: false, error: 'Failed to update creator club' };
    }
  }

  /**
   * Get creator club by creator ID
   */
  async getClubByCreator(creatorId: string): Promise<CreatorClub | null> {
    try {
      const { data, error } = await supabase
        .from('creator_clubs')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator club:', error);
        return null;
      }

      return data as CreatorClub;
    } catch (error) {
      console.error('Error in getClubByCreator:', error);
      return null;
    }
  }

  /**
   * Get creator club by ID
   */
  async getClubById(clubId: string): Promise<CreatorClub | null> {
    try {
      const { data, error } = await supabase
        .from('creator_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator club:', error);
        return null;
      }

      return data as CreatorClub;
    } catch (error) {
      console.error('Error in getClubById:', error);
      return null;
    }
  }

  /**
   * Join a creator club (subscribe)
   */
  async joinClub(
    clubId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already a member
      const isMember = await this.isMember(clubId, memberId);
      if (isMember) {
        return { success: false, error: 'You are already a member of this club' };
      }

      // Calculate renewal date (1 month from now)
      const renewsAt = new Date();
      renewsAt.setMonth(renewsAt.getMonth() + 1);

      const { error } = await supabase
        .from('creator_club_memberships')
        .insert({
          club_id: clubId,
          member_id: memberId,
          renews_at: renewsAt.toISOString(),
          is_active: true,
          cancel_at_period_end: false,
        });

      if (error) {
        console.error('Error joining creator club:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Joined creator club successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in joinClub:', error);
      return { success: false, error: 'Failed to join creator club' };
    }
  }

  /**
   * Cancel club membership
   */
  async cancelMembership(
    clubId: string,
    memberId: string,
    immediate: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (immediate) {
        // Immediately deactivate
        const { error } = await supabase
          .from('creator_club_memberships')
          .update({
            is_active: false,
            cancel_at_period_end: false,
          })
          .eq('club_id', clubId)
          .eq('member_id', memberId);

        if (error) {
          console.error('Error canceling membership:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Cancel at period end
        const { error } = await supabase
          .from('creator_club_memberships')
          .update({
            cancel_at_period_end: true,
          })
          .eq('club_id', clubId)
          .eq('member_id', memberId);

        if (error) {
          console.error('Error setting cancel at period end:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Membership canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelMembership:', error);
      return { success: false, error: 'Failed to cancel membership' };
    }
  }

  /**
   * Check if user is a member of a club
   */
  async isMember(clubId: string, memberId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('creator_club_memberships')
        .select('id, is_active, renews_at')
        .eq('club_id', clubId)
        .eq('member_id', memberId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking membership:', error);
        return false;
      }

      if (!data) return false;

      // Check if subscription is still active
      if (!data.is_active) return false;

      const renewsAt = new Date(data.renews_at);
      const now = new Date();
      return now < renewsAt;
    } catch (error) {
      console.error('Error in isMember:', error);
      return false;
    }
  }

  /**
   * Check if user is a member of a specific creator's club
   */
  async isMemberOfCreatorClub(creatorId: string, memberId: string): Promise<boolean> {
    try {
      const club = await this.getClubByCreator(creatorId);
      if (!club) return false;

      return await this.isMember(club.id, memberId);
    } catch (error) {
      console.error('Error in isMemberOfCreatorClub:', error);
      return false;
    }
  }

  /**
   * Get all members of a club
   */
  async getClubMembers(clubId: string): Promise<CreatorClubMembership[]> {
    try {
      const { data, error } = await supabase
        .from('creator_club_memberships')
        .select('*, profiles(*)')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching club members:', error);
        return [];
      }

      // Filter out expired subscriptions
      const now = new Date();
      return (data as CreatorClubMembership[]).filter((member) => {
        const renewsAt = new Date(member.renews_at);
        return renewsAt > now;
      });
    } catch (error) {
      console.error('Error in getClubMembers:', error);
      return [];
    }
  }

  /**
   * Get user's club memberships
   */
  async getUserMemberships(userId: string): Promise<CreatorClubMembership[]> {
    try {
      const { data, error } = await supabase
        .from('creator_club_memberships')
        .select('*, creator_clubs(*)')
        .eq('member_id', userId)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching user memberships:', error);
        return [];
      }

      return data as CreatorClubMembership[];
    } catch (error) {
      console.error('Error in getUserMemberships:', error);
      return [];
    }
  }

  /**
   * Get club badge for a user in a specific creator's context
   */
  async getClubBadge(
    creatorId: string,
    userId: string
  ): Promise<{ isMember: boolean; tag?: string; clubName?: string }> {
    try {
      const club = await this.getClubByCreator(creatorId);
      if (!club) {
        return { isMember: false };
      }

      const isMember = await this.isMember(club.id, userId);
      if (!isMember) {
        return { isMember: false };
      }

      return {
        isMember: true,
        tag: club.tag,
        clubName: club.name,
      };
    } catch (error) {
      console.error('Error in getClubBadge:', error);
      return { isMember: false };
    }
  }

  /**
   * Get club statistics
   */
  async getClubStats(clubId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
  }> {
    try {
      const { data: club } = await supabase
        .from('creator_clubs')
        .select('monthly_price_cents')
        .eq('id', clubId)
        .single();

      const { data: memberships } = await supabase
        .from('creator_club_memberships')
        .select('is_active, renews_at')
        .eq('club_id', clubId);

      if (!memberships || !club) {
        return { totalMembers: 0, activeMembers: 0, monthlyRevenue: 0 };
      }

      const now = new Date();
      const activeMembers = memberships.filter(
        (m) => m.is_active && new Date(m.renews_at) > now
      ).length;

      const monthlyRevenue = (activeMembers * club.monthly_price_cents) / 100;

      return {
        totalMembers: memberships.length,
        activeMembers,
        monthlyRevenue,
      };
    } catch (error) {
      console.error('Error in getClubStats:', error);
      return { totalMembers: 0, activeMembers: 0, monthlyRevenue: 0 };
    }
  }
}

export const creatorClubService = new CreatorClubService();