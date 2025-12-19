
# 🔊 Sound Files Setup Guide

## 📋 Overview

This guide explains how to add sound files to your Roast Live app.

**Current Status**: ⚠️ **SOUNDS DISABLED** (to avoid build errors)

**Optional**: You can enable sounds later when you have the audio files ready.

---

## 🎯 Why Are Sounds Disabled?

Sounds are disabled by default because:

1. ✅ **Prevents build errors** - No missing file errors
2. ✅ **Smaller app size** - No audio files in bundle
3. ✅ **Faster development** - Can test app without sounds
4. ✅ **Optional feature** - Sounds are nice-to-have, not required

---

## 🚀 OPTION 1: Keep Sounds Disabled (Recommended for Now)

### What Happens

- ✅ App works perfectly without sounds
- ✅ Gift animations still play
- ✅ No build errors
- ✅ Smaller app size

### Console Output

When a gift is sent:

```
⚠️ [GiftSoundEngine] Sound file not found or not loaded: crowd_boo
💡 [GiftSoundEngine] To enable sounds, add .mp3 files to assets/sounds/ and uncomment SOUND_FILES mappings
```

This is **EXPECTED** and **NOT AN ERROR**.

---

## 🎵 OPTION 2: Enable Sounds (When Ready)

### Step 1: Create Sound Files Directory

```bash
mkdir -p assets/sounds
```

### Step 2: Add Sound Files

Add `.mp3` files to `assets/sounds/` directory.

**Minimum Required** (for testing):

```
assets/sounds/
├── crowd_boo.mp3          # LOW tier
├── airhorn.mp3            # MID tier
├── nuke.mp3               # ULTRA tier
```

**Full Set** (45 sounds):

See `assets/sounds/README.md` for complete list.

### Step 3: Uncomment Sound Mappings

Edit `services/giftSoundEngine.ts`:

**Find this section** (around line 51):

```typescript
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
```

**Change to**:

```typescript
private readonly SOUND_FILES: Record<string, any> = {
  // LOW TIER (1-10 SEK)
  crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
  cricket_chirp: require('../assets/sounds/crickets.mp3'),
  sad_trombone: require('../assets/sounds/sad_trombone.mp3'),
  slap_sound: require('../assets/sounds/facepalm.mp3'),
  yawn_sound: require('../assets/sounds/yawn.mp3'),
  clown_horn: require('../assets/sounds/clown_horn.mp3'),
  trash_dump: require('../assets/sounds/trash.mp3'),
  death_sound: require('../assets/sounds/death.mp3'),
  fart_sound: require('../assets/sounds/fart.mp3'),
  sigh_sound: require('../assets/sounds/sigh.mp3'),
  snore_sound: require('../assets/sounds/snore.mp3'),
  
  // MID TIER (20-100 SEK)
  mic_drop_thud: require('../assets/sounds/mic_drop.mp3'),
  airhorn_blast: require('../assets/sounds/airhorn.mp3'),
  crowd_roar: require('../assets/sounds/crowd_roar.mp3'),
  boxing_bell: require('../assets/sounds/boxing_bell.mp3'),
  fire_whoosh: require('../assets/sounds/fire.mp3'),
  explosion_boom: require('../assets/sounds/explosion.mp3'),
  gasp_sound: require('../assets/sounds/gasp.mp3'),
  savage_sound: require('../assets/sounds/savage.mp3'),
  salt_pour: require('../assets/sounds/salt.mp3'),
  tea_spill: require('../assets/sounds/tea_spill.mp3'),
  cringe_sound: require('../assets/sounds/cringe.mp3'),
  
  // HIGH TIER (150-500 SEK)
  flamethrower: require('../assets/sounds/flamethrower.mp3'),
  stamp_slam: require('../assets/sounds/stamp.mp3'),
  gavel_bang: require('../assets/sounds/gavel.mp3'),
  crown_fanfare: require('../assets/sounds/crown.mp3'),
  punch_knockout: require('../assets/sounds/punch.mp3'),
  bomb_explosion: require('../assets/sounds/bomb.mp3'),
  thunder_crack: require('../assets/sounds/thunder.mp3'),
  trophy_win: require('../assets/sounds/trophy.mp3'),
  hammer_slam: require('../assets/sounds/hammer.mp3'),
  sword_slash: require('../assets/sounds/sword.mp3'),
  shield_block: require('../assets/sounds/shield.mp3'),
  
  // ULTRA TIER (700-4000 SEK)
  earthquake_rumble: require('../assets/sounds/earthquake.mp3'),
  slow_motion: require('../assets/sounds/slow_mo.mp3'),
  spotlight_on: require('../assets/sounds/spotlight.mp3'),
  mute_sound: require('../assets/sounds/mute.mp3'),
  time_stop: require('../assets/sounds/time_stop.mp3'),
  nuke_explosion: require('../assets/sounds/nuke.mp3'),
  shame_bell_ring: require('../assets/sounds/shame_bell.mp3'),
  meteor_impact: require('../assets/sounds/meteor.mp3'),
  funeral_march: require('../assets/sounds/funeral.mp3'),
  riot_chaos: require('../assets/sounds/riot.mp3'),
  execution_sound: require('../assets/sounds/execution.mp3'),
  game_over: require('../assets/sounds/game_over.mp3'),
  apocalypse_sound: require('../assets/sounds/apocalypse.mp3'),
  dragon_roar: require('../assets/sounds/dragon.mp3'),
  siren: require('../assets/sounds/siren.mp3'),
  crowd_chant: require('../assets/sounds/crowd_chant.mp3'),
  church_bell: require('../assets/sounds/church_bell.mp3'),
  tomato_splat: require('../assets/sounds/tomato_splat.mp3'),
  sitcom_laugh: require('../assets/sounds/sitcom_laugh.mp3'),
};
```

