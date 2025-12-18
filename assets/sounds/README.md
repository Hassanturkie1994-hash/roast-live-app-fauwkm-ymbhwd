
# Roast Gift Sound System

This directory contains all sound files for the Roast Gift System.

## Sound Philosophy

Sound is as important as animation. Sounds must amplify humiliation, drama, hype, and crowd energy.

## Sound Categories

### LOW TIER (1-10 SEK)
**Max Duration:** 0.5s  
**Ducking:** -6 dB  
**Can Batch:** Yes  
**Can Be Interrupted:** Yes

- `crowd_boo.mp3` - Classic crowd disapproval
- `crickets.mp3` - Awkward silence
- `sad_trombone.mp3` - Classic fail sound
- `facepalm.mp3` - Slap sound for disappointment
- `tomato_splat.mp3` - Rotten tomato throw
- `sitcom_laugh.mp3` - Fake laughter track
- `yawn.mp3` - So boring...
- `clown_horn.mp3` - You're a joke
- `trash_dump.mp3` - Garbage take
- `death.mp3` - You killed it (badly)
- `fart.mp3` - That was crap
- `sigh.mp3` - Seriously?
- `snore.mp3` - Put me to sleep

### MID TIER (20-100 SEK)
**Max Duration:** 1.2s  
**Ducking:** -10 dB  
**Can Batch:** No  
**Can Be Interrupted:** Yes

- `mic_drop.mp3` - Drop the mic on them
- `airhorn.mp3` - Loud and obnoxious
- `laugh_explosion.mp3` - Uncontrollable laughter
- `boxing_bell.mp3` - Round 1, fight!
- `fire_whoosh.mp3` - That was fire
- `explosion.mp3` - Mind blown
- `gasp.mp3` - Oh no they didn't
- `savage.mp3` - Absolutely savage
- `salt_pour.mp3` - So salty
- `tea_spill.mp3` - Spill the tea
- `cringe.mp3` - So cringe

### HIGH TIER (150-500 SEK)
**Max Duration:** 2-3s  
**Ducking:** -14 dB  
**Can Batch:** No  
**Can Be Interrupted:** No (interrupts LOW/MID)

- `fire_blast.mp3` - Burn them to ashes
- `stamp_slam.mp3` - Officially rejected
- `judge_gavel.mp3` - Guilty as charged
- `crown_fanfare.mp3` - King of roasts
- `punch_knockout.mp3` - Knocked out cold
- `bomb_explosion.mp3` - Dropped a bomb
- `alarm_siren.mp3` - Struck by lightning
- `trophy_win.mp3` - Champion roaster
- `hammer_slam.mp3` - Hammer them down
- `sword_slash.mp3` - Slice through their argument
- `shield_block.mp3` - Block their roast

### ULTRA TIER (2000-4000 SEK)
**Max Duration:** 5-8s  
**Ducking:** -20 dB (Full)  
**Can Batch:** No  
**Can Be Interrupted:** No (Exclusive playback, cannot be skipped)

- `funeral_choir.mp3` - Play funeral music
- `riot_sirens.mp3` - Start a riot
- `epic_bass_drop.mp3` - Game over
- `siren.mp3` - Roast execution siren
- `church_bell.mp3` - Funeral bell
- `crowd_chant.mp3` - Crowd chanting
- `earthquake_rumble.mp3` - Shake the whole screen
- `slow_motion.mp3` - Epic slow-mo moment
- `spotlight_on.mp3` - Put them in the spotlight
- `mute_sound.mp3` - Silence them
- `time_stop.mp3` - Freeze time
- `nuke_explosion.mp3` - Nuclear roast
- `shame_bell_ring.mp3` - Shame! Shame! Shame!
- `meteor_impact.mp3` - Meteor strike
- `execution_sound.mp3` - Execute the roast
- `apocalypse_sound.mp3` - End of the world
- `dragon_roar.mp3` - Unleash the dragon

## System Rules

1. **All sounds are played locally on device** - No sound data is sent in the stream
2. **Sounds are metadata-triggered** - Gift events trigger sound playback
3. **Sounds must be preloaded before live starts** - No runtime loading
4. **Sounds must respect audio ducking rules** - Stream audio is ducked based on tier
5. **Priority-based interruption** - Higher tier sounds can interrupt lower tier sounds
6. **Performance fallback** - If FPS drops, sounds are skipped gracefully

## Audio Ducking

Audio ducking reduces the stream audio volume when gift sounds play:

- **LOW:** -6 dB (minimal ducking)
- **MID:** -10 dB (moderate ducking)
- **HIGH:** -14 dB (strong ducking)
- **ULTRA:** -20 dB (full ducking)

## Implementation

The sound system is implemented in `services/giftSoundEngine.ts` and uses `expo-av` for audio playback.

### Usage

```typescript
import { giftSoundEngine } from '@/services/giftSoundEngine';

// Initialize (call once at app start)
await giftSoundEngine.initialize();

// Play a sound
await giftSoundEngine.playSound('crowd_boo', 'LOW');

// Stop a sound
await giftSoundEngine.stopSound('crowd_boo');

// Stop all sounds
await giftSoundEngine.stopAllSounds();

// Enable performance fallback
giftSoundEngine.enablePerformanceFallback();

// Cleanup
await giftSoundEngine.cleanup();
```

## File Format

All sound files should be:
- **Format:** MP3
- **Sample Rate:** 44.1 kHz
- **Bit Rate:** 128-192 kbps
- **Channels:** Stereo or Mono
- **Normalized:** -3 dB peak to prevent clipping

## Adding New Sounds

1. Add the sound file to this directory
2. Update `SOUND_FILES` mapping in `services/giftSoundEngine.ts`
3. Update this README with the new sound description
4. Test the sound in the app to ensure proper ducking and timing
