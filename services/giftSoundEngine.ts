
/**
 * Gift Sound Engine
 * 
 * Handles all sound playback for roast gifts with audio ducking and priority management.
 * All sounds are played locally on device, no sound data is sent in the stream.
 * 
 * Philosophy:
 * Sound is as important as animation.
 * Sounds must amplify humiliation, drama, hype, and crowd energy.
 */

import { Audio } from 'expo-av';

export type SoundTier = 'LOW' | 'MID' | 'HIGH' | 'ULTRA';

export interface SoundProfile {
  soundId: string;
  tier: SoundTier;
  duration: number; // milliseconds
  duckingLevel: number; // dB reduction
  canBatch: boolean;
  canBeInterrupted: boolean;
}

export interface PlayingSoundInfo {
  soundId: string;
  tier: SoundTier;
  sound: Audio.Sound;
  startTime: number;
  duration: number;
}

class GiftSoundEngine {
  private activeSounds: Map<string, PlayingSoundInfo> = new Map();
  private soundQueue: { soundId: string; tier: SoundTier }[] = [];
  private isProcessing: boolean = false;
  private streamAudioVolume: number = 1.0;
  private performanceFallback: boolean = false;
  private initialized: boolean = false;

  // Sound tier configurations
  private readonly TIER_CONFIG: Record<SoundTier, { maxDuration: number; ducking: number; priority: number }> = {
    LOW: { maxDuration: 500, ducking: -6, priority: 1 },
    MID: { maxDuration: 1200, ducking: -10, priority: 2 },
    HIGH: { maxDuration: 3000, ducking: -14, priority: 3 },
    ULTRA: { maxDuration: 8000, ducking: -20, priority: 4 },
  };

  // Sound file mappings
  private readonly SOUND_FILES: Record<string, any> = {
    // LOW TIER (1-10 SEK)
    crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
    cricket_chirp: require('../assets/sounds/crickets.mp3'),
    sad_trombone: require('../assets/sounds/sad_trombone.mp3'),
    slap_sound: require('../assets/sounds/facepalm.mp3'),
    tomato_splat: require('../assets/sounds/tomato_splat.mp3'),
    sitcom_laugh: require('../assets/sounds/sitcom_laugh.mp3'),
    yawn_sound: require('../assets/sounds/yawn.mp3'),
    clown_horn: require('../assets/sounds/clown_horn.mp3'),
    trash_dump: require('../assets/sounds/trash_dump.mp3'),
    death_sound: require('../assets/sounds/death.mp3'),
    fart_sound: require('../assets/sounds/fart.mp3'),
    sigh_sound: require('../assets/sounds/sigh.mp3'),
    snore_sound: require('../assets/sounds/snore.mp3'),
    
    // MID TIER (20-100 SEK)
    mic_drop_thud: require('../assets/sounds/mic_drop.mp3'),
    airhorn_blast: require('../assets/sounds/airhorn.mp3'),
    crowd_roar: require('../assets/sounds/laugh_explosion.mp3'),
    boxing_bell: require('../assets/sounds/boxing_bell.mp3'),
    fire_whoosh: require('../assets/sounds/fire_whoosh.mp3'),
    explosion_boom: require('../assets/sounds/explosion.mp3'),
    gasp_sound: require('../assets/sounds/gasp.mp3'),
    savage_sound: require('../assets/sounds/savage.mp3'),
    salt_pour: require('../assets/sounds/salt_pour.mp3'),
    tea_spill: require('../assets/sounds/tea_spill.mp3'),
    cringe_sound: require('../assets/sounds/cringe.mp3'),
    
    // HIGH TIER (150-500 SEK)
    flamethrower: require('../assets/sounds/fire_blast.mp3'),
    stamp_slam: require('../assets/sounds/stamp_slam.mp3'),
    gavel_bang: require('../assets/sounds/judge_gavel.mp3'),
    crown_fanfare: require('../assets/sounds/crown_fanfare.mp3'),
    punch_knockout: require('../assets/sounds/punch_knockout.mp3'),
    bomb_explosion: require('../assets/sounds/bomb_explosion.mp3'),
    thunder_crack: require('../assets/sounds/alarm_siren.mp3'),
    trophy_win: require('../assets/sounds/trophy_win.mp3'),
    hammer_slam: require('../assets/sounds/hammer_slam.mp3'),
    sword_slash: require('../assets/sounds/sword_slash.mp3'),
    shield_block: require('../assets/sounds/shield_block.mp3'),
    
    // ULTRA TIER (2000-4000 SEK)
    funeral_march: require('../assets/sounds/funeral_choir.mp3'),
    riot_chaos: require('../assets/sounds/riot_sirens.mp3'),
    game_over: require('../assets/sounds/epic_bass_drop.mp3'),
    siren: require('../assets/sounds/siren.mp3'),
    church_bell: require('../assets/sounds/church_bell.mp3'),
    crowd_chant: require('../assets/sounds/crowd_chant.mp3'),
    earthquake_rumble: require('../assets/sounds/earthquake_rumble.mp3'),
    slow_motion: require('../assets/sounds/slow_motion.mp3'),
    spotlight_on: require('../assets/sounds/spotlight_on.mp3'),
    mute_sound: require('../assets/sounds/mute_sound.mp3'),
    time_stop: require('../assets/sounds/time_stop.mp3'),
    nuke_explosion: require('../assets/sounds/nuke_explosion.mp3'),
    shame_bell_ring: require('../assets/sounds/shame_bell_ring.mp3'),
    meteor_impact: require('../assets/sounds/meteor_impact.mp3'),
    execution_sound: require('../assets/sounds/execution_sound.mp3'),
    apocalypse_sound: require('../assets/sounds/apocalypse_sound.mp3'),
    dragon_roar: require('../assets/sounds/dragon_roar.mp3'),
  };