### Step 4: Rebuild the App

```bash
expo start --clear
```

### Step 5: Test Sounds

1. Send a gift
2. Listen for sound playback
3. Check console logs

### Expected Console Output

```
🔊 [GiftSoundEngine] Playing sound: crowd_boo (LOW)
🔉 [GiftSoundEngine] Applying ducking: -6dB (volume: 0.50)
🔇 [GiftSoundEngine] Stopped sound: crowd_boo
🔊 [GiftSoundEngine] Restoring stream audio
```

---

## 📦 WHERE TO GET SOUND FILES

### Free Sources

1. **Freesound.org**
   - Search for: "crowd boo", "airhorn", "explosion"
   - Filter: Creative Commons license
   - Download as MP3

2. **Zapsplat.com**
   - Free sound effects library
   - No attribution required for standard license
   - Download as MP3

3. **Mixkit.co**
   - Free sound effects
   - No attribution required
   - Download as MP3

### Commercial Sources

1. **Epidemic Sound** ($15/month)
2. **AudioJungle** ($1-5 per sound)
3. **Soundstripe** ($15/month)

---

## 🎨 SOUND DESIGN TIPS

### Tier Guidelines

**LOW TIER** (1-10 SEK):
- Short, simple sounds
- Duration: < 500ms
- Examples: Boo, crickets, yawn

**MID TIER** (20-100 SEK):
- Medium impact sounds
- Duration: < 1200ms
- Examples: Airhorn, mic drop, explosion

**HIGH TIER** (150-500 SEK):
- Dramatic sounds
- Duration: < 3000ms
- Examples: Flamethrower, gavel, thunder

**ULTRA TIER** (700-4000 SEK):
- Epic, cinematic sounds
- Duration: < 8000ms
- Examples: Nuke, funeral march, apocalypse

### Audio Specifications

- **Format**: MP3
- **Bitrate**: 128-192 kbps
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono (recommended) or Stereo
- **File Size**: 
  - LOW: < 50 KB
  - MID: < 100 KB
  - HIGH: < 200 KB
  - ULTRA: < 500 KB

---

## 🔧 TESTING SOUNDS

### Test Individual Sound

```typescript
import { giftSoundEngine } from '@/services/giftSoundEngine';

// Initialize
await giftSoundEngine.initialize();

// Play sound
await giftSoundEngine.playSound('crowd_boo', 'LOW');

// Stop sound
await giftSoundEngine.stopSound('crowd_boo');

// Stop all sounds
await giftSoundEngine.stopAllSounds();
```

