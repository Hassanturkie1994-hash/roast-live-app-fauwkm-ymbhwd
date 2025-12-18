
/**
 * Battle Gift Service
 * 
 * Handles battle-specific gift behaviors and routing.
 * Battle gifts override normal gifts and have higher priority.
 * 
 * Battle-specific behaviors:
 * - "Silence Button": Temporarily mutes opponent audio locally
 * - "Spotlight Shame": Zoom spotlight on losing creator
 * - "Final Blow": Ends battle immediately
 */

import { supabase } from '@/app/integrations/supabase/client';
import { giftSoundEngine } from './giftSoundEngine';

export interface BattleGiftBehavior {
  giftId: string;
  behaviorType: 'silence' | 'spotlight' | 'final_blow' | 'normal';
  duration?: number; // milliseconds
  targetTeam?: 'team_a' | 'team_b';
}

export interface BattleContext {
  matchId: string;
  isInBattle: boolean;
  userTeam: 'team_a' | 'team_b' | null;
  opponentTeam: 'team_a' | 'team_b' | null;
}

class BattleGiftService {
  private battleContext: BattleContext | null = null;
  private silenceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Set<(event: string, data: any) => void> = new Set();

  /**
   * Set battle context
   */
  public setBattleContext(context: BattleContext | null): void {
    this.battleContext = context;
    console.log('🎮 [BattleGiftService] Battle context set:', context);
  }

  /**
   * Get current battle context
   */
  public getBattleContext(): BattleContext | null {
    return this.battleContext;
  }

