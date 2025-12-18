
# Roast Ranking Seasons & Creator Leveling Implementation Complete

## Overview

This implementation provides a complete Roast Ranking Seasons system with Creator Leveling, designed for team-based Roast Battles with comprehensive viewer psychology, creator protections, and moderation controls.

---

## Database Schema

### Core Tables

#### `roast_ranking_seasons`
- **Purpose**: Manages seasonal ranking periods
- **Status Values**: `ACTIVE` | `ENDED`
- **Fields**:
  - `id` (uuid)
  - `name` (text)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `status` (ACTIVE | ENDED)
  - `season_number` (integer)
  - `duration_days` (integer)

#### `creator_season_scores`
- **Purpose**: Real-time season scores for creators
- **Fields**:
  - `season_id` (uuid)
  - `creator_id` (uuid)
  - `season_score` (float)
  - `rank_tier` (text)
  - `last_updated` (timestamp)

#### `creator_season_rewards`
- **Purpose**: Tracks rewards granted at season end
- **Fields**:
  - `season_id` (uuid)
  - `creator_id` (uuid)
  - `reward_id` (text)
  - `granted_at` (timestamp)

#### `season_score_audit_log` (NEW)
- **Purpose**: Audit log for all season score changes
- **Fields**:
  - `season_id` (uuid)
  - `creator_id` (uuid)
  - `old_score` (float)
  - `new_score` (float)
  - `old_rank_tier` (text)
  - `new_rank_tier` (text)
  - `change_reason` (text)
  - `metadata` (jsonb)
  - `created_at` (timestamp)

#### `reward_grant_audit_log` (NEW)
- **Purpose**: Audit log for all reward grants and revocations
- **Fields**:
  - `season_id` (uuid)
  - `creator_id` (uuid)
  - `reward_id` (text)
  - `granted_at` (timestamp)
  - `revoked_at` (timestamp)
  - `revoke_reason` (text)
  - `metadata` (jsonb)

#### `creator_levels`
- **Purpose**: Creator leveling system (1-50)
- **Fields**:
  - `creator_id` (uuid)
  - `current_level` (integer, 1-50)
  - `current_xp` (bigint)
  - `xp_to_next_level` (bigint)
  - `total_xp_earned` (bigint)
  - `xp_from_gifts` (bigint)
  - `xp_from_battles` (bigint)
  - `xp_from_stream_duration` (bigint)
  - `xp_from_seasons` (bigint)

#### `creator_perks`
- **Purpose**: Available perks at different levels
- **Perk Types**: cosmetic, ux, analytics, priority
- **Fields**:
  - `perk_key` (text, unique)
  - `perk_name` (text)
  - `perk_description` (text)
  - `perk_type` (text)
  - `required_level` (integer, 1-50)
  - `perk_data` (jsonb)

#### `creator_unlocked_perks`
- **Purpose**: Tracks which perks each creator has unlocked
- **Fields**:
  - `creator_id` (uuid)
  - `perk_id` (uuid)
  - `unlocked_at` (timestamp)
  - `is_equipped` (boolean)

---

## Realtime Channels

### Season Updates
- **Channel**: `roast_season_updates`
- **Events**: Season status changes, new seasons created

### Creator Rank Updates
- **Channel**: `creator_rank_updates:{creator_id}`
- **Events**: Score changes, tier changes, rank changes

### Gift Events
- **Channel**: `roast_gifts:{stream_id}`
- **Events**: Gift sent, combo streaks, momentum boosts

---

## React Native Components

### Viewer Experience

#### `SeasonProgressOverlay`
- **Location**: `components/SeasonProgressOverlay.tsx`
- **Purpose**: Displays during live streams
- **Features**:
  - Creator rank badge with tier icon
  - Season progress bar
  - Near-rank-up nudges
  - Rank-up animations
  - Battle win streak indicators

#### `LiveSeasonIntegration`
- **Location**: `components/LiveSeasonIntegration.tsx`
- **Purpose**: Complete live integration
- **Features**:
  - Real-time rank updates
  - Gift combo tracking
  - Hype multiplier display
  - Rank spike animations on battle wins

