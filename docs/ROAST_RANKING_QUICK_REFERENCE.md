
# Roast Season Ranking - Quick Reference Guide

## For Developers

### Quick Start

```typescript
import { roastRankingService } from '@/services/roastRankingService';

// Get current season
const season = await roastRankingService.getCurrentSeason();

// Get user's ranking
const ranking = await roastRankingService.getUserRanking(userId);

// Get top 100 rankings
const leaderboard = await roastRankingService.getSeasonRankings(
  season.id,
  'global',
  100
);
```

### Recording Battle Participation

```typescript
// After a team battle ends
await roastRankingService.recordTeamBattleParticipation({
  season_id: currentSeasonId,
  creator_id: userId,
  match_id: battleMatchId,
  team: 'team_a', // or 'team_b'
  team_size: 3, // 1-5
  is_winner: true,
  individual_gift_coins: 5000, // Creator's share of gifts
  team_score: 12000, // Team's final score
  unique_roasters_count: 25, // Unique gifters
  peak_hype_reached: 150, // Peak hype value
  battle_type: 'ranked', // 'casual', 'ranked', or 'tournament'
  battle_duration_minutes: 10,
});
```

### Display User's Rank

```typescript
const ranking = await roastRankingService.getUserRanking(userId);

if (ranking) {
  return (
    <View>
      <Text>Rank: #{ranking.rank}</Text>
      <Text>Tier: {ranking.current_tier}</Text>
      <Text>Score: {ranking.composite_score}</Text>
      <Text>
        Team Battles: {ranking.team_battles_won}/{ranking.team_battles_participated}
      </Text>
    </View>
  );
}
```

### Get Rank Tiers

```typescript
const tiers = await roastRankingService.getRankTiers(seasonId);

tiers.forEach(tier => {
  console.log(`${tier.tier_name}: ${tier.min_score}-${tier.max_score || '∞'}`);
  console.log(`Badge: ${tier.badge_icon} ${tier.badge_color}`);
  console.log(`Rewards: ${tier.exclusive_gifts?.join(', ')}`);
});
```

### Get User's Seasonal Rewards

```typescript
const rewards = await roastRankingService.getUserSeasonalRewards(userId);

rewards.forEach(reward => {
  console.log(`Season ${reward.season_id}: ${reward.tier_name}`);
  console.log(`Final Rank: #${reward.final_rank}`);
  console.log(`Badge: ${reward.badge_icon}`);
  if (reward.is_top_tier) {
    console.log('🏆 TOP 10 REWARD!');
  }
});
```

## SeasonScore Breakdown

### Formula Components

```typescript
SeasonScore = 
  (IndividualWeightedGiftScore * 0.5) +
  (TeamContributionScore * 0.3) +
  (UniqueRoastersScore * 0.1) +
  (HypeMomentumScore * 0.1)
```

### Component Calculations

```typescript
// 1. Individual Weighted Gift Score
const afterPlatformCut = individualGiftCoins * 0.7; // 30% platform cut
const individualScore = Math.log10(afterPlatformCut + 1) * 1000;

// 2. Team Contribution Score
const teamSizeMultiplier = 1 / teamSize;
let teamScore = teamFinalScore * teamSizeMultiplier;
if (isWinner) {
  teamScore += getWinBonus(teamSize); // 500, 400, 350, 300, or 250
} else {
  teamScore *= 0.5; // Losing team gets 50% credit
}

// 3. Unique Roasters Score
const uniqueRoastersScore = (uniqueRoastersCount / teamSize) * 50;

// 4. Hype Momentum Score
const hypeMomentumScore = (peakHypeReached / teamSize) * 10;
```

## Rank Tiers

| Tier | Name | Min Score | Badge | Color |
|------|------|-----------|-------|-------|
| 1 | Bronze Mouth | 0 | 🥉 | #CD7F32 |
| 2 | Silver Tongue | 1,001 | 🥈 | #C0C0C0 |
| 3 | Golden Roast | 3,001 | 🥇 | #FFD700 |
| 4 | Diamond Disrespect | 7,001 | 💎 | #B9F2FF |
| 5 | Legendary Menace | 15,001+ | 👑 | #FF0000 |

## Battle Type Rules

```typescript
// Only ranked and tournament battles affect SeasonScore
if (battleType === 'casual') {
  // Do NOT record participation
  return;
}

// Tournament battles get 20% boost
if (battleType === 'tournament') {
  seasonScore *= 1.2;
}
```

## Decay Rules

```typescript
// Last 48 hours: 2x weight
if (hoursAgo <= 48) {
  return score * 2.0;
}

// 7 days: Progressive decay
if (hoursAgo <= 168) { // 7 * 24
  const decayFactor = 1 - (hoursAgo / 168) * 0.1;
  return score * Math.max(decayFactor, 0.5);
}

// Older: 50% minimum
return score * 0.5;
```

## Admin Functions

### Create New Season

```typescript
// Create a new 14-day season
const newSeason = await roastRankingService.createSeason(14);