  /**
   * Check if user is in battle
   */
  public isInBattle(): boolean {
    return this.battleContext?.isInBattle ?? false;
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: (event: string, data: any) => void): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: string, data: any) => void): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: string, data: any): void {
    this.eventListeners.forEach(listener => listener(event, data));
  }

  /**
   * Filter and route gift based on battle context
   */
  public async routeGift(
    giftId: string,
    senderId: string,
    receiverTeam: 'team_a' | 'team_b',
    amountSek: number
  ): Promise<{ allowed: boolean; behavior?: BattleGiftBehavior }> {
    // If not in battle, allow normal gift flow
    if (!this.isInBattle()) {
      return { allowed: true };
    }

    // Get battle-specific behavior
    const behavior = this.getBattleGiftBehavior(giftId);

    // Check if gift is battle-only
    if (behavior.behaviorType !== 'normal' && !this.isInBattle()) {
      console.warn('⚠️ [BattleGiftService] Battle-only gift used outside battle:', giftId);
      return { allowed: false };
    }

    // Execute battle-specific behavior
    if (behavior.behaviorType !== 'normal') {
      await this.executeBattleBehavior(behavior, receiverTeam);
    }

    // Record battle gift transaction
    if (this.battleContext) {
      await this.recordBattleGift(
        this.battleContext.matchId,
        senderId,
        receiverTeam,
        giftId,
        amountSek
      );
    }

    return { allowed: true, behavior };
  }

  /**
   * Get battle-specific behavior for a gift
   */
  private getBattleGiftBehavior(giftId: string): BattleGiftBehavior {
    const battleGiftBehaviors: Record<string, BattleGiftBehavior> = {
      silence_button: {
        giftId: 'silence_button',
        behaviorType: 'silence',
        duration: 10000, // 10 seconds
      },
      spotlight_shame: {
        giftId: 'spotlight_shame',
        behaviorType: 'spotlight',
        duration: 5000, // 5 seconds
      },
      you_are_done: {
        giftId: 'you_are_done',
        behaviorType: 'final_blow',
      },
    };

    return battleGiftBehaviors[giftId] || { giftId, behaviorType: 'normal' };
  }

  /**
   * Execute battle-specific behavior
   */
  private async executeBattleBehavior(
    behavior: BattleGiftBehavior,
    targetTeam: 'team_a' | 'team_b'
  ): Promise<void> {
    switch (behavior.behaviorType) {
      case 'silence':
        await this.executeSilenceBehavior(behavior, targetTeam);
        break;
      case 'spotlight':
        await this.executeSpotlightBehavior(behavior, targetTeam);
        break;
      case 'final_blow':
        await this.executeFinalBlowBehavior(behavior);
        break;
    }
  }

  /**
   * Execute "Silence Button" behavior
   * Temporarily mutes opponent audio locally
   */
  private async executeSilenceBehavior(
    behavior: BattleGiftBehavior,
    targetTeam: 'team_a' | 'team_b'
  ): Promise<void> {
    console.log('🔇 [BattleGiftService] Executing Silence Button');

    // Only mute if targeting opponent team
    if (this.battleContext && targetTeam !== this.battleContext.userTeam) {
      // Mute opponent audio locally (not globally)
      this.emitEvent('muteOpponent', { duration: behavior.duration || 10000 });
      
      // Show visual countdown overlay
      this.showCountdownOverlay(behavior.duration || 10000);

      // Play crowd boo sound
      await giftSoundEngine.playSound('crowd_boo', 'ULTRA');

      // Schedule unmute
      const timer = setTimeout(() => {
        console.log('🔊 [BattleGiftService] Silence ended');
        this.hideCountdownOverlay();
        this.emitEvent('unmuteOpponent', {});
      }, behavior.duration || 10000);

      this.silenceTimers.set(behavior.giftId, timer);
    }
  }

  /**
   * Execute "Spotlight Shame" behavior
   * Zoom spotlight on losing creator
   */
  private async executeSpotlightBehavior(
    behavior: BattleGiftBehavior,
    targetTeam: 'team_a' | 'team_b'
  ): Promise<void> {
    console.log('💡 [BattleGiftService] Executing Spotlight Shame');

    // Zoom spotlight on target team
    this.showSpotlightEffect(targetTeam);

    // Play crowd boo sound
    await giftSoundEngine.playSound('crowd_boo', 'HIGH');

    // Temporary UI emphasis
    setTimeout(() => {
      this.hideSpotlightEffect();
    }, behavior.duration || 5000);
  }

  /**
   * Execute "Final Blow" behavior
   * Ends battle immediately
   */
  private async executeFinalBlowBehavior(behavior: BattleGiftBehavior): Promise<void> {
    console.log('⚔️ [BattleGiftService] Executing Final Blow');

    if (!this.battleContext) return;

    // Trigger cinematic outro
    this.triggerCinematicOutro();

    // Lock UI
    this.lockUI();

    // Play dramatic sound
    await giftSoundEngine.playSound('game_over', 'ULTRA');

    // End battle after cinematic
    setTimeout(async () => {
      await this.endBattle();
    }, 5000);
  }

  /**
   * Record battle gift transaction
   */
  private async recordBattleGift(
    matchId: string,
    senderId: string,
    receiverTeam: 'team_a' | 'team_b',
    giftId: string,
    amountSek: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('battle_gift_transactions').insert({
        match_id: matchId,
        sender_id: senderId,
        receiver_team: receiverTeam,
        gift_id: giftId,
        amount_sek: amountSek,
      });

      if (error) {
        console.error('❌ [BattleGiftService] Error recording battle gift:', error);
      } else {
        console.log('✅ [BattleGiftService] Battle gift recorded');
      }
    } catch (error) {
      console.error('❌ [BattleGiftService] Exception recording battle gift:', error);
    }
  }

  /**
   * Show countdown overlay
   */
  private showCountdownOverlay(duration: number): void {
    this.emitEvent('showCountdown', { duration });
    console.log(`⏱️ [BattleGiftService] Showing countdown overlay: ${duration}ms`);
  }

  /**
   * Hide countdown overlay
   */
  private hideCountdownOverlay(): void {
    this.emitEvent('hideCountdown', {});
    console.log('⏱️ [BattleGiftService] Hiding countdown overlay');
  }

  /**
   * Show spotlight effect
   */
  private showSpotlightEffect(targetTeam: 'team_a' | 'team_b'): void {
    this.emitEvent('showSpotlight', { targetTeam });
    console.log(`💡 [BattleGiftService] Showing spotlight on ${targetTeam}`);
  }

  /**
   * Hide spotlight effect
   */
  private hideSpotlightEffect(): void {
    this.emitEvent('hideSpotlight', {});
    console.log('💡 [BattleGiftService] Hiding spotlight effect');
  }

  /**
   * Trigger cinematic outro
   */
  private triggerCinematicOutro(): void {
    this.emitEvent('cinematicOutro', {});
    console.log('🎬 [BattleGiftService] Triggering cinematic outro');
  }

  /**
   * Lock UI
   */
  private lockUI(): void {
    this.emitEvent('lockUI', { locked: true });
    console.log('🔒 [BattleGiftService] Locking UI');
  }

  /**
   * End battle
   */
  private async endBattle(): Promise<void> {
    if (!this.battleContext) return;

    console.log('🏁 [BattleGiftService] Ending battle');

    this.emitEvent('battleEnded', { matchId: this.battleContext.matchId });

    // This would call the battle service to end the match
    // For now, just clear context
    this.battleContext = null;
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    // Clear all timers
    for (const timer of this.silenceTimers.values()) {
      clearTimeout(timer);
    }
    this.silenceTimers.clear();

    // Clear battle context
    this.battleContext = null;

    // Clear event listeners
    this.eventListeners.clear();

    console.log('🗑️ [BattleGiftService] Cleaned up');
  }
}

// Export singleton instance
export const battleGiftService = new BattleGiftService();
