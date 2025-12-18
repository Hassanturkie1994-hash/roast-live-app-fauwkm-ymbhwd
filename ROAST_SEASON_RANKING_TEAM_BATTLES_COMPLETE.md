
# Roast Season Ranking Formula - Team Battles Implementation Complete ✅

## Overview

The comprehensive Roast Season Ranking Formula for team-based Roast Battles has been successfully implemented. This system accounts for both individual creator contribution and team battle performance across all supported formats (1v1, 2v2, 3v3, 4v4, 5v5).

## Core Principle

**Creators earn SeasonScore as individuals, even when competing in teams.**
Team performance influences individual SeasonScore proportionally.

## SeasonScore Formula

```
SeasonScore =
  (IndividualWeightedGiftCoins * 0.5)
+ (TeamBattleContributionScore * 0.3)
+ (UniqueRoastersImpact * 0.1)
+ (HypeMomentumScore * 0.1)
```

### Formula Components

#### 1. IndividualWeightedGiftCoins (50% weight)
- Calculated from the creator's share of team gifts
- Platform cut (30%) applied BEFORE attribution
- Diminishing returns applied per sender using logarithmic scale
- Formula: `Math.log10(afterPlatformCut + 1) * 1000`

#### 2. TeamBattleContributionScore (30% weight)
- Based on team's final TeamScore
- Adjusted by team size: `TeamSizeMultiplier = 1 / teamSize`
- **Win bonuses (configurable per season):**
  - 1v1: 500 points
  - 2v2: 400 points
  - 3v3: 350 points
  - 4v4: 300 points
  - 5v5: 250 points
- Losing team members receive 50% partial credit

#### 3. UniqueRoastersImpact (10% weight)
- Counts unique viewers gifting to the team
- Split evenly across team members
- Formula: `(uniqueRoastersCount / teamSize) * 50`
- Prevents single-whale dominance

#### 4. HypeMomentumScore (10% weight)
- Based on peak hype reached during battles
- Shared equally among team members
- Formula: `(peakHypeReached / teamSize) * 10`
- Encourages coordinated gifting

## Anti-Whale Protection

**IF one sender contributes >35% of team gift value:**
- Apply diminishing multiplier (0.5) to excess for all team members
- Threshold and multiplier are server-configurable
- Protects against single-donor dominance

## Decay Rules

### Time-Based Decay
- **Last 48 hours:** Weighted highest (2.0x multiplier)
- **7 days:** Progressive decay (10% decay rate)
- **Older than 7 days:** Minimum 50% of score retained

### Tournament Override
- Tournament battles receive 20% boost
- Overrides normal decay rules
- Temporary boost for competitive play

## Battle Type Filtering

### Affects SeasonScore:
- ✅ **Ranked battles**
- ✅ **Tournament battles**

### Does NOT affect SeasonScore:
- ❌ **Casual battles**

## Rank Tiers

### Default Tier System

| Tier | Name | Min Score | Max Score | Badge | Color |
|------|------|-----------|-----------|-------|-------|
| 1 | Bronze Mouth | 0 | 1,000 | 🥉 | #CD7F32 |
| 2 | Silver Tongue | 1,001 | 3,000 | 🥈 | #C0C0C0 |
| 3 | Golden Roast | 3,001 | 7,000 | 🥇 | #FFD700 |
| 4 | Diamond Disrespect | 7,001 | 15,000 | 💎 | #B9F2FF |
| 5 | Legendary Menace | 15,001+ | ∞ | 👑 | #FF0000 |

### Tier Rewards (Cosmetic Only)

Each tier includes:
- **Profile badge** with tier icon and color
- **Intro animation** for stream starts
- **Profile effect** (glow/aura)
- **Exclusive roast gifts** (cosmetic only)

**Example:**
- Bronze Mouth: `bronze_intro`, `bronze_glow`, `['bronze_roast']`
- Legendary Menace: `legendary_intro`, `legendary_aura`, `['legendary_roast', 'legendary_flame', 'legendary_crown', 'legendary_nuke']`

## Seasonal Rewards

### End-of-Season Rewards

When a season ends, creators receive:

1. **Cosmetic Badges**
   - Tier-specific badge icon and color
   - Permanent display on profile

2. **Profile Effects**
   - Tier-specific visual effects
   - Glow, sparkle, or aura animations

3. **Stream Intro Sounds**
   - Custom audio for stream starts
   - Tier-specific sound effects

4. **Battle Victory Animations**
   - Special animations for battle wins
   - Tier-specific victory sequences

### Top-Tier Rewards (Top 10)

Creators ranked in the top 10 receive additional rewards:

1. **Custom ULTRA Intro Animation**
   - Platform-designed exclusive animation
   - `ultra_champion_intro`

2. **Highlighted Placement in Discovery**
   - Featured in discovery feed
   - Increased visibility