#### `ViewerRankingDisplay`
- **Location**: `components/ViewerRankingDisplay.tsx`
- **Purpose**: Viewer-facing ranking display
- **Features**:
  - Creator rank badge
  - Progress to next tier
  - Battle win streak
  - Psychology-driven nudges

### Creator Experience

#### `CreatorSeasonDashboard`
- **Location**: `components/CreatorSeasonDashboard.tsx`
- **Purpose**: Creator dashboard for season progress
- **Features**:
  - Current rank and tier
  - Progress to next tier
  - Daily score caps
  - Burnout prevention warnings
  - Top contributors (optional)
  - Prestige history

#### `CreatorBurnoutProtection`
- **Location**: `components/CreatorBurnoutProtection.tsx`
- **Purpose**: Prevents creator burnout
- **Features**:
  - Daily score cap warnings
  - Diminishing returns indicators
  - Cooldown suggestions
  - Session duration tracking

#### `CreatorLevelDisplay`
- **Location**: `components/CreatorLevelDisplay.tsx`
- **Purpose**: Displays creator level and perks
- **Features**:
  - Current level and XP progress
  - XP sources breakdown
  - Unlocked perks
  - Upcoming perks
  - Equip/unequip perks

### Admin Tools

#### `SeasonAdminPanel`
- **Location**: `components/SeasonAdminPanel.tsx`
- **Purpose**: Admin interface for season management
- **Features**:
  - Create new seasons
  - End current season
  - View season statistics
  - Recalculate rankings

#### `SeasonModerationPanel`
- **Location**: `components/SeasonModerationPanel.tsx`
- **Purpose**: Moderation interface
- **Features**:
  - View audit logs
  - Zero fraudulent scores
  - Revoke rewards
  - Restore scores after appeals

#### `RoastSeasonRankingDisplay`
- **Location**: `components/RoastSeasonRankingDisplay.tsx`
- **Purpose**: Full ranking display with leaderboard
- **Features**:
  - User's ranking card
  - Score breakdown
  - Rank tiers
  - Top 100 leaderboard

---

## Services

### `roastRankingService`
- **Location**: `services/roastRankingService.ts`
- **Methods**:
  - `getCurrentSeason()` - Get active season
  - `getSeasonConfig()` - Get season configuration
  - `getSeasonRankings()` - Get rankings for a season
  - `getUserRanking()` - Get user's ranking
  - `getRankTiers()` - Get rank tiers
  - `calculateSeasonScore()` - Calculate score for battle participation
  - `recordTeamBattleParticipation()` - Record battle participation
  - `createSeason()` - Create new season
  - `endSeasonAndGrantRewards()` - End season and grant rewards
  - `createDefaultRankTiers()` - Create default rank tiers

### `creatorLevelingService`
- **Location**: `services/creatorLevelingService.ts`
- **Methods**:
  - `getCreatorLevel()` - Get creator's current level
  - `getAllPerks()` - Get all available perks
  - `getUnlockedPerks()` - Get creator's unlocked perks
  - `getEquippedPerks()` - Get creator's equipped perks
  - `equipPerk()` - Equip a perk
  - `unequipPerk()` - Unequip a perk
  - `getLevelHistory()` - Get level-up history
  - `subscribeToLevelUpdates()` - Subscribe to level changes
  - `subscribeToPerkUnlocks()` - Subscribe to perk unlocks

### `seasonModerationService` (NEW)
- **Location**: `services/seasonModerationService.ts`
- **Methods**:
  - `flagStreamForReview()` - Flag stream for review
  - `zeroCreatorScore()` - Zero out fraudulent score
  - `revokeSeasonalReward()` - Revoke reward after investigation
  - `restoreCreatorScore()` - Restore score after appeal
  - `validateGiftForRanking()` - Validate gift is confirmed
  - `isStreamExcludedFromRankings()` - Check if stream is flagged
  - `recalculateRankingsAfterModeration()` - Recalculate after moderation

---

## Database Functions

### `get_active_season()`
- **Returns**: Currently active season
- **Usage**: `SELECT * FROM get_active_season()`

### `get_creator_season_progress(p_creator_id, p_season_id)`
- **Returns**: Detailed season progress for a creator
- **Fields**:
  - `season_id`
  - `season_name`
  - `season_score`
  - `rank_tier`
  - `current_rank`
  - `total_creators`
  - `percentile`
  - `next_tier_threshold`
  - `progress_to_next_tier`

