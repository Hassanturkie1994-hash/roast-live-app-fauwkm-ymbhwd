
# Sound Design System, Battle Gifts, and Roast Ranking Seasons - Implementation Complete

## Overview

This implementation adds three major systems to the Roast Battles live streaming app:

1. **Gift Sound Engine** - Complete sound design system with audio ducking and priority management
2. **Battle Gift Service** - Battle-specific gift behaviors with context-aware routing
3. **Roast Ranking Seasons** - Seasonal ranking system with anti-whale logic

---

## 1. Gift Sound Engine

### Location
- `services/giftSoundEngine.ts`

### Features

#### Sound Tiers
- **LOW (1-10 SEK):** Max 0.5s, -6dB ducking, batchable
- **MID (20-100 SEK):** Max 1.2s, -10dB ducking
- **HIGH (150-500 SEK):** Max 3s, -14dB ducking, interrupts LOW/MID
- **ULTRA (2000-4000 SEK):** Max 8s, -20dB ducking, exclusive, cannot be skipped

#### Key Methods
```typescript
// Play sound with automatic ducking
await giftSoundEngine.playSound(soundProfile, tier);

// Stop specific sound
await giftSoundEngine.stopSound(soundId);

// Stop all sounds
await giftSoundEngine.stopAllSounds();

// Enable performance fallback
giftSoundEngine.enablePerformanceFallback();
```

#### Audio Ducking
- Automatically reduces stream audio volume based on gift tier
- Restores stream audio when sounds complete
- Prevents audio conflicts

#### Priority System
- ULTRA tier blocks all other sounds
- HIGH tier interrupts LOW/MID sounds
- LOW tier sounds can be batched

#### Performance Fallback
- Activates when FPS drops below 30
- Skips LOW tier sounds
- Enables silent playback mode
- Logs skipped gifts for analytics

---

## 2. Battle Gift Service

### Location
- `services/battleGiftService.ts`

### Features

#### Battle Context
```typescript
interface BattleContext {
  matchId: string;
  isInBattle: boolean;
  userTeam: 'team_a' | 'team_b' | null;
  opponentTeam: 'team_a' | 'team_b' | null;
}
```

#### Battle-Specific Gifts

**Silence Button (1000 SEK)**
- Temporarily mutes opponent audio locally (10s)
- Visual countdown overlay
- Does NOT mute stream globally
- Crowd boo sound effect

**Spotlight Shame (900 SEK)**
- Zoom spotlight on losing creator
- Crowd boo sound
- Temporary UI emphasis (5s)

**Final Blow (3500 SEK)**
- Ends battle immediately
- Triggers cinematic outro
- Locks UI
- Game over sound

#### Key Methods
```typescript
// Set battle context
battleGiftService.setBattleContext(context);

// Route gift with battle logic
const { allowed, behavior } = await battleGiftService.routeGift(
  giftId,
  senderId,
  receiverTeam,
  amountSek
);

// Check if in battle
const inBattle = battleGiftService.isInBattle();
```

#### Rules
- Battle gifts override normal gifts
- Battle gifts have higher priority
- Battle gifts only available during battles
- Safe fallback if battle ends mid-animation

---

## 3. Roast Ranking Seasons

### Location
- `services/roastRankingService.ts`

### Database Tables

#### `roast_ranking_seasons`
- `season_number` - Sequential season number
- `start_date` - Season start date
- `end_date` - Season end date
- `duration_days` - Season duration (14 or 30 days)
- `status` - active | completed | upcoming

#### `roast_ranking_entries`
- `season_id` - Reference to season
- `creator_id` - Creator being ranked
- `rank` - Current rank in season
- `composite_score` - Calculated score (0-100)
- `battles_won` - Number of battles won
- `battles_participated` - Total battles participated
- `total_gifts_received_sek` - Total gifts received
- `unique_roasters_count` - Number of unique roasters
- `crowd_hype_peaks` - Number of hype moments
- `region` - global | regional

#### `roast_ranking_unique_roasters`
- Tracks unique roasters per creator per season
- Prevents whale dominance

### Ranking Algorithm

#### Composite Score Calculation
```typescript
compositeScore = 
  normalizedBattlesWon * 0.35 +           // 35% - Winning battles
  normalizedBattlesParticipated * 0.15 +  // 15% - Participation
  normalizedGifts * 0.20 +                // 20% - Gifts (logarithmic)
  normalizedUniqueRoasters * 0.20 +       // 20% - Unique roasters
  normalizedCrowdHype * 0.10;             // 10% - Crowd hype
```

#### Anti-Whale Logic
- Gifts use logarithmic scaling: `log10(giftsReceivedSek + 1) / 4`
- Unique roasters weighted equally to gift amount
- Prevents single whale from dominating rankings

#### Key Methods
```typescript
// Get current season
const season = await roastRankingService.getCurrentSeason();

// Get season rankings
const rankings = await roastRankingService.getSeasonRankings(
  seasonId,
  region,
  limit
);

// Get user ranking
const userRank = await roastRankingService.getUserRanking(userId);

// Update creator stats
await roastRankingService.updateCreatorStats(creatorId, {
  battlesWon: 1,
  giftsReceivedSek: 100,
  uniqueRoaster: roasterId,
  crowdHypePeak: true,
});

// Create new season (admin only)
const newSeason = await roastRankingService.createSeason(14);
```

### Season Properties
- **Fixed Duration:** 14 or 30 days
- **Global and Regional Rankings:** Separate leaderboards
- **Seasonal Reset:** No lifetime stacking
- **Fair Competition:** New creators have equal chance each season

---

## 4. Integration

### Roast Gift Service Integration

The main `roastGiftService` integrates all three systems:

