
# Season Ranking & Leveling - Quick Reference

## 🚀 Quick Integration

### Add to Live Stream (Viewer Side)
```tsx
import { LiveSeasonIntegration } from '@/components/LiveSeasonIntegration';

<LiveSeasonIntegration
  creatorId={creatorId}
  streamId={streamId}
  onGiftPress={() => setShowGiftSelector(true)}
/>
```

### Add to Creator Dashboard
```tsx
import { CreatorSeasonDashboard } from '@/components/CreatorSeasonDashboard';
import { CreatorLevelDisplay } from '@/components/CreatorLevelDisplay';

<CreatorSeasonDashboard creatorId={userId} />
<CreatorLevelDisplay creatorId={userId} showPerks={true} />
```

### Add Burnout Protection (Broadcaster Side)
```tsx
import { CreatorBurnoutProtection } from '@/components/CreatorBurnoutProtection';

<CreatorBurnoutProtection creatorId={userId} streamId={streamId} />
```

---

## 📊 Common Queries

### Get Active Season
```typescript
import { roastRankingService } from '@/services/roastRankingService';

const season = await roastRankingService.getCurrentSeason();
```

### Get Creator Progress
```typescript
const { data } = await supabase
  .rpc('get_creator_season_progress', { p_creator_id: creatorId });
```

### Get Leaderboard
```typescript
const rankings = await roastRankingService.getSeasonRankings(
  seasonId,
  'global',
  100
);
```

### Get Creator Level
```typescript
import { creatorLevelingService } from '@/services/creatorLevelingService';

const level = await creatorLevelingService.getCreatorLevel(creatorId);
```

---

## 🎯 React Hooks

### useSeasonRanking
```typescript
import { useSeasonRanking } from '@/hooks/useSeasonRanking';

const {
  loading,
  progress,
  ranking,
  tiers,
  isNearRankUp,
  refresh,
} = useSeasonRanking(creatorId);
```

### useCreatorLevel
```typescript
import { useCreatorLevel } from '@/hooks/useCreatorLevel';

const {
  loading,
  level,
  allPerks,
  unlockedPerks,
  equippedPerks,
  progress,
  equipPerk,
  unequipPerk,
  refresh,
} = useCreatorLevel(creatorId);
```

---

## 🔔 Realtime Subscriptions

### Season Updates
```typescript
supabase
  .channel('roast_season_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'roast_ranking_seasons',
  }, (payload) => {
    console.log('Season updated:', payload);
  })
  .subscribe();
```

### Creator Rank Updates
```typescript
supabase
  .channel(`creator_rank_updates:${creatorId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'creator_season_scores',
    filter: `creator_id=eq.${creatorId}`,
  }, (payload) => {
    console.log('Rank updated:', payload);
  })
  .subscribe();
```

---

## 🎮 Battle Integration

### Record Battle Results
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
  battle_type: 'ranked', // 'casual' | 'ranked' | 'tournament'
  battle_duration_minutes: 15,
});
```

---

## 🛡️ Moderation

### Flag Stream
```typescript
import { seasonModerationService } from '@/services/seasonModerationService';

await seasonModerationService.flagStreamForReview(
  streamId,
  creatorId,
  'Suspicious activity'
);
```

### Zero Score (Fraud)
```typescript
await seasonModerationService.zeroCreatorScore(
  seasonId,
  creatorId,
  'Confirmed fraud'
);
```

### Revoke Reward
```typescript
await seasonModerationService.revokeSeasonalReward(
  seasonId,
  creatorId,
  rewardId,
  'Fraudulent activity'
);
```

---

## 📈 Rank Tiers

| Tier | Icon | Score Range | Color |
|------|------|-------------|-------|
| Bronze Mouth | 🥉 | 0 - 1,000 | #CD7F32 |
| Silver Tongue | 🥈 | 1,001 - 3,000 | #C0C0C0 |
| Golden Roast | 🥇 | 3,001 - 7,000 | #FFD700 |
| Diamond Disrespect | 💎 | 7,001 - 15,000 | #B9F2FF |
| Legendary Menace | 👑 | 15,001+ | #FF0000 |

---

## 🎖️ Creator Levels