---

## Triggers

### `season_score_audit_trigger`
- **Table**: `creator_season_scores`
- **Event**: AFTER UPDATE
- **Function**: `log_season_score_change()`
- **Purpose**: Automatically logs all score changes

### `reward_grant_audit_trigger`
- **Table**: `creator_season_rewards`
- **Event**: AFTER INSERT
- **Function**: `log_reward_grant()`
- **Purpose**: Automatically logs all reward grants

---

## Season Ranking Formula

### SeasonScore Calculation

```
SeasonScore =
  (IndividualWeightedGiftCoins * 0.5)
+ (TeamBattleContributionScore * 0.3)
+ (UniqueRoastersImpact * 0.1)
+ (HypeMomentumScore * 0.1)
```

### Components

1. **IndividualWeightedGiftCoins**
   - Creator's share of team gifts
   - Platform cut (30%) applied BEFORE attribution
   - Diminishing returns per sender

2. **TeamBattleContributionScore**
   - Based on team's final TeamScore
   - Adjusted by team size: `TeamSizeMultiplier = 1 / teamSize`
   - Win bonus added for winning team
   - Losing team gets 50% credit

3. **UniqueRoastersImpact**
   - Counts unique viewers gifting
   - Split evenly across team members
   - Prevents whale dominance

4. **HypeMomentumScore**
   - Based on peak hype during battles
   - Shared equally among team members

### Anti-Whale Protection
- If one sender contributes >35% of team gift value
- Apply diminishing multiplier to excess

### Decay Rules
- Activity older than 7 days decays progressively
- Last 48 hours weighted 2x
- Tournament battles get 20% boost (no decay)

---

## Rank Tiers

### Default Tiers

1. **Bronze Mouth** 🥉
   - Score: 0 - 1,000
   - Color: #CD7F32
   - Rewards: Bronze intro, bronze glow

2. **Silver Tongue** 🥈
   - Score: 1,001 - 3,000
   - Color: #C0C0C0
   - Rewards: Silver intro, silver glow, exclusive gifts

3. **Golden Roast** 🥇
   - Score: 3,001 - 7,000
   - Color: #FFD700
   - Rewards: Gold intro, gold glow, crown, exclusive gifts

4. **Diamond Disrespect** 💎
   - Score: 7,001 - 15,000
   - Color: #B9F2FF
   - Rewards: Diamond intro, sparkle effect, exclusive gifts

5. **Legendary Menace** 👑
   - Score: 15,001+
   - Color: #FF0000
   - Rewards: Legendary intro, aura effect, nuke gift, exclusive gifts

---

## Creator Leveling System

### Level Range
- Levels 1-50
- Never resets
- Separate from seasonal ranks

### XP Sources

1. **Gifts Received** (weighted by tier)
   - LOW tier: 10 XP
   - MID tier: 50 XP
   - HIGH tier: 200 XP
   - ULTRA tier: 1000 XP

2. **Battle Wins**
   - 1v1: 500 XP
   - 2v2: 400 XP
   - 3v3: 350 XP
   - 4v4: 300 XP
   - 5v5: 250 XP

3. **Stream Duration Milestones**
   - Every 30 minutes: 100 XP
   - Every hour: 250 XP

4. **Seasonal Participation**
   - Completing a season: 1000 XP
   - Top 10 finish: 5000 XP bonus

### Level Tiers

- **Beginner** (1-9): #CCCCCC
- **Intermediate** (10-19): #CD7F32
- **Advanced** (20-29): #C0C0C0
- **Expert** (30-39): #FFD700
- **Master** (40-49): #FF1493
- **Legendary** (50): #FF0000

### Example Perks

- **Level 5**: Custom stream intro sound
- **Level 10**: Animated profile frame
- **Level 20**: Exclusive cosmetic roast gifts
- **Level 30**: Battle priority placement
- **Level 40**: Advanced analytics access
- **Level 50**: Legendary Roast title (cosmetic only)

---

## Creator Protections

### No Penalties
- ✅ No penalties for going offline
- ✅ No forced participation
- ✅ Rankings are opt-in by going live