3. **Special Seasonal Title**
   - Format: `Season {number} {tier_name}`
   - Example: "Season 1 Legendary Menace"

### Reward Rules

- ✅ **No cash prizes** (avoids gambling classification)
- ✅ **No guaranteed monetary advantage**
- ✅ **Rewards do NOT affect gift payouts**
- ✅ **Deterministic and auditable**

## Season Configuration

### Server-Configurable Parameters

All weights and bonuses are stored in `roast_season_config` table:

```typescript
{
  weight_individual_gifts: 0.5,      // 50%
  weight_team_contribution: 0.3,     // 30%
  weight_unique_roasters: 0.1,       // 10%
  weight_hype_momentum: 0.1,         // 10%
  
  win_bonus_1v1: 500,
  win_bonus_2v2: 400,
  win_bonus_3v3: 350,
  win_bonus_4v4: 300,
  win_bonus_5v5: 250,
  
  whale_threshold_percent: 0.35,     // 35%
  whale_diminishing_multiplier: 0.5, // 50%
  
  decay_days: 7,
  decay_rate: 0.1,                   // 10%
  recent_hours_weight: 2.0,          // 2x
  
  max_score_per_battle: 10000
}
```

### Season Management

- **Duration:** Configurable (default: 14 days)
- **Status:** `active`, `completed`, `upcoming`
- **Reset:** Automatic at season end
- **Rank Recalculation:** Daily (server-side)

## Database Schema

### Core Tables

#### 1. `roast_ranking_seasons`
Stores season metadata and status.

