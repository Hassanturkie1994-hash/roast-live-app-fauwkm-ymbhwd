
/**
 * Creator Leveling & Perks Service
 * 
 * Implements the Creator Leveling system for Roast Live streaming platform.
 * 
 * Concept:
 * Creators level up based on:
 * - Total confirmed gift value earned
 * - Roast battles participated in
 * - Unique viewers engaged
 * - Season participation
 * 
 * Level system:
 * - Levels 1–50
 * - XP is earned passively from live activity
 * - XP is NOT affected by animation success
 * 
 * XP sources:
 * - Gifts received (weighted by tier)
 * - Battle wins
 * - Stream duration milestones
 * - Seasonal participation
 * 
 * Perks by level (examples):
 * - Level 5: Custom stream intro sound
 * - Level 10: Animated profile frame
 * - Level 20: Exclusive cosmetic roast gifts
 * - Level 30: Battle priority placement
 * - Level 40: Advanced analytics access
 * - Level 50: Legendary Roast title (cosmetic only)
 * 
 * Rules:
 * - No monetization advantage
 * - Perks are cosmetic or UX-based
 * - Levels never reset
 * - Levels are separate from seasonal ranks
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface CreatorLevel {
  id: string;
  creator_id: string;
  current_level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_xp_earned: number;
  xp_from_gifts: number;
  xp_from_battles: number;
  xp_from_stream_duration: number;
  xp_from_seasons: number;
  total_confirmed_gift_value_sek: number;
  total_battles_participated: number;
  total_unique_viewers: number;
  total_seasons_participated: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorPerk {
  id: string;
  perk_key: string;
  perk_name: string;
  perk_description: string;
  perk_type: 'cosmetic' | 'ux' | 'analytics' | 'priority';
  required_level: number;
  perk_data: Record<string, any>;
  icon_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorUnlockedPerk {
  id: string;
  creator_id: string;
  perk_id: string;
  unlocked_at: string;
  is_equipped: boolean;
  created_at: string;
  perk?: CreatorPerk;
}

export interface CreatorLevelHistory {
  id: string;
  creator_id: string;
  previous_level: number;
  new_level: number;
  xp_gained: number;
  xp_source: 'gift' | 'battle' | 'stream_duration' | 'season';
  metadata: Record<string, any>;
  created_at: string;
}

export interface AddXPResult {
  success: boolean;
  previous_level: number;
  new_level: number;
  leveled_up: boolean;
  xp_gained: number;
  current_xp: number;
  xp_to_next_level: number;
  perks_unlocked: string[];
}

class CreatorLevelingService {
  /**
   * Get creator's current level
   */
  public async getCreatorLevel(creatorId: string): Promise<CreatorLevel | null> {
    try {
      const { data, error } = await supabase
        .from('creator_levels')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          return await this.initializeCreatorLevel(creatorId);
        }
        console.error('❌ [CreatorLevelingService] Error fetching creator level:', error);
        return null;
      }

      return data as CreatorLevel;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching creator level:', error);
      return null;
    }
  }

  /**
   * Initialize creator level (called automatically if no record exists)
   */
  private async initializeCreatorLevel(creatorId: string): Promise<CreatorLevel | null> {
    try {
      const { data, error } = await supabase
        .from('creator_levels')
        .insert({
          creator_id: creatorId,
          current_level: 1,
          current_xp: 0,
          xp_to_next_level: 1000,
          total_xp_earned: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CreatorLevelingService] Error initializing creator level:', error);
        return null;
      }

      console.log('✅ [CreatorLevelingService] Creator level initialized');
      return data as CreatorLevel;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception initializing creator level:', error);
      return null;
    }
  }

  /**
   * Get all available perks
   */
  public async getAllPerks(): Promise<CreatorPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_perks')
        .select('*')
        .eq('is_active', true)
        .order('required_level', { ascending: true });

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching perks:', error);
        return [];
      }

      return data as CreatorPerk[];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching perks:', error);
      return [];
    }
  }

  /**
   * Get perks for a specific level
   */
  public async getPerksForLevel(level: number): Promise<CreatorPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_perks')
        .select('*')
        .eq('required_level', level)
        .eq('is_active', true)
        .order('perk_name', { ascending: true });

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching perks for level:', error);
        return [];
      }

      return data as CreatorPerk[];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching perks for level:', error);
      return [];
    }
  }

  /**
   * Get creator's unlocked perks
   */
  public async getUnlockedPerks(creatorId: string): Promise<CreatorUnlockedPerk[]> {
    try {
      const { data, error } = await supabase
        .from('creator_unlocked_perks')
        .select('*, perk:creator_perks(*)')
        .eq('creator_id', creatorId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching unlocked perks:', error);
        return [];
      }

      return data as CreatorUnlockedPerk[];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching unlocked perks:', error);
      return [];
    }
  }

  /**
   * Get creator's equipped perks
   */
  public async getEquippedPerks(creatorId: string): Promise<CreatorUnlockedPerk[]> {
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

      return data as CreatorUnlockedPerk[];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching equipped perks:', error);
      return [];
    }
  }

  /**
   * Equip a perk
   */
  public async equipPerk(creatorId: string, perkId: string): Promise<boolean> {
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

      console.log('✅ [CreatorLevelingService] Perk equipped');
      return true;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception equipping perk:', error);
      return false;
    }
  }

  /**
   * Unequip a perk
   */
  public async unequipPerk(creatorId: string, perkId: string): Promise<boolean> {
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

      console.log('✅ [CreatorLevelingService] Perk unequipped');
      return true;
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception unequipping perk:', error);
      return false;
    }
  }

  /**
   * Get creator's level history
   */
  public async getLevelHistory(creatorId: string, limit: number = 50): Promise<CreatorLevelHistory[]> {
    try {
      const { data, error } = await supabase
        .from('creator_level_history')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [CreatorLevelingService] Error fetching level history:', error);
        return [];
      }

      return data as CreatorLevelHistory[];
    } catch (error) {
      console.error('❌ [CreatorLevelingService] Exception fetching level history:', error);
      return [];
    }
  }

  /**
   * Calculate XP for a given level
   * Exponential curve: base_xp * (1.15 ^ (level - 1))
   */
  public calculateXPForLevel(level: number): number {
    return Math.floor(1000 * Math.pow(1.15, level - 1));
  }

  /**
   * Calculate total XP needed to reach a level
   */
  public calculateTotalXPForLevel(level: number): number {
    let totalXP = 0;
    for (let i = 1; i < level; i++) {
      totalXP += this.calculateXPForLevel(i);
    }
    return totalXP;
  }

  /**
   * Get level progress percentage
   */
  public getLevelProgress(currentXP: number, xpToNext: number): number {
    if (xpToNext === 0) return 100;
    return Math.min(100, Math.round((currentXP / xpToNext) * 100));
  }

  /**
   * Format XP amount
   */
  public formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }

  /**
   * Get perk icon for display
   */
  public getPerkIcon(perkType: string): string {
    const icons: Record<string, string> = {
      cosmetic: '✨',
      ux: '🎨',
      analytics: '📊',
      priority: '⚡',
    };
    return icons[perkType] || '🎁';
  }

  /**
   * Get level tier name
   */
  public getLevelTierName(level: number): string {
    if (level >= 50) return 'Legendary';
    if (level >= 40) return 'Master';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Advanced';
    if (level >= 10) return 'Intermediate';
    return 'Beginner';
  }

  /**
   * Get level tier color
   */
  public getLevelTierColor(level: number): string {
    if (level >= 50) return '#FF0000';
    if (level >= 40) return '#FF1493';
    if (level >= 30) return '#FFD700';
    if (level >= 20) return '#C0C0C0';
    if (level >= 10) return '#CD7F32';
    return '#CCCCCC';
  }

  /**
   * Subscribe to level updates
   */
  public subscribeToLevelUpdates(
    creatorId: string,
    callback: (level: CreatorLevel) => void
  ): () => void {
    const channel = supabase
      .channel(`creator_level:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_levels',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          console.log('📡 [CreatorLevelingService] Level update received:', payload);
          if (payload.new) {
            callback(payload.new as CreatorLevel);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to perk unlocks
   */
  public subscribeToPerkUnlocks(
    creatorId: string,
    callback: (perk: CreatorUnlockedPerk) => void
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
        (payload) => {
          console.log('📡 [CreatorLevelingService] Perk unlocked:', payload);
          if (payload.new) {
            callback(payload.new as CreatorUnlockedPerk);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const creatorLevelingService = new CreatorLevelingService();