### Burnout Prevention
- ✅ Daily score caps (1000 points default)
- ✅ Soft diminishing returns after 3 hours
- ✅ Cooldown suggestions after 4 hours
- ✅ Session duration tracking

### Transparency
- ✅ Creators see rank movement
- ✅ Creators do NOT see exact formulas
- ✅ Creators can view top contributors (optional)

### Season Reset
- ✅ Old ranks archived in `roast_seasonal_rewards`
- ✅ New season starts clean
- ✅ Prestige history preserved

---

## Viewer Psychology

### Always Visible
- ✅ Rank badge always shown during live
- ✅ Progress bar always visible
- ✅ Near-rank-up states emphasized

### Nudges
- ✅ "Push creator over the edge" messaging
- ✅ Percentage to next rank shown
- ✅ Combo streak indicators

### Actions
- ✅ Gifting increases rank momentum
- ✅ Combo streaks boost hype (5-second window)
- ✅ Battle wins cause rank spikes
- ✅ Hype multiplier up to 3x

---

## Moderation Rules

### Safe Moderation
- ✅ Confirmed gifts only affect rankings
- ✅ Flagged streams temporarily excluded
- ✅ Fraudulent activity zeroed post-review
- ✅ No live punishment
- ✅ Rankings adjusted after investigation
- ✅ Rewards revoked if needed

### Audit Requirements
- ✅ Every season score change logged
- ✅ Every reward grant logged
- ✅ Every reward revocation logged
- ✅ Moderation actions never affect live streaming
- ✅ Moderation actions never crash ranking computation

---

## Edge Functions

### `recalculate-season-rankings`
- **Location**: `supabase/functions/recalculate-season-rankings/index.ts`
- **Schedule**: Daily at 00:00 UTC (via cron)
- **Purpose**: Recalculates all ranks and tier assignments
- **Updated**: Now uses `ACTIVE` status instead of `active`

---

## Usage Examples

### Viewer Integration (Live Stream)

```tsx
import { LiveSeasonIntegration } from '@/components/LiveSeasonIntegration';

<LiveSeasonIntegration
  creatorId={creatorId}
  streamId={streamId}
  onGiftPress={() => {
    // Open gift selector
  }}
/>
```

### Creator Dashboard

```tsx
import { CreatorSeasonDashboard } from '@/components/CreatorSeasonDashboard';

<CreatorSeasonDashboard creatorId={userId} />
```

### Creator Burnout Protection

```tsx
import { CreatorBurnoutProtection } from '@/components/CreatorBurnoutProtection';

<CreatorBurnoutProtection
  creatorId={userId}
  streamId={streamId}
/>
```

### Creator Level Display

```tsx
import { CreatorLevelDisplay } from '@/components/CreatorLevelDisplay';

<CreatorLevelDisplay
  creatorId={userId}
  showPerks={true}
  showHistory={false}
/>
```

### Admin Season Management

```tsx
import { SeasonAdminPanel } from '@/components/SeasonAdminPanel';

<SeasonAdminPanel />
```

### Admin Moderation

```tsx
import { SeasonModerationPanel } from '@/components/SeasonModerationPanel';

<SeasonModerationPanel />
```

---

## API Usage

### Get Active Season

```typescript
import { roastRankingService } from '@/services/roastRankingService';

const season = await roastRankingService.getCurrentSeason();
```

### Get Creator Progress

```typescript
const { data } = await supabase
  .rpc('get_creator_season_progress', {
    p_creator_id: creatorId,
    p_season_id: seasonId, // Optional
  });
```

### Record Battle Participation

```typescript
await roastRankingService.recordTeamBattleParticipation({
  season_id: seasonId,
  creator_id: creatorId,
  match_id: matchId,
  team: 'team_a',
  team_size: 3,
  is_winner: true,
  individual_gift_coins: 5000,
  team_score: 12000,
  unique_roasters_count: 45,
  peak_hype_reached: 850,
  battle_type: 'ranked',
  battle_duration_minutes: 15,
});
```

### Get Creator Level

```typescript
import { creatorLevelingService } from '@/services/creatorLevelingService';

const level = await creatorLevelingService.getCreatorLevel(creatorId);
```