```typescript
// Send gift with full integration
const result = await roastGiftService.sendGift(
  giftId,
  senderId,
  creatorId,
  streamId
);

// Automatically:
// 1. Routes through battle service if in battle
// 2. Plays sound via sound engine
// 3. Updates creator stats
// 4. Updates ranking stats
// 5. Broadcasts animation via realtime
```

### Creator Earnings
```typescript
const earnings = await roastGiftService.getCreatorEarnings(creatorId);
// Returns:
// - totalEarnedSek
// - platformCut (30%)
// - creatorPayout (70%)
// - totalGifts
```

### Top Roasters
```typescript
const topRoasters = await roastGiftService.getTopRoasters(streamId, 3);
// Returns top 3 roasters by total SEK spent
```

### Most Brutal Gift
```typescript
const mostBrutal = await roastGiftService.getMostBrutalGift(streamId);
// Returns highest value gift sent in stream
```

---

## 5. Sound Assets

### Directory Structure
```
assets/sounds/
├── README.md
├── LOW TIER/
│   ├── crowd_boo.mp3
│   ├── crickets.mp3
│   ├── sad_trombone.mp3
│   └── ...
├── MID TIER/
│   ├── airhorn.mp3
│   ├── laugh_explosion.mp3
│   ├── mic_drop.mp3
│   └── ...
├── HIGH TIER/
│   ├── fire_blast.mp3
│   ├── judge_gavel.mp3
│   ├── thunder_crack.mp3
│   └── ...
└── ULTRA TIER/
    ├── funeral_choir.mp3
    ├── riot_sirens.mp3
    ├── epic_bass_drop.mp3
    └── ...
```

### Audio Specifications
- **Format:** MP3
- **Sample Rate:** 44.1 kHz
- **Bit Rate:** 128-192 kbps
- **Channels:** Stereo
- **Normalization:** -3 dB peak

### Preloading
All sounds are preloaded before live stream starts to ensure:
- No latency during playback
- Smooth transitions
- No frame drops

---

## 6. Performance Considerations

### Sound Engine
- Maximum 5 concurrent sounds
- Automatic cleanup after playback
- Performance fallback at <30 FPS
- Logs skipped gifts for analytics

### Battle Service
- Lightweight context tracking
- Efficient timer management
- Safe fallback if battle ends

### Ranking Service
- Server-side rank calculation
- Indexed database queries
- Efficient aggregation

---

## 7. Realtime Channels

### Gift Animations
```typescript
// Channel: roast_gifts:{stream_id}
// Event: gift_sent
{
  giftId: string,
  senderId: string,
  creatorId: string,
  timestamp: number
}
```

### Creator Stats
```typescript
// Channel: roast_creator_stats:{creator_id}
// Event: stats_updated
{
  totalEarnedSek: number,
  totalGifts: number
}
```

---

## 8. Monetization Rules

### Platform Split
- **Platform Fee:** 30%
- **Creator Payout:** 70%
- **No Refunds:** After confirmation
- **Animation ≠ Payment:** Animation success not tied to payment

### Anti-Abuse
- **ULTRA Cooldown:** 60 seconds per sender
- **Self-Gifting Detection:** Flagged but not blocked
- **Diminishing Returns:** After 10 gifts from same sender
- **Performance Monitoring:** Skips gifts before dropping frames

---

## 9. Testing

### Sound Engine Testing
```typescript
// Test sound playback
await giftSoundEngine.playSound('airhorn_blast', 'MID');

// Test interruption
await giftSoundEngine.playSound('crowd_boo', 'LOW');
await giftSoundEngine.playSound('game_over', 'ULTRA'); // Interrupts LOW

// Test performance fallback
giftSoundEngine.enablePerformanceFallback();
await giftSoundEngine.playSound('airhorn_blast', 'MID'); // Skipped
```

### Battle Service Testing
```typescript
// Set battle context
battleGiftService.setBattleContext({
  matchId: 'match-123',
  isInBattle: true,
  userTeam: 'team_a',
  opponentTeam: 'team_b',
});

// Test battle gift
const result = await battleGiftService.routeGift(
  'silence_button',
  'user-123',
  'team_b',
  1000
);
```

### Ranking Service Testing
```typescript
// Create test season
const season = await roastRankingService.createSeason(14);

// Update stats
await roastRankingService.updateCreatorStats('creator-123', {
  battlesWon: 1,
  giftsReceivedSek: 500,
});

// Get rankings
const rankings = await roastRankingService.getSeasonRankings(season.id);
```

---

## 10. Next Steps

### UI Implementation
- Create sound visualization components
- Implement battle gift overlays
- Build ranking leaderboard screens
- Add countdown timers for battle gifts

### Sound Assets
- Record/purchase all sound files
- Normalize audio levels
- Test on different devices
- Optimize file sizes

### Server-Side Jobs
- Scheduled rank recalculation
- Season creation automation
- Performance monitoring
- Analytics aggregation

### Analytics
- Track gift usage patterns
- Monitor sound performance
- Analyze ranking engagement
- Measure battle participation

---

## Summary

This implementation provides a complete sound design system, battle-specific gift behaviors, and a seasonal ranking system for the Roast Battles live streaming app. All systems are integrated and ready for UI implementation and sound asset production.

**Key Features:**
- ✅ Priority-based sound playback with audio ducking
- ✅ Battle-specific gift behaviors (Silence, Spotlight, Final Blow)
- ✅ Seasonal rankings with anti-whale logic
- ✅ Performance monitoring and fallbacks
- ✅ Monetization-safe rules
- ✅ Realtime integration
- ✅ Database schema with RLS policies

**Status:** Ready for production with sound assets and UI components.