// This will:
// 1. End current season
// 2. Create new season
// 3. Create default config
// 4. Create default rank tiers
```

### End Season and Grant Rewards

```typescript
// End season and grant rewards to all participants
await roastRankingService.endSeasonAndGrantRewards(seasonId);

// This will:
// 1. Freeze rankings
// 2. Grant tier-based rewards
// 3. Grant top-10 special rewards
// 4. Update season status to 'completed'
```

### Update Season Config

```typescript
// Update season weights and bonuses
await supabase
  .from('roast_season_config')
  .update({
    weight_individual_gifts: 0.6, // Increase individual weight
    win_bonus_1v1: 600, // Increase 1v1 win bonus
  })
  .eq('season_id', seasonId);
```

## Common Queries

### Get Top Creators

```sql
SELECT 
  r.*,
  p.username,
  p.avatar_url
FROM roast_ranking_entries r
JOIN profiles p ON r.creator_id = p.id
WHERE r.season_id = $1
ORDER BY r.rank ASC
LIMIT 100;
```

### Get Creator's Battle History

```sql
SELECT 
  p.*,
  m.format,
  m.winner_team,
  p.team,
  p.is_winner,
  p.season_score
FROM roast_team_battle_participation p
JOIN battle_team_matches m ON p.match_id = m.id
WHERE p.creator_id = $1
  AND p.season_id = $2
ORDER BY p.created_at DESC;
```

### Get Season Statistics

```sql
SELECT 
  COUNT(*) as total_participants,
  AVG(composite_score) as avg_score,
  MAX(composite_score) as max_score,
  SUM(team_battles_participated) as total_battles
FROM roast_ranking_entries
WHERE season_id = $1;
```

## Troubleshooting

### Rankings Not Updating

1. Check if season is active:
   ```typescript
   const season = await roastRankingService.getCurrentSeason();
   console.log('Season status:', season?.status);
   ```

2. Check if battle type is correct:
   ```typescript
   // Only 'ranked' and 'tournament' affect rankings
   if (battleType === 'casual') {
     console.log('Casual battles do not affect rankings');
   }
   ```

3. Check if participation was recorded:
   ```sql
   SELECT * FROM roast_team_battle_participation
   WHERE creator_id = $1 AND season_id = $2
   ORDER BY created_at DESC;
   ```

### Score Calculation Issues

1. Verify gift amounts:
   ```typescript
   // Platform cut should be applied
   const afterPlatformCut = individualGiftCoins * 0.7;
   console.log('After platform cut:', afterPlatformCut);
   ```

2. Check team size multiplier:
   ```typescript
   const multiplier = 1 / teamSize;
   console.log('Team size multiplier:', multiplier);
   ```

3. Verify win bonus:
   ```typescript
   const bonus = getWinBonus(teamSize, config);
   console.log('Win bonus:', bonus);
   ```

### Rewards Not Granted

1. Check season status:
   ```sql
   SELECT status FROM roast_ranking_seasons WHERE id = $1;
   ```

2. Check if rewards already granted:
   ```sql
   SELECT * FROM roast_seasonal_rewards
   WHERE season_id = $1 AND creator_id = $2;
   ```

3. Manually grant rewards:
   ```typescript
   await roastRankingService.endSeasonAndGrantRewards(seasonId);
   ```

## Performance Tips

### Caching

```typescript
// Cache current season (5 min TTL)
const cachedSeason = await cache.get('current_season');
if (!cachedSeason) {
  const season = await roastRankingService.getCurrentSeason();
  await cache.set('current_season', season, 300);
}

// Cache rank tiers (1 hour TTL)
const cachedTiers = await cache.get(`tiers_${seasonId}`);
if (!cachedTiers) {
  const tiers = await roastRankingService.getRankTiers(seasonId);
  await cache.set(`tiers_${seasonId}`, tiers, 3600);
}
```

### Batch Updates

```typescript
// Update multiple creators at once
const participations = [/* ... */];
for (const participation of participations) {
  await roastRankingService.recordTeamBattleParticipation(participation);
}
```

### Pagination

```typescript
// Get rankings in pages
const page = 1;
const pageSize = 50;
const offset = (page - 1) * pageSize;

const { data, error } = await supabase
  .from('roast_ranking_entries')
  .select('*')
  .eq('season_id', seasonId)
  .order('rank', { ascending: true })
  .range(offset, offset + pageSize - 1);
```

## Security Notes

- ✅ All ranking calculations are server-side
- ✅ RLS policies protect ranking data
- ✅ Only confirmed gifts affect rankings
- ✅ Battle type filtering prevents casual battle abuse
- ✅ Anti-whale protection prevents single-donor dominance
- ✅ Formulas are not exposed to clients

## Support

For issues or questions:
1. Check this quick reference
2. Review the main implementation document
3. Check the service code in `services/roastRankingService.ts`
4. Review database schema in migrations

---

**Last Updated:** December 2024