| Level Range | Tier | Color |
|-------------|------|-------|
| 1-9 | Beginner | #CCCCCC |
| 10-19 | Intermediate | #CD7F32 |
| 20-29 | Advanced | #C0C0C0 |
| 30-39 | Expert | #FFD700 |
| 40-49 | Master | #FF1493 |
| 50 | Legendary | #FF0000 |

---

## 🎁 XP Awards

### Gifts
- LOW (1-10 SEK): 10 XP
- MID (20-100 SEK): 50 XP
- HIGH (150-500 SEK): 200 XP
- ULTRA (2000-4000 SEK): 1000 XP

### Battles
- 1v1 Win: 500 XP
- 2v2 Win: 400 XP
- 3v3 Win: 350 XP
- 4v4 Win: 300 XP
- 5v5 Win: 250 XP

### Streaming
- Every 30 min: 100 XP
- Every hour: 250 XP

### Seasons
- Complete season: 1000 XP
- Top 10 finish: 5000 XP bonus

---

## 🔧 Admin Commands

### Create Season
```typescript
const season = await roastRankingService.createSeason(14); // 14 days
```

### End Season
```typescript
await roastRankingService.endSeasonAndGrantRewards(seasonId);
```

### Recalculate Rankings
```typescript
await seasonModerationService.recalculateRankingsAfterModeration(seasonId);
```

---

## 📝 Audit Logs

### View Score Changes
```sql
SELECT * FROM season_score_audit_log 
WHERE creator_id = 'creator-uuid'
ORDER BY created_at DESC;
```

### View Reward Grants
```sql
SELECT * FROM reward_grant_audit_log 
WHERE creator_id = 'creator-uuid'
ORDER BY created_at DESC;
```

---

## 🐛 Debugging

### Check Active Season
```sql
SELECT * FROM get_active_season();
```

### Check Creator Progress
```sql
SELECT * FROM get_creator_season_progress('creator-uuid', NULL);
```

### Check Realtime
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN ('roast_ranking_seasons', 'creator_season_scores', 'creator_season_rewards');
```

### Check Triggers
```sql
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname IN ('season_score_audit_trigger', 'reward_grant_audit_trigger');
```

---

## ⚠️ Important Rules

### DO
- ✅ Only record ranked/tournament battles
- ✅ Validate gifts are CONFIRMED before affecting rankings
- ✅ Check stream flags before updating rankings
- ✅ Log all moderation actions
- ✅ Use server-side functions for score calculation

### DON'T
- ❌ Don't expose raw formulas to users
- ❌ Don't penalize creators for going offline
- ❌ Don't force participation
- ❌ Don't affect live streaming with moderation
- ❌ Don't allow client-side score manipulation
- ❌ Don't reset creator levels (only seasons reset)

---

## 📱 Component Locations

| Component | Path |
|-----------|------|
| LiveSeasonIntegration | `components/LiveSeasonIntegration.tsx` |
| SeasonProgressOverlay | `components/SeasonProgressOverlay.tsx` |
| CreatorSeasonDashboard | `components/CreatorSeasonDashboard.tsx` |
| CreatorBurnoutProtection | `components/CreatorBurnoutProtection.tsx` |
| CreatorLevelDisplay | `components/CreatorLevelDisplay.tsx` |
| SeasonAdminPanel | `components/SeasonAdminPanel.tsx` |
| SeasonModerationPanel | `components/SeasonModerationPanel.tsx` |
| RankUpCelebration | `components/RankUpCelebration.tsx` |
| ViewerRankingDisplay | `components/ViewerRankingDisplay.tsx` |
| RoastSeasonRankingDisplay | `components/RoastSeasonRankingDisplay.tsx` |

---

## 🔗 Service Locations

| Service | Path |
|---------|------|
| roastRankingService | `services/roastRankingService.ts` |
| creatorLevelingService | `services/creatorLevelingService.ts` |
| seasonModerationService | `services/seasonModerationService.ts` |

---

## 🪝 Hook Locations

| Hook | Path |
|------|------|
| useSeasonRanking | `hooks/useSeasonRanking.ts` |
| useCreatorLevel | `hooks/useCreatorLevel.ts` |
