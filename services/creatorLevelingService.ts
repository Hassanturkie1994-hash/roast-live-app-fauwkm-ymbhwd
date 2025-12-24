
/**
 * Creator Leveling Service
 * 
 * Manages creator XP, levels, and perk unlocks.
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface CreatorLevel {
  id: string;
  creator_id: string;
  current_level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorPerk {
  id: string;
  name: string;
  description: string;
  unlock_level: number;
  icon: string;
  category: string;
}

export interface CreatorUnlockedPerk {
  id: string;
  creator_id: string;
  perk_id: string;
  unlocked_at: string;
  is_equipped: boolean;
  perk: CreatorPerk;
}

class CreatorLevelingService {
  async getCreatorLevel(creatorId: string): Promise<CreatorLevel | null> {
    try {
      const { data, error } = await supabase
        .from('creator_levels')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [CreatorLevelingService] Error fetching level:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching level:', error);
      return null;
    }
  }

  async getAllPerks(): Promise<CreatorPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_perks')
        .select('*')
        .order('unlock_level', { ascending: true });

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching perks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching perks:', error);
      return [];
    }
  }

  async getUnlockedPerks(creatorId: string): Promise<CreatorUnlockedPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_unlocked_perks')
        .select('*, perk:creator_perks(*)')
        .eq('creator_id', creatorId);

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching unlocked perks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching unlocked perks:', error);
      return [];
    }
  }

  async getEquippedPerks(creatorId: string): Promise<CreatorUnlockedPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_unlocked_perks')
        .select('*, perk:creator_perks(*)')
        .eq('creator_id', creatorId)
        .eq('is_equipped', true);

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching equipped perks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching equipped perks:', error);
      return [];
    }
  }

  async equipPerk(creatorId: string, perkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('creator_unlocked_perks')
        .update({ is_equipped: true })
        .eq('creator_id', creatorId)
        .eq('perk_id', perkId);

      if (error) {
        console.error('❌ [CreatorLevelingService] Error equipping perk:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception equipping perk:', error);
      return false;
    }
  }

  async unequipPerk(creatorId: string, perkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('creator_unlocked_perks')
        .update({ is_equipped: false })
        .eq('creator_id', creatorId)
        .eq('perk_id', perkId);

      if (error) {
        console.error('❌ [CreatorLevelingService] Error unequipping perk:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception unequipping perk:', error);
      return false;
    }
  }

  getLevelProgress(currentXp: number, xpToNextLevel: number): number {
    if (xpToNextLevel === 0) return 100;
    return Math.min((currentXp / xpToNextLevel) * 100, 100);
  }

  subscribeToLevelUpdates(
    creatorId: string,
    callback: (level: CreatorLevel) => void
  ): () => void {
    const channel = supabase
      .channel(`creator_level:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creator_levels',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          callback(payload.new as CreatorLevel);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToPerkUnlocks(
    creatorId: string,
    callback: () => void
  ): () => void {
    const channel = supabase
      .channel(`creator_perks:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_unlocked_perks',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const creatorLevelingService = new CreatorLevelingService();
