
/**
 * Gift Sound Engine
 * 
 * Manages sound playback for gift animations.
 * Handles sound loading, caching, and playback.
 */

import { Audio } from 'expo-av';

type SoundProfile = string;
type GiftTier = 'LOW' | 'MID' | 'HIGH' | 'ULTRA';

class GiftSoundEngine {
  private sounds: Map<string, Audio.Sound> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔊 [GiftSoundEngine] Initializing...');

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.initialized = true;
      console.log('✅ [GiftSoundEngine] Initialized successfully');
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Initialization error:', error);
    }
  }

  async playSound(soundProfile: SoundProfile, tier: GiftTier): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🔊 [GiftSoundEngine] Playing sound: ${soundProfile} (${tier})`);

    try {
      // Check if sound is already loaded
      let sound = this.sounds.get(soundProfile);

      if (!sound) {
        // Load sound (placeholder - actual sound files would be loaded here)
        console.log(`📦 [GiftSoundEngine] Loading sound: ${soundProfile}`);
        // For now, just log - actual implementation would load from assets
        return;
      }

      // Play sound
      await sound.replayAsync();
    } catch (error) {
      console.error('❌ [GiftSoundEngine] Error playing sound:', error);
    }
  }

  cleanup(): void {
    console.log('🗑️ [GiftSoundEngine] Cleaning up...');

    this.sounds.forEach(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
    });

    this.sounds.clear();
    this.initialized = false;
  }
}

export const giftSoundEngine = new GiftSoundEngine();
