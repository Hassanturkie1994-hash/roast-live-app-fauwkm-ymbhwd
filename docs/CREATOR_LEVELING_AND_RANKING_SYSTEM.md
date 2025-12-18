
# Creator Leveling & Roast Ranking Seasons System

## Overview

This document describes the complete implementation of the Creator Leveling & Perks system and the Roast Ranking Seasons system for the Roast Live streaming platform.

## Table of Contents

1. [Creator Leveling System](#creator-leveling-system)
2. [Roast Ranking Seasons](#roast-ranking-seasons)
3. [Database Schema](#database-schema)
4. [Services](#services)
5. [UI Components](#ui-components)
6. [Integration Points](#integration-points)
7. [Moderation & Safety](#moderation--safety)

---

## Creator Leveling System

### Concept

Creators level up based on:
- Total confirmed gift value earned
- Roast battles participated in
- Unique viewers engaged
- Season participation

### Level System

- **Levels:** 1–50
- **XP Curve:** Exponential (base_xp * 1.15^(level-1))
- **Level 1→2:** 1,000 XP
- **Level 49→50:** ~1,000,000 XP
- **Levels never reset**
- **Separate from seasonal ranks**

### XP Sources

#### 1. Gifts Received (Weighted by Tier)
- **Formula:** `gift_value_sek * 10`
- **Trigger:** When `roast_gift_transactions.status = 'CONFIRMED'`
- **Example:** 100 SEK gift = 1,000 XP

#### 2. Battle Wins
- **1v1:** 500 XP (1000 XP if won)
- **2v2:** 400 XP (800 XP if won)
- **3v3:** 350 XP (700 XP if won)
- **4v4:** 300 XP (600 XP if won)
- **5v5:** 250 XP (500 XP if won)
- **Trigger:** When `battle_team_matches.status = 'completed'`

#### 3. Stream Duration Milestones
- **Formula:** `floor(duration_minutes / 30) * 100`
- **Example:** 90-minute stream = 300 XP
- **Trigger:** When stream ends

#### 4. Seasonal Participation
- **Top 10:** 10,000 XP
- **Top 50:** 5,000 XP
- **Top 100:** 2,500 XP
- **Others:** 1,000 XP
- **Trigger:** When seasonal rewards are granted

### Perks by Level

| Level | Perk | Type | Description |
|-------|------|------|-------------|
| 5 | Custom Stream Intro Sound | Cosmetic | Unlock a custom intro sound |
| 10 | Animated Profile Frame | Cosmetic | Add an animated frame to profile |
| 15 | Exclusive Roast Gift: Bronze Flame | Cosmetic | Unlock Bronze Flame gift |
| 20 | Exclusive Roast Gift: Silver Flame | Cosmetic | Unlock Silver Flame gift |
| 25 | Custom Stream Intro Sound II | Cosmetic | Second custom intro sound |
| 30 | Battle Priority Placement | Priority | Priority in battle matchmaking |
| 35 | Animated Profile Frame II | Cosmetic | Second animated frame option |
| 40 | Advanced Analytics Access | Analytics | Detailed analytics and insights |
| 45 | Exclusive Roast Gift: Gold Flame | Cosmetic | Unlock Gold Flame gift |
| 50 | Legendary Roast Title | Cosmetic | Display Legendary Roaster title |

### Rules

- **No monetization advantage** - Perks are cosmetic or UX-based only
- **Levels never reset** - Permanent progression
- **Separate from seasonal ranks** - Independent systems
- **XP NOT affected by animation success** - Only confirmed transactions count

---

## Roast Ranking Seasons

### Concept

Roast Rankings reset on seasons. Each season rewards creators for:
- Being roasted (receiving gifts)
- Winning battles
- Generating hype and engagement
- **NOT just raw money**

### Season Properties

- **Fixed duration:** 14 or 30 days (configurable)
- **Global and regional rankings**
- **Seasonal reset:** No lifetime stacking
- **Status:** ACTIVE | ENDED

### Season Score Formula

```
SeasonScore =
  (IndividualWeightedGiftCoins * 0.5)
+ (TeamBattleContributionScore * 0.3)
+ (UniqueRoastersImpact * 0.1)
+ (HypeMomentumScore * 0.1)
```

#### Components

**1. IndividualWeightedGiftCoins**
- Calculated from creator's share of team gifts
- Platform cut (30%) applied BEFORE attribution
- Diminishing returns applied per sender
- Formula: `log10(gift_coins * 0.7 + 1) * 1000`

**2. TeamBattleContributionScore**
- Based on team's final TeamScore
- Adjusted by team size: `TeamSizeMultiplier = 1 / teamSize`
- Winning team members receive a bonus
- Losing team members receive partial credit (50%)

**3. UniqueRoastersImpact**
- Counts unique viewers gifting to the team
- Split evenly across team members
- Prevents single-whale dominance
- Formula: `(unique_roasters_count / team_size) * 50`

**4. HypeMomentumScore**
- Based on peak hype reached during battles
- Shared equally among team members
- Encourages coordinated gifting
- Formula: `(peak_hype_reached / team_size) * 10`

### Anti-Whale Protection

```
IF one sender contributes >35% of team gift value
  THEN apply diminishing multiplier (0.5) to excess for all team members
```

### Decay Rules

- Activity older than 7 days decays progressively
- Last 48 hours weighted highest (2.0x)
- Tournament battles override decay (1.2x boost)
- Minimum decay: 50% of score

### Rank Tiers

| Tier | Min Score | Max Score | Badge | Color |
|------|-----------|-----------|-------|-------|
| Bronze Mouth | 0 | 1,000 | 🥉 | #CD7F32 |
| Silver Tongue | 1,001 | 3,000 | 🥈 | #C0C0C0 |
| Golden Roast | 3,001 | 7,000 | 🥇 | #FFD700 |
| Diamond Disrespect | 7,001 | 15,000 | 💎 | #B9F2FF |
| Legendary Menace | 15,001+ | ∞ | 👑 | #FF0000 |

### Seasonal Rewards

**Cosmetic Rewards:**
- Profile badges
- Special intro animations
- Stream intro sounds
- Battle victory animations
- Seasonal titles

**Top-Tier Rewards (Top 10):**
- Custom ULTRA intro animation
- Highlighted placement in discovery
- Special seasonal title

**Rules:**
- No cash prizes (avoid gambling classification)
- No guaranteed monetary advantage
- Rewards do NOT affect gift payouts
- Rewards are deterministic and auditable

---

## Database Schema

### Creator Leveling Tables

#### `creator_levels`
```sql
- id (uuid, primary key)
- creator_id (uuid, unique, references profiles)
- current_level (integer, 1-50)
- current_xp (bigint)
- xp_to_next_level (bigint)
- total_xp_earned (bigint)
- xp_from_gifts (bigint)
- xp_from_battles (bigint)
- xp_from_stream_duration (bigint)
- xp_from_seasons (bigint)
- total_confirmed_gift_value_sek (integer)
- total_battles_participated (integer)
- total_unique_viewers (integer)
- total_seasons_participated (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `creator_perks`
```sql
- id (uuid, primary key)
- perk_key (text, unique)
- perk_name (text)
- perk_description (text)
- perk_type (text: cosmetic | ux | analytics | priority)
- required_level (integer, 1-50)
- perk_data (jsonb)
- icon_url (text, nullable)
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `creator_unlocked_perks`
```sql
- id (uuid, primary key)
- creator_id (uuid, references profiles)
- perk_id (uuid, references creator_perks)
- unlocked_at (timestamptz)
- is_equipped (boolean)
- created_at (timestamptz)
- UNIQUE(creator_id, perk_id)
```

#### `creator_level_history`
```sql
- id (uuid, primary key)
- creator_id (uuid, references profiles)
- previous_level (integer)
- new_level (integer)
- xp_gained (bigint)
- xp_source (text: gift | battle | stream_duration | season)
- metadata (jsonb)
- created_at (timestamptz)
```

### Roast Ranking Tables

#### `roast_ranking_seasons`
```sql
- id (uuid, primary key)
- name (text, nullable)
- season_number (integer, unique)
- start_date (timestamptz)
- end_date (timestamptz)
- duration_days (integer)
- status (text: ACTIVE | ENDED)
- created_at (timestamptz)
```

#### `creator_season_scores`
```sql
- id (uuid, primary key)
- season_id (uuid, references roast_ranking_seasons)
- creator_id (uuid, references profiles)
- season_score (float)
- rank_tier (text, nullable)
- last_updated (timestamptz)
- created_at (timestamptz)
- UNIQUE(season_id, creator_id)
```

#### `creator_season_rewards`
```sql
- id (uuid, primary key)
- season_id (uuid, references roast_ranking_seasons)
- creator_id (uuid, references profiles)
- reward_id (text)
- granted_at (timestamptz)
- created_at (timestamptz)
- UNIQUE(season_id, creator_id, reward_id)
```

#### `roast_rank_tiers`
```sql
- id (uuid, primary key)
- season_id (uuid, references roast_ranking_seasons)
- tier_name (text)
- tier_order (integer)
- min_score (integer)
- max_score (integer, nullable)
- badge_icon (text, nullable)
- badge_color (text, nullable)
- intro_animation (text, nullable)
- profile_effect (text, nullable)
- exclusive_gifts (text[], nullable)
- created_at (timestamptz)
```

---

## Services

### `creatorLevelingService.ts`

**Methods:**
- `getCreatorLevel(creatorId)` - Get creator's current level
- `getAllPerks()` - Get all available perks
- `getPerksForLevel(level)` - Get perks for specific level
- `getUnlockedPerks(creatorId)` - Get creator's unlocked perks
- `getEquippedPerks(creatorId)` - Get creator's equipped perks
- `equipPerk(creatorId, perkId)` - Equip a perk
- `unequipPerk(creatorId, perkId)` - Unequip a perk
- `getLevelHistory(creatorId, limit)` - Get level-up history
- `calculateXPForLevel(level)` - Calculate XP needed for level
- `subscribeToLevelUpdates(creatorId, callback)` - Subscribe to realtime updates
- `subscribeToPerkUnlocks(creatorId, callback)` - Subscribe to perk unlocks

### `roastRankingService.ts`

**Methods:**
- `getCurrentSeason()` - Get current active season
- `getSeasonConfig(seasonId)` - Get season configuration
- `getSeasonRankings(seasonId, region, limit)` - Get rankings
- `getUserRanking(userId)` - Get user's ranking
- `getRankTiers(seasonId)` - Get rank tiers
- `calculateSeasonScore(participation, config)` - Calculate score
- `recordTeamBattleParticipation(participation)` - Record battle
- `createSeason(durationDays)` - Create new season
- `endSeasonAndGrantRewards(seasonId)` - End season and grant rewards
- `getUserSeasonalRewards(userId)` - Get user's rewards

---

## UI Components

### `CreatorLevelDisplay.tsx`

Displays creator's current level, XP progress, and unlocked perks.

**Features:**
- Level badge with tier color
- XP progress bar
- XP sources breakdown
- Unlocked perks list
- Upcoming perks preview
- Equip/unequip perks
- Realtime updates

### `ViewerRankingDisplay.tsx`

Displays creator rank badge during live, season progress bar, and battle win streak.

**Features:**
- Rank badge with tier icon
- Season progress bar
- Near-rank-up emphasis
- Battle win streak indicator
- Pulsing animations
- Realtime updates

**Psychology Rules:**
- Rank progress always visible
- Near-rank-up states emphasized (90%+)
- Viewers nudged to "push creator over the edge"

### `RoastSeasonRankingDisplay.tsx`

Displays user's season ranking with tier badge and leaderboard.

**Features:**
- User ranking card
- Score breakdown
- Rank tiers list
- Top creators leaderboard
- Win rate statistics

---

## Integration Points

### 1. Gift Transactions

**Trigger:** `roast_gift_transactions` INSERT
**Action:** Add XP to creator (gift_value_sek * 10)
**Function:** `trigger_add_xp_from_gift()`

### 2. Battle Completion

**Trigger:** `battle_team_matches` UPDATE (status = 'completed')
**Action:** Add XP to all team members based on format and outcome
**Function:** `trigger_add_xp_from_battle()`

### 3. Stream Duration

**Trigger:** `streams` UPDATE (status = 'ended')
**Action:** Add XP based on duration milestones (every 30 min = 100 XP)
**Function:** `trigger_add_xp_from_stream_duration()`

### 4. Season Participation

**Trigger:** `roast_seasonal_rewards` INSERT
**Action:** Add XP based on final rank
**Function:** `trigger_add_xp_from_season()`

### 5. Perk Unlocks

**Trigger:** Level-up in `add_creator_xp()` function
**Action:** Automatically unlock perks for new level
**Table:** `creator_unlocked_perks`

---

## Moderation & Safety

### Creator-Side Protections

**Rules:**
- No penalties for going offline
- No forced participation
- Rankings are opt-in by going live

**Burnout Prevention:**
- Daily score caps (configurable)
- Soft diminishing returns after long sessions
- Cooldown suggestions in UI

**Transparency:**
- Creators see rank movement
- Creators do NOT see exact formulas
- Creators see top contributors (optional)

**Season Reset:**
- Old ranks archived
- New season starts clean
- Prestige history preserved

### Moderation Rules

**Rules:**
- Confirmed gifts only affect rankings
- Flagged streams temporarily excluded from rankings
- Fraudulent activity zeroed post-review

**No Live Punishment:**
- Rankings adjusted after investigation
- Rewards revoked if needed

**Audit Requirements:**
- Every season score change logged
- Every reward grant logged

**Moderation Actions Must:**
- Never affect live streaming
- Never crash ranking computation

---

## Realtime Channels

### Creator Leveling

- `creator_level:{creator_id}` - Level updates
- `creator_perks:{creator_id}` - Perk unlocks

### Roast Ranking

- `roast_season_updates` - Season status changes
- `creator_rank_updates:{creator_id}` - Rank updates

---

## Scheduled Jobs

### Daily Rank Recalculation

**Function:** `recalculate-season-rankings`
**Schedule:** Daily at 00:00 UTC
**Cron:** `0 0 * * *`

**Actions:**
1. Get active season
2. Fetch all ranking entries
3. Sort by composite_score
4. Update ranks
5. Assign tiers based on score thresholds
6. Update `last_recalculated_at` timestamp

---

## Testing Checklist

### Creator Leveling

- [ ] Creator level initializes on first gift
- [ ] XP is added correctly from gifts
- [ ] XP is added correctly from battles
- [ ] XP is added correctly from stream duration
- [ ] XP is added correctly from season participation
- [ ] Level-ups trigger correctly
- [ ] Perks unlock at correct levels
- [ ] Perks can be equipped/unequipped
- [ ] Realtime updates work
- [ ] Level history is logged

### Roast Ranking

- [ ] Season can be created
- [ ] Season score is calculated correctly
- [ ] Team battle participation is recorded
- [ ] Rankings are updated correctly
- [ ] Rank tiers are assigned correctly
- [ ] Season can be ended
- [ ] Rewards are granted correctly
- [ ] Realtime updates work
- [ ] Daily recalculation works

---

## Future Enhancements

1. **Level Prestige System** - Reset to level 1 with prestige badge
2. **Perk Trading** - Allow creators to trade cosmetic perks
3. **Custom Perk Creation** - Allow creators to design custom perks
4. **Regional Leaderboards** - Separate rankings by region
5. **Team Seasons** - Team-based seasonal rankings
6. **Achievement System** - Special achievements for milestones
7. **Level Boosts** - Temporary XP multipliers
8. **Perk Slots** - Limit number of equipped perks

---

## Support & Troubleshooting

### Common Issues

**Issue:** Creator level not initializing
**Solution:** Check if `creator_levels` record exists, manually insert if needed

**Issue:** XP not being added
**Solution:** Check trigger functions are enabled, verify transaction status

**Issue:** Perks not unlocking
**Solution:** Check `creator_perks` table has active perks for level

**Issue:** Rankings not updating
**Solution:** Run manual recalculation, check season status

### Debug Queries

```sql
-- Check creator level
SELECT * FROM creator_levels WHERE creator_id = 'uuid';

-- Check unlocked perks
SELECT * FROM creator_unlocked_perks WHERE creator_id = 'uuid';

-- Check level history
SELECT * FROM creator_level_history WHERE creator_id = 'uuid' ORDER BY created_at DESC LIMIT 10;

-- Check season rankings
SELECT * FROM roast_ranking_entries WHERE season_id = 'uuid' ORDER BY rank LIMIT 100;

-- Check season config
SELECT * FROM roast_season_config WHERE season_id = 'uuid';
```

---

## Conclusion

The Creator Leveling & Roast Ranking Seasons system provides a comprehensive progression and competitive framework for the Roast Live platform. It encourages engagement, rewards activity, and creates recurring hype cycles while maintaining fairness and preventing burnout.

For questions or support, contact the development team.