### Test Audio Ducking

1. Start a live stream
2. Send a LOW tier gift → Stream audio ducks -6dB
3. Send a MID tier gift → Stream audio ducks -10dB
4. Send a HIGH tier gift → Stream audio ducks -14dB
5. Send an ULTRA tier gift → Stream audio ducks -20dB

### Test Sound Interruption

1. Send a LOW tier gift (plays for 500ms)
2. Immediately send a HIGH tier gift
3. LOW tier sound should be interrupted
4. HIGH tier sound should play

---

## ⚠️ COMMON ISSUES

### Issue: "Unable to resolve module"

**Cause**: Sound file doesn't exist

**Fix**: 
1. Verify file exists in `assets/sounds/`
2. Check file name matches exactly
3. Rebuild app: `expo start --clear`

### Issue: "Sound doesn't play"

**Cause**: Audio permissions or initialization

**Fix**:
1. Check console for errors
2. Verify `giftSoundEngine.initialize()` was called
3. Check device volume is not muted

### Issue: "Sound plays but stream audio doesn't duck"

**Cause**: Audio ducking not supported on platform

**Fix**: This is expected on some platforms (web). Audio ducking works best on iOS and Android.

---

## 📊 SOUND ENGINE FEATURES

### Automatic Features

- ✅ **Audio Ducking** - Stream audio reduces when gift sound plays
- ✅ **Priority Management** - ULTRA > HIGH > MID > LOW
- ✅ **Sound Interruption** - Higher tiers interrupt lower tiers
- ✅ **Performance Fallback** - Disable sounds on low-end devices
- ✅ **Automatic Cleanup** - Sounds unload after playback

### Manual Controls

```typescript
// Enable performance fallback (disable sounds)
giftSoundEngine.enablePerformanceFallback();

// Disable performance fallback (enable sounds)
giftSoundEngine.disablePerformanceFallback();

// Get active sounds count
const count = giftSoundEngine.getActiveSoundsCount();

// Cleanup
await giftSoundEngine.cleanup();
```

---

## 🎯 QUICK START (3 Sounds)

Want to quickly test the sound system? Add just these 3 files:

### Files Needed

1. `assets/sounds/crowd_boo.mp3` - For LOW tier gifts
2. `assets/sounds/airhorn.mp3` - For MID tier gifts
3. `assets/sounds/nuke.mp3` - For ULTRA tier gifts

### Code Changes

Edit `services/giftSoundEngine.ts`:

```typescript
private readonly SOUND_FILES: Record<string, any> = {
  crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
  airhorn_blast: require('../assets/sounds/airhorn.mp3'),
  nuke_explosion: require('../assets/sounds/nuke.mp3'),
};
```

### Rebuild

```bash
expo start --clear
```

### Test

1. Send a LOW tier gift → Hear "crowd_boo"
2. Send a MID tier gift → Hear "airhorn"
3. Send an ULTRA tier gift → Hear "nuke"

---

## 📚 ADDITIONAL RESOURCES

### Documentation

- `assets/sounds/README.md` - Sound file requirements
- `services/giftSoundEngine.ts` - Sound engine implementation
- `constants/RoastGiftManifest.ts` - Gift catalog with sound profiles

### Sound Profiles

Each gift has a `soundProfile` property:

```typescript
{
  giftId: 'roast_nuke',
  displayName: 'Roast Nuke',
  priceSEK: 1200,
  tier: 'ULTRA',
  soundProfile: 'nuke_explosion', // ← Maps to sound file
}
```

---

## 🎊 SUMMARY

### Current Status

- ⚠️ **Sounds**: DISABLED (no errors)
- ✅ **Sound Engine**: READY (waiting for files)
- ✅ **Sound Profiles**: DEFINED (45 gifts)
- ✅ **App**: WORKING (without sounds)

### To Enable Sounds

1. Add `.mp3` files to `assets/sounds/`
2. Uncomment `require()` statements in `services/giftSoundEngine.ts`
3. Rebuild app: `expo start --clear`

### Recommendation

**Keep sounds disabled for now** and enable them later when you have professional audio files ready.

The app works perfectly without sounds! 🎉

---

**END OF SOUND FILES SETUP GUIDE**