### Subscribe to Rank Updates

```typescript
const channel = supabase
  .channel(`creator_rank_updates:${creatorId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'creator_season_scores',
      filter: `creator_id=eq.${creatorId}`,
    },
    (payload) => {
      console.log('Rank updated:', payload);
    }
  )
  .subscribe();
```

---

## Moderation Workflow

### 1. Flag Stream for Review
```typescript
import { seasonModerationService } from '@/services/seasonModerationService';

await seasonModerationService.flagStreamForReview(
  streamId,
  creatorId,
  'Suspicious gift activity'
);
```

### 2. Zero Fraudulent Score
```typescript
await seasonModerationService.zeroCreatorScore(
  seasonId,
  creatorId,
  'Confirmed fraud - bot gifting detected'
);
```

### 3. Revoke Reward
```typescript
await seasonModerationService.revokeSeasonalReward(
  seasonId,
  creatorId,
  rewardId,
  'Reward granted based on fraudulent activity'
);
```

### 4. Restore After Appeal
```typescript
await seasonModerationService.restoreCreatorScore(
  seasonId,
  creatorId,
  restoredScore,
  'Appeal approved - false positive'
);
```

---

## Key Features

### ✅ Implemented

1. **Database Schema**
   - All season tables created
   - Audit logging tables
   - Creator leveling tables
   - RLS policies configured
   - Realtime enabled

2. **Viewer Experience**
   - Rank badge during live
   - Season progress bar
   - Rank-up animations
   - Battle win streak indicators
   - Gift combo tracking
   - Near-rank-up nudges

3. **Creator Experience**
   - Season dashboard
   - Burnout protection
   - Daily caps
   - Cooldown suggestions
   - Top contributors view
   - Prestige history
   - Level display
   - Perk management

4. **Moderation**
   - Audit logging
   - Score zeroing
   - Reward revocation
   - Stream flagging
   - Safe moderation (no live impact)

5. **Admin Tools**
   - Season creation
   - Season ending
   - Rank recalculation
   - Statistics dashboard

---

## Testing Checklist

### Database
- [ ] Create a test season
- [ ] Verify status values (ACTIVE/ENDED)
- [ ] Test audit logging triggers
- [ ] Verify RLS policies

### Viewer Experience
- [ ] View rank badge during live
- [ ] See progress bar update
- [ ] Trigger near-rank-up nudge
- [ ] See rank-up animation
- [ ] View battle win streak

### Creator Experience
- [ ] View season dashboard
- [ ] See burnout warnings
- [ ] View top contributors
- [ ] Check prestige history
- [ ] View level progress
- [ ] Equip/unequip perks

### Moderation
- [ ] View audit logs
- [ ] Zero a score
- [ ] Revoke a reward
- [ ] Restore a score
- [ ] Verify no live impact

---

## Migration Applied

**Migration**: `update_roast_seasons_and_add_audit_logging`

**Changes**:
- Updated status constraint to ACTIVE/ENDED
- Created audit logging tables
- Added RLS policies for audit tables
- Created audit logging triggers
- Created helper functions
- Added performance indexes
- Enabled realtime (already enabled)

---

## Notes

- **Formulas NOT Exposed**: Raw formulas are never shown to users
- **Server-Side Calculation**: All score calculations happen server-side
- **No Live Impact**: Moderation never affects live streaming
- **Opt-In**: Rankings only update when creator goes live
- **No Penalties**: No penalties for going offline
- **Levels Never Reset**: Creator levels are permanent
- **Seasons Reset**: Seasonal ranks reset each season
- **Prestige Preserved**: Past season achievements are archived

---

## Next Steps

1. **Seed Default Perks**: Create the 10 default perks in `creator_perks` table
2. **Create First Season**: Use `SeasonAdminPanel` to create the first season
3. **Test Live Integration**: Test the overlay components during a live stream
4. **Configure Cron**: Ensure the daily recalculation cron is running
5. **Monitor Audit Logs**: Check that all score changes are being logged

---

## Support

For issues or questions:
1. Check audit logs in `SeasonModerationPanel`
2. Verify season status in `SeasonAdminPanel`
3. Check Supabase logs for edge function errors
4. Review RLS policies if data access issues occur
