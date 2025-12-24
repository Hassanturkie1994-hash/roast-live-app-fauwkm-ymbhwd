
/**
 * Battle Gift Service
 * 
 * Manages gift routing and behavior during battle mode.
 */

import { supabase } from '@/app/integrations/supabase/client';

interface BattleContext {
  isInBattle: boolean;
  battleId?: string;
  teamA?: string[];
  teamB?: string[];
}

type Team = 'team_a' | 'team_b';

interface GiftBehavior {
  allowed: boolean;
  multiplier: number;
  specialEffect?: string;
}

class BattleGiftService {
  private currentBattleContext: BattleContext | null = null;

  getBattleContext(): BattleContext | null {
    return this.currentBattleContext;
  }

  setBattleContext(context: BattleContext | null): void {
    this.currentBattleContext = context;
    console.log('⚔️ [BattleGiftService] Battle context updated:', context);
  }

  async routeGift(
    giftId: string,
    senderId: string,
    receiverTeam: Team,
    amount: number
  ): Promise<{ allowed: boolean; behavior: GiftBehavior }> {
    console.log('⚔️ [BattleGiftService] Routing gift:', { giftId, senderId, receiverTeam, amount });

    // Default behavior - allow all gifts
    const behavior: GiftBehavior = {
      allowed: true,
      multiplier: 1.0,
    };

    // Check if in battle mode
    if (!this.currentBattleContext?.isInBattle) {
      return { allowed: true, behavior };
    }

    // Apply battle-specific logic
    // For now, just allow with default multiplier
    return { allowed: true, behavior };
  }

  async updateBattleScore(
    battleId: string,
    team: Team,
    points: number
  ): Promise<void> {
    try {
      console.log('⚔️ [BattleGiftService] Updating battle score:', { battleId, team, points });

      // Update battle scores in database
      // Implementation would go here
    } catch (error) {
      console.error('❌ [BattleGiftService] Error updating battle score:', error);
    }
  }
}

export const battleGiftService = new BattleGiftService();
