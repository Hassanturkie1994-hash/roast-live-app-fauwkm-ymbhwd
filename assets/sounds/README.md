
# 🔊 Roast Gift Sound Files

## 📁 Directory Purpose

This directory contains sound files for the **NEW Roast Gift System**.

**Current Status**: ⚠️ **SOUNDS DISABLED**

---

## 🚨 IMPORTANT: Sounds Are Currently Disabled

Sound files are **NOT INCLUDED** in the repository to keep the app size small and avoid build errors.

To enable sounds, follow the instructions below.

---

## 🎵 How to Enable Sounds

### Step 1: Add Sound Files

Add the following `.mp3` files to this directory (`assets/sounds/`):

#### LOW TIER Sounds (1-10 SEK)
- `crowd_boo.mp3` - Crowd booing
- `crickets.mp3` - Cricket chirping
- `sad_trombone.mp3` - Sad trombone
- `facepalm.mp3` - Slap sound
- `yawn.mp3` - Yawning sound
- `clown_horn.mp3` - Clown horn
- `trash.mp3` - Trash dump sound
- `death.mp3` - Death sound
- `fart.mp3` - Fart sound
- `sigh.mp3` - Sigh sound
- `snore.mp3` - Snoring sound

#### MID TIER Sounds (20-100 SEK)
- `mic_drop.mp3` - Mic drop thud
- `airhorn.mp3` - Airhorn blast
- `crowd_roar.mp3` - Crowd roaring
- `boxing_bell.mp3` - Boxing bell
- `fire.mp3` - Fire whoosh
- `explosion.mp3` - Explosion boom
- `gasp.mp3` - Gasp sound
- `savage.mp3` - Savage sound
- `salt.mp3` - Salt pouring
- `tea_spill.mp3` - Tea spilling
- `cringe.mp3` - Cringe sound

#### HIGH TIER Sounds (150-500 SEK)
- `flamethrower.mp3` - Flamethrower
- `stamp.mp3` - Stamp slam
- `gavel.mp3` - Gavel bang
- `crown.mp3` - Crown fanfare
- `punch.mp3` - Knockout punch
- `bomb.mp3` - Bomb explosion
- `thunder.mp3` - Thunder crack
- `trophy.mp3` - Trophy win
- `hammer.mp3` - Hammer slam
- `sword.mp3` - Sword slash
- `shield.mp3` - Shield block

#### ULTRA TIER Sounds (700-4000 SEK)
- `earthquake.mp3` - Earthquake rumble
- `slow_mo.mp3` - Slow motion sound
- `spotlight.mp3` - Spotlight on
- `mute.mp3` - Mute sound
- `time_stop.mp3` - Time freeze
- `nuke.mp3` - Nuclear explosion
- `shame_bell.mp3` - Shame bell ringing
- `meteor.mp3` - Meteor impact
- `funeral.mp3` - Funeral march
- `riot.mp3` - Riot chaos
- `execution.mp3` - Execution sound
- `game_over.mp3` - Game over
- `apocalypse.mp3` - Apocalypse sound
- `dragon.mp3` - Dragon roar
- `siren.mp3` - Siren
- `crowd_chant.mp3` - Crowd chanting
- `church_bell.mp3` - Church bell
- `tomato_splat.mp3` - Tomato splat
- `sitcom_laugh.mp3` - Sitcom laugh track

### Step 2: Uncomment Sound Mappings

Edit `services/giftSoundEngine.ts` and uncomment the `SOUND_FILES` object:

```typescript
private readonly SOUND_FILES: Record<string, any> = {
  crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
  cricket_chirp: require('../assets/sounds/crickets.mp3'),
  // ... uncomment all sound mappings
};
```

### Step 3: Rebuild the App

```bash
npm start -- --clear
# or
expo start --clear
```

---

## 🎨 Sound Design Guidelines

### Tier-Based Sound Design

- **LOW TIER** (1-10 SEK): Short, simple sounds (< 500ms)
- **MID TIER** (20-100 SEK): Medium sounds with impact (< 1200ms)
- **HIGH TIER** (150-500 SEK): Dramatic sounds (< 3000ms)
- **ULTRA TIER** (700-4000 SEK): Epic, cinematic sounds (< 8000ms)

### Audio Ducking

The sound engine automatically ducks stream audio when playing gift sounds:

- **LOW TIER**: -6dB ducking
- **MID TIER**: -10dB ducking
- **HIGH TIER**: -14dB ducking
- **ULTRA TIER**: -20dB ducking

### Sound Interruption

- **ULTRA sounds** block all other sounds
- **HIGH sounds** interrupt LOW and MID sounds
- **LOW sounds** can be batched together

---

## 📦 Recommended Sound Sources

### Free Sound Libraries

1. **Freesound.org** - Creative Commons sounds
2. **Zapsplat.com** - Free sound effects
3. **Mixkit.co** - Free sound effects
4. **BBC Sound Effects** - Free for personal use

### Commercial Sound Libraries

1. **Epidemic Sound** - Subscription-based
2. **AudioJungle** - Pay-per-sound
3. **Soundstripe** - Subscription-based

---

## ⚠️ Legal Considerations

### Licensing

Ensure all sound files are:

- ✅ Royalty-free
- ✅ Licensed for commercial use
- ✅ Licensed for mobile app distribution
- ✅ Properly attributed (if required)

### Attribution

If sounds require attribution, add credits to:

```
app/screens/CreditsScreen.tsx
```

---

## 🔧 Technical Specifications

### File Format

- **Format**: MP3
- **Bitrate**: 128-192 kbps (recommended)
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono or Stereo

### File Size

- **LOW TIER**: < 50 KB
- **MID TIER**: < 100 KB
- **HIGH TIER**: < 200 KB
- **ULTRA TIER**: < 500 KB

### Naming Convention

Use lowercase with underscores:

```
crowd_boo.mp3
cricket_chirp.mp3
sad_trombone.mp3
```

---

## 🎯 Sound Engine Features

### Automatic Features

- ✅ Audio ducking (stream audio reduction)
- ✅ Priority management (ULTRA > HIGH > MID > LOW)
- ✅ Sound interruption (higher tiers interrupt lower)
- ✅ Performance fallback (disable sounds on low-end devices)
- ✅ Automatic cleanup (sounds unload after playback)

### Manual Controls

```typescript
// Enable performance fallback
giftSoundEngine.enablePerformanceFallback();

// Disable performance fallback
giftSoundEngine.disablePerformanceFallback();

// Stop all sounds
await giftSoundEngine.stopAllSounds();

// Get active sounds count
const count = giftSoundEngine.getActiveSoundsCount();
```

---

## 📊 Current Status

- ⚠️ **Sounds**: DISABLED (no .mp3 files)
- ✅ **Sound Engine**: ACTIVE (ready for sounds)
- ✅ **Sound Profiles**: DEFINED (45 gifts)
- ✅ **Audio Ducking**: ACTIVE
- ✅ **Priority System**: ACTIVE

---

## 🚀 Quick Enable

### Minimal Setup (3 sounds)

To quickly test the sound system, add just these 3 files:

1. `crowd_boo.mp3` - For LOW tier gifts
2. `airhorn.mp3` - For MID tier gifts
3. `nuke.mp3` - For ULTRA tier gifts

Then uncomment these lines in `services/giftSoundEngine.ts`:

```typescript
private readonly SOUND_FILES: Record<string, any> = {
  crowd_boo: require('../assets/sounds/crowd_boo.mp3'),
  airhorn_blast: require('../assets/sounds/airhorn.mp3'),
  nuke_explosion: require('../assets/sounds/nuke.mp3'),
};
```

---

**END OF README**