```sql
CREATE TABLE roast_ranking_seasons (
  id UUID PRIMARY KEY,
  season_number INTEGER UNIQUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  duration_days INTEGER,
  status TEXT CHECK (status IN ('active', 'completed', 'upcoming')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `roast_season_config`
Server-configurable weights and bonuses.

```sql
CREATE TABLE roast_season_config (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  weight_individual_gifts NUMERIC DEFAULT 0.5,
  weight_team_contribution NUMERIC DEFAULT 0.3,
  weight_unique_roasters NUMERIC DEFAULT 0.1,
  weight_hype_momentum NUMERIC DEFAULT 0.1,
  win_bonus_1v1 INTEGER DEFAULT 500,
  win_bonus_2v2 INTEGER DEFAULT 400,
  win_bonus_3v3 INTEGER DEFAULT 350,
  win_bonus_4v4 INTEGER DEFAULT 300,
  win_bonus_5v5 INTEGER DEFAULT 250,
  whale_threshold_percent NUMERIC DEFAULT 0.35,
  whale_diminishing_multiplier NUMERIC DEFAULT 0.5,
  decay_days INTEGER DEFAULT 7,
  decay_rate NUMERIC DEFAULT 0.1,
  recent_hours_weight NUMERIC DEFAULT 2.0,
  max_score_per_battle INTEGER DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `roast_ranking_entries`
Creator rankings per season.

```sql
CREATE TABLE roast_ranking_entries (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  creator_id UUID REFERENCES profiles(id),
  rank INTEGER DEFAULT 0,
  composite_score INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  battles_participated INTEGER DEFAULT 0,
  team_battles_won INTEGER DEFAULT 0,
  team_battles_participated INTEGER DEFAULT 0,
  total_gifts_received_sek INTEGER DEFAULT 0,
  weighted_gifts_score INTEGER DEFAULT 0,
  individual_weighted_gift_score INTEGER DEFAULT 0,
  team_contribution_score INTEGER DEFAULT 0,
  unique_roasters_count INTEGER DEFAULT 0,
  unique_roasters_impact INTEGER DEFAULT 0,
  crowd_hype_peaks INTEGER DEFAULT 0,
  hype_momentum_score INTEGER DEFAULT 0,
  current_tier TEXT,
  region TEXT DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_recalculated_at TIMESTAMPTZ
);
```

#### 4. `roast_rank_tiers`
Defines rank tiers for each season.

```sql
CREATE TABLE roast_rank_tiers (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  tier_name TEXT,
  tier_order INTEGER,
  min_score INTEGER,
  max_score INTEGER,
  badge_icon TEXT,
  badge_color TEXT,
  intro_animation TEXT,
  profile_effect TEXT,
  exclusive_gifts TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `roast_seasonal_rewards`
Stores granted rewards at season end.

```sql
CREATE TABLE roast_seasonal_rewards (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  creator_id UUID REFERENCES profiles(id),
  final_rank INTEGER,
  final_score INTEGER,
  tier_name TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  intro_animation TEXT,
  profile_effect TEXT,
  stream_intro_sound TEXT,
  battle_victory_animation TEXT,
  seasonal_title TEXT,
  is_top_tier BOOLEAN DEFAULT FALSE,
  ultra_intro_animation TEXT,
  highlighted_in_discovery BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `roast_team_battle_participation`
Tracks individual creator participation in team battles.

```sql
CREATE TABLE roast_team_battle_participation (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  creator_id UUID REFERENCES profiles(id),
  match_id UUID REFERENCES battle_team_matches(id),
  team TEXT CHECK (team IN ('team_a', 'team_b')),
  team_size INTEGER CHECK (team_size >= 1 AND team_size <= 5),
  is_winner BOOLEAN DEFAULT FALSE,
  individual_gift_coins INTEGER DEFAULT 0,
  individual_weighted_score INTEGER DEFAULT 0,
  team_score INTEGER DEFAULT 0,
  team_size_multiplier NUMERIC DEFAULT 1.0,
  team_contribution_score INTEGER DEFAULT 0,
  unique_roasters_count INTEGER DEFAULT 0,
  unique_roasters_score INTEGER DEFAULT 0,
  hype_momentum_score INTEGER DEFAULT 0,
  peak_hype_reached INTEGER DEFAULT 0,
  season_score INTEGER DEFAULT 0,
  battle_type TEXT DEFAULT 'casual' CHECK (battle_type IN ('casual', 'ranked', 'tournament')),
  battle_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `roast_ranking_unique_roasters`
Tracks unique roasters per creator per season.

```sql
CREATE TABLE roast_ranking_unique_roasters (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES roast_ranking_seasons(id),
  creator_id UUID REFERENCES profiles(id),
  roaster_id UUID REFERENCES profiles(id),
  first_gift_at TIMESTAMPTZ DEFAULT NOW(),
  total_gifts_sek INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Service API

### RoastRankingService

#### Core Methods

```typescript
// Get current active season
getCurrentSeason(): Promise<RoastRankingSeason | null>

// Get season configuration
getSeasonConfig(seasonId: string): Promise<RoastSeasonConfig | null>

// Get rankings for a season
getSeasonRankings(
  seasonId: string,
  region?: string,
  limit?: number
): Promise<RoastRankingEntry[]>

// Get user's ranking in current season
getUserRanking(userId: string): Promise<RoastRankingEntry | null>

// Get rank tiers for a season
getRankTiers(seasonId: string): Promise<RoastRankTier[]>

// Calculate SeasonScore for a team battle participation
calculateSeasonScore(
  participation: TeamBattleParticipation,
  config: RoastSeasonConfig
): Promise<number>

// Record team battle participation
recordTeamBattleParticipation(
  participation: TeamBattleParticipation
): Promise<void>

// Create a new season with default config and tiers
createSeason(durationDays?: number): Promise<RoastRankingSeason | null>

// End season and grant rewards
endSeasonAndGrantRewards(seasonId: string): Promise<void>

// Get user's seasonal rewards
getUserSeasonalRewards(userId: string): Promise<RoastSeasonalReward[]>

// Create default rank tiers for a season
createDefaultRankTiers(seasonId: string): Promise<void>
```

### Usage Example

```typescript
import { roastRankingService } from '@/services/roastRankingService';

// Record a team battle participation
await roastRankingService.recordTeamBattleParticipation({
  season_id: currentSeasonId,
  creator_id: userId,
  match_id: battleMatchId,
  team: 'team_a',
  team_size: 3,
  is_winner: true,
  individual_gift_coins: 5000,
  team_score: 12000,
  unique_roasters_count: 25,
  peak_hype_reached: 150,
  battle_type: 'ranked',
  battle_duration_minutes: 10,
});

// Get current rankings
const rankings = await roastRankingService.getSeasonRankings(
  currentSeasonId,
  'global',
  100
);

// Get user's ranking
const userRanking = await roastRankingService.getUserRanking(userId);

// Get user's seasonal rewards
const rewards = await roastRankingService.getUserSeasonalRewards(userId);
```

## Integration Points

### 1. Battle System Integration

When a team battle ends:

```typescript
// In battle service
const participation: TeamBattleParticipation = {
  season_id: currentSeasonId,
  creator_id: creatorId,
  match_id: matchId,
  team: creatorTeam,
  team_size: teamMembers.length,
  is_winner: winnerTeam === creatorTeam,
  individual_gift_coins: creatorGiftTotal,
  team_score: teamFinalScore,
  unique_roasters_count: uniqueGifters.length,
  peak_hype_reached: maxHypeValue,
  battle_type: matchType, // 'casual', 'ranked', or 'tournament'
  battle_duration_minutes: durationMinutes,
};

await roastRankingService.recordTeamBattleParticipation(participation);
```

### 2. Gift System Integration

Track unique roasters:

```typescript
// In roast gift service
await supabase.from('roast_ranking_unique_roasters').upsert({
  season_id: currentSeasonId,
  creator_id: receiverId,
  roaster_id: senderId,
  first_gift_at: new Date().toISOString(),
  total_gifts_sek: giftAmount,
});
```

### 3. UI Display Integration

Display user's rank and tier:

```typescript
const userRanking = await roastRankingService.getUserRanking(userId);

if (userRanking) {
  console.log(`Rank: #${userRanking.rank}`);
  console.log(`Tier: ${userRanking.current_tier}`);
  console.log(`Score: ${userRanking.composite_score}`);
  console.log(`Team Battles Won: ${userRanking.team_battles_won}/${userRanking.team_battles_participated}`);
}
```

## Constraints & Rules

### ✅ Confirmed Gifts Only
- Only `CONFIRMED` gift transactions affect rankings
- `PENDING` and `FAILED` transactions are ignored

### ✅ Battle Type Filtering
- **Casual battles:** Do NOT affect SeasonScore
- **Ranked battles:** DO affect SeasonScore
- **Tournament battles:** DO affect SeasonScore (with 20% boost)

### ✅ Server-Side Computation
- Rankings are recomputed server-side
- Client only displays ranking state
- Prevents client-side manipulation

### ✅ Daily Recalculation
- Ranks are recalculated daily
- Ensures up-to-date leaderboard
- Scheduled via Supabase cron job

### ✅ Never Block Creators
- Ranks are cosmetic + prestige-based
- No direct monetization advantages
- Never block creators from going live

### ❌ No Formula Exposure
- Formulas are NOT exposed to users
- Prevents gaming the system
- Maintains competitive integrity

### ❌ No Streaming API Modifications
- Does NOT modify streaming APIs
- Does NOT modify Cloudflare Stream logic
- Purely metadata-driven

## Performance Considerations

### Indexing

Key indexes for performance:

```sql
-- Season lookups
CREATE INDEX idx_roast_ranking_seasons_status ON roast_ranking_seasons(status);

-- Ranking queries
CREATE INDEX idx_roast_ranking_entries_season_rank ON roast_ranking_entries(season_id, rank);
CREATE INDEX idx_roast_ranking_entries_creator ON roast_ranking_entries(creator_id);

-- Participation queries
CREATE INDEX idx_roast_team_battle_participation_season_creator 
  ON roast_team_battle_participation(season_id, creator_id);

-- Unique roasters
CREATE INDEX idx_roast_ranking_unique_roasters_season_creator 
  ON roast_ranking_unique_roasters(season_id, creator_id);
```

### Caching

- Cache current season data (5 minute TTL)
- Cache rank tiers (1 hour TTL)
- Cache top 100 rankings (5 minute TTL)

### Batch Processing

- Rank recalculation runs as batch job
- Process in chunks of 100 creators
- Use database transactions for consistency

## Testing Checklist

### Unit Tests

- ✅ SeasonScore calculation
- ✅ Team size multiplier
- ✅ Win bonus calculation
- ✅ Decay rules
- ✅ Anti-whale protection
- ✅ Tier determination

### Integration Tests

- ✅ Record team battle participation
- ✅ Update creator ranking entry
- ✅ Recalculate ranks
- ✅ End season and grant rewards
- ✅ Create new season

### End-to-End Tests

- ✅ Complete battle flow
- ✅ Gift sending and tracking
- ✅ Ranking updates
- ✅ Season transitions
- ✅ Reward distribution

## Monitoring & Analytics

### Key Metrics

- **Active seasons:** Number of active seasons
- **Total participants:** Creators with ranking entries
- **Average SeasonScore:** Mean score across all creators
- **Top tier distribution:** Percentage in each tier
- **Battle participation rate:** Percentage of creators in battles
- **Gift volume:** Total SEK in gifts per season

### Alerts

- Season end approaching (24 hours)
- Rank recalculation failures
- Reward distribution errors
- Unusual score spikes (potential abuse)

## Future Enhancements

### Potential Additions

1. **Regional Leaderboards**
   - Separate rankings per region
   - Regional champions

2. **Team Leaderboards**
   - Track team performance
   - Team-based rewards

3. **Historical Stats**
   - Season-over-season comparison
   - Personal best tracking

4. **Achievement System**
   - Milestone achievements
   - Special badges for achievements

5. **Prediction System**
   - Predict final rank
   - Gamification element

## Conclusion

The Roast Season Ranking Formula for team-based battles is now fully implemented and ready for production use. The system provides:

- ✅ Fair individual scoring in team contexts
- ✅ Anti-whale protection
- ✅ Configurable weights and bonuses
- ✅ Cosmetic rewards system
- ✅ Server-side computation
- ✅ Daily rank updates
- ✅ Seasonal resets

All constraints and requirements have been met, and the system is designed to scale with the platform's growth.

---

**Implementation Status:** ✅ **COMPLETE**

**Last Updated:** December 2024

**Version:** 1.0.0
