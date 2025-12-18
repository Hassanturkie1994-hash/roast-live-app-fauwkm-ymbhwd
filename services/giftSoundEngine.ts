
/**
 * Gift Sound Engine
 * 
 * Handles all sound playback for roast gifts with audio ducking and priority management.
 * All sounds are played locally on device, no sound data is sent in the stream.
 * 
 * Philosophy:
 * Sound is as important as animation.
 * Sounds must amplify humiliation, drama, hype, and crowd energy.
 * 
 * NOTE: Sound files are currently disabled. To enable:
 * 1. Add .mp3 files to assets/sounds/ directory
 * 2. Uncomment the SOUND_FILES mappings below
 * 3. Rebuild the app
 */

import { Audio } from 'expo-av';

export type SoundTier = 'LOW' | 'MID' | 'HIGH' | 'ULTRA';

export interface SoundProfile {
  soundId: string;
  tier: SoundTier;
  duration: number;
  duckingLevel: number;
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
  private soundQueue: string[] = [];
  private isProcessing: boolean = false;
  private streamAudioVolume: number = 1.0;
  private performanceFallback: boolean = false;
  private initialized: boolean = false;

  private readonly TIER_CONFIG: Record<SoundTier, { maxDuration: number; ducking: number; priority: number }> = {
    LOW: { maxDuration: 500, ducking: -6, priority: 1 },
    MID: { maxDuration: 1200, ducking: -10, priority: 2 },
    HIGH: { maxDuration: 3000, ducking: -14, priority: 3 },
    ULTRA: { maxDuration: 8000, ducking: -20, priority: 4 },
  };

  private readonly SOUND_FILES: Record<string, any> = {
    // Sound files are currently disabled
    // To enable sounds:
    // 1. Add .mp3 files to assets/sounds/ directory
    // 2. Uncomment the require() statements below
    // 3. Rebuild the app
    
    // Example:
    // crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
    // cricket_chirp: require('../assets/sounds/crickets.mp3'),
  };

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

    if (this.hasActiveSoundOfTier('ULTRA') && tier !== 'ULTRA') {
      console.log('⚠️ [GiftSoundEngine] ULTRA sound active, blocking', soundProfile);
      return;
    }

    if (tier === 'HIGH' || tier === 'ULTRA') {
      this.interruptLowerTierSounds(tier);
    }

    this.applyAudioDucking(config.ducking);

    try {
      const soundFile = this.SOUND_FILES[soundProfile];
      if (!soundFile) {
        console.warn('⚠️ [GiftSoundEngine] Sound file not found or not loaded:', soundProfile);
        console.log('💡 [GiftSoundEngine] To enable sounds, add .mp3 files to assets/sounds/ and uncomment SOUND_FILES mappings');
        this.restoreStreamAudio();
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

      setTimeout(() => {
        this.stopSound(soundProfile);
      }, config.maxDuration);

      console.log(`🔊 [GiftSoundEngine] Playing sound: ${soundProfile} (${tier})`);
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Error playing sound:', error);
      this.restoreStreamAudio();
    }
  }

  public async stopSound(soundId: string): Promise<void> {
    const soundInfo = this.activeSounds.get(soundId);
    if (!soundInfo) {
      return;
    }

    try {
      await soundInfo.sound.unloadAsync();
      this.activeSounds.delete(soundId);

      if (this.activeSounds.size === 0) {
        this.restoreStreamAudio();
      }

      console.log(`🔇 [GiftSoundEngine] Stopped sound: ${soundId}`);
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Error stopping sound:', error);
    }
  }

  public async stopAllSounds(): Promise<void> {
    const soundIds = Array.from(this.activeSounds.keys());
    for (const soundId of soundIds) {
      await this.stopSound(soundId);
    }
    this.restoreStreamAudio();
  }

  private hasActiveSoundOfTier(tier: SoundTier): boolean {
    for (const soundInfo of this.activeSounds.values()) {
      if (soundInfo.tier === tier) {
        return true;
      }
    }
    return false;
  }

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

  private applyAudioDucking(duckingLevel: number): void {
    const duckingFactor = Math.pow(10, duckingLevel / 20);
    const newVolume = this.streamAudioVolume * duckingFactor;
    console.log(`🔉 [GiftSoundEngine] Applying ducking: ${duckingLevel}dB (volume: ${newVolume.toFixed(2)})`);
  }

  private restoreStreamAudio(): void {
    console.log('🔊 [GiftSoundEngine] Restoring stream audio');
  }

  public enablePerformanceFallback(): void {
    this.performanceFallback = true;
    this.stopAllSounds();
    console.log('⚠️ [GiftSoundEngine] Performance fallback enabled');
  }

  public disablePerformanceFallback(): void {
    this.performanceFallback = false;
    console.log('✅ [GiftSoundEngine] Performance fallback disabled');
  }

  public getActiveSoundsCount(): number {
    return this.activeSounds.size;
  }

  public async cleanup(): Promise<void> {
    await this.stopAllSounds();
    this.initialized = false;
    console.log('🗑️ [GiftSoundEngine] Cleaned up');
  }
}

export const giftSoundEngine = new GiftSoundEngine();