  /**
   * Initialize audio system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ [GiftSoundEngine] Already initialized');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.initialized = true;
      console.log('✅ [GiftSoundEngine] Audio initialized');
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Audio initialization failed:', error);
    }
  }

  /**
   * Play a sound based on gift sound profile
   */
  public async playSound(soundProfile: string, tier: SoundTier): Promise<void> {
    if (!this.initialized) {
      console.warn('⚠️ [GiftSoundEngine] Not initialized, initializing now...');
      await this.initialize();
    }

    if (this.performanceFallback) {
      console.log('⚠️ [GiftSoundEngine] Performance fallback active, skipping sound');
      return;
    }

    const config = this.TIER_CONFIG[tier];

    // Check if ULTRA tier is playing (blocks everything)
    if (this.hasActiveSoundOfTier('ULTRA') && tier !== 'ULTRA') {
      console.log('⚠️ [GiftSoundEngine] ULTRA sound active, blocking', soundProfile);
      return;
    }

    // Interrupt lower tier sounds if this is higher priority
    if (tier === 'HIGH' || tier === 'ULTRA') {
      this.interruptLowerTierSounds(tier);
    }

    // Apply audio ducking to stream
    this.applyAudioDucking(config.ducking);

    try {
      // Load and play sound
      const soundFile = this.SOUND_FILES[soundProfile];
      if (!soundFile) {
        console.warn('⚠️ [GiftSoundEngine] Sound file not found:', soundProfile);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: 1.0,
      });

      const soundInfo: PlayingSoundInfo = {
        soundId: soundProfile,
        tier,
        sound,
        startTime: Date.now(),
        duration: config.maxDuration,
      };

      this.activeSounds.set(soundProfile, soundInfo);

      // Schedule sound cleanup
      setTimeout(() => {
        this.stopSound(soundProfile);
      }, config.maxDuration);

      console.log(`🔊 [GiftSoundEngine] Playing sound: ${soundProfile} (${tier})`);
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Error playing sound:', error);
      this.restoreStreamAudio();
    }
  }

  /**
   * Stop a specific sound
   */
  public async stopSound(soundId: string): Promise<void> {
    const soundInfo = this.activeSounds.get(soundId);
    if (!soundInfo) return;

    try {
      await soundInfo.sound.unloadAsync();
      this.activeSounds.delete(soundId);

      // Restore stream audio if no more sounds are playing
      if (this.activeSounds.size === 0) {
        this.restoreStreamAudio();
      }

      console.log(`🔇 [GiftSoundEngine] Stopped sound: ${soundId}`);
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Error stopping sound:', error);
    }
  }

  /**
   * Stop all sounds
   */
  public async stopAllSounds(): Promise<void> {
    const soundIds = Array.from(this.activeSounds.keys());
    for (const soundId of soundIds) {
      await this.stopSound(soundId);
    }
    this.restoreStreamAudio();
  }

  /**
   * Check if a sound of specific tier is playing
   */
  private hasActiveSoundOfTier(tier: SoundTier): boolean {
    for (const soundInfo of this.activeSounds.values()) {
      if (soundInfo.tier === tier) {
        return true;
      }
    }
    return false;
  }

  /**
   * Interrupt lower tier sounds
   */
  private interruptLowerTierSounds(currentTier: SoundTier): void {
    const currentPriority = this.TIER_CONFIG[currentTier].priority;

    for (const [soundId, soundInfo] of this.activeSounds.entries()) {
      const soundPriority = this.TIER_CONFIG[soundInfo.tier].priority;
      if (soundPriority < currentPriority) {
        this.stopSound(soundId);
        console.log(`⚠️ [GiftSoundEngine] Interrupted ${soundInfo.tier} sound: ${soundId}`);
      }
    }
  }

  /**
   * Apply audio ducking to stream audio
   */
  private applyAudioDucking(duckingLevel: number): void {
    // Calculate new volume based on ducking level
    const duckingFactor = Math.pow(10, duckingLevel / 20); // Convert dB to linear
    const newVolume = this.streamAudioVolume * duckingFactor;

    // In production, this would adjust the actual stream audio volume
    console.log(`🔉 [GiftSoundEngine] Applying ducking: ${duckingLevel}dB (volume: ${newVolume.toFixed(2)})`);
  }

  /**
   * Restore stream audio to original volume
   */
  private restoreStreamAudio(): void {
    console.log('🔊 [GiftSoundEngine] Restoring stream audio');
    // In production, this would restore the stream audio volume
  }

  /**
   * Enable performance fallback mode
   */
  public enablePerformanceFallback(): void {
    this.performanceFallback = true;
    this.stopAllSounds();
    console.log('⚠️ [GiftSoundEngine] Performance fallback enabled');
  }

  /**
   * Disable performance fallback mode
   */
  public disablePerformanceFallback(): void {
    this.performanceFallback = false;
    console.log('✅ [GiftSoundEngine] Performance fallback disabled');
  }

  /**
   * Get active sounds count
   */
  public getActiveSoundsCount(): number {
    return this.activeSounds.size;
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    await this.stopAllSounds();
    this.initialized = false;
    console.log('🗑️ [GiftSoundEngine] Cleaned up');
  }
}

// Export singleton instance
export const giftSoundEngine = new GiftSoundEngine();
