
# Testing Guide: Season Ranking & Creator Leveling

## Prerequisites

1. ✅ Supabase project is running
2. ✅ All migrations have been applied
3. ✅ Default perks have been seeded
4. ✅ At least one test user account exists

---

## Test 1: Create First Season

### Steps
1. Log in as an admin user
2. Navigate to admin panel
3. Use `SeasonAdminPanel` component
4. Create a new season:
   - Name: "Test Season 1"
   - Duration: 14 days
5. Verify season is created with status `ACTIVE`

### Expected Results
- ✅ New season appears in database
- ✅ Status is `ACTIVE`
- ✅ Default rank tiers are created
- ✅ Season config is created with default weights

### SQL Verification
```sql
SELECT * FROM roast_ranking_seasons ORDER BY created_at DESC LIMIT 1;
SELECT * FROM roast_rank_tiers WHERE season_id = 'season-uuid';
SELECT * FROM roast_season_config WHERE season_id = 'season-uuid';
```

---

## Test 2: Viewer Experience

### Steps
1. Start a live stream as a creator
2. Join the stream as a viewer
3. Verify `LiveSeasonIntegration` component displays:
   - Rank badge with tier icon
   - Season progress bar
   - Current rank number

### Expected Results
- ✅ Rank badge visible in top-left
- ✅ Progress bar shows 0% (new creator)
- ✅ Tier shows "Bronze Mouth" or "Unranked"

### Test Near-Rank-Up Nudge
1. Manually update creator's score to 90% of next tier
2. Verify nudge banner appears
3. Verify pulsing animation on badge
4. Tap nudge banner
5. Verify gift selector opens

---

## Test 3: Gift Impact on Rankings

### Steps
1. Send a gift to the creator during live stream
2. Verify gift transaction is created with status `CONFIRMED`
3. Wait for realtime update
4. Verify season score increases

### Expected Results
- ✅ Gift transaction created
- ✅ Creator stats updated
- ✅ Season score increases (if in ranked battle)
- ✅ Progress bar animates to new value
- ✅ Audit log entry created

### SQL Verification
```sql
SELECT * FROM roast_gift_transactions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM creator_season_scores WHERE creator_id = 'creator-uuid';
SELECT * FROM season_score_audit_log ORDER BY created_at DESC LIMIT 1;
```

---

## Test 4: Battle Participation

### Steps
1. Create a ranked battle (2v2)
2. Complete the battle
3. Record battle participation for all 4 creators
4. Verify season scores update

### Expected Results
- ✅ Battle participation records created
- ✅ Season scores updated for all participants
- ✅ Winners get win bonus
- ✅ Losers get 50% credit
- ✅ Ranks recalculated

### SQL Verification
```sql
SELECT * FROM roast_team_battle_participation ORDER BY created_at DESC LIMIT 4;
SELECT * FROM creator_season_scores ORDER BY season_score DESC;
SELECT * FROM season_score_audit_log ORDER BY created_at DESC LIMIT 4;
```

---

## Test 5: Rank-Up Animation

### Steps
1. Manually increase creator's score to trigger rank improvement
2. Verify rank-up animation displays
3. Verify haptic feedback triggers
4. Verify animation auto-dismisses after 3 seconds

### Expected Results
- ✅ Full-screen celebration overlay appears
- ✅ Confetti animation plays
- ✅ New rank number displays
- ✅ Haptic feedback triggers
- ✅ Auto-dismisses after 3 seconds

### Manual Score Update (for testing)
```sql
UPDATE creator_season_scores
SET season_score = season_score + 1000
WHERE creator_id = 'creator-uuid';
```

---

## Test 6: Creator Dashboard

### Steps
1. Log in as a creator
2. Navigate to profile/dashboard
3. View `CreatorSeasonDashboard` component
4. Verify all sections display correctly

### Expected Results
- ✅ Current season card shows rank and tier
- ✅ Progress to next tier displays
- ✅ Daily activity section shows (if streaming today)
- ✅ Top contributors section toggles
- ✅ Prestige history shows past seasons (if any)

---

## Test 7: Burnout Protection

### Steps
1. Start streaming as a creator
2. Stream for 3+ hours (or manually set session duration)
3. Verify burnout warnings appear

### Expected Results
- ✅ Session duration displays
- ✅ Diminishing returns warning after 3 hours
- ✅ Cooldown suggestion after 4 hours
- ✅ Daily cap warning if reached

### Manual Testing (Simulate Long Session)
```typescript
// In CreatorBurnoutProtection component, temporarily set:
const durationMinutes = 240; // 4 hours
```

---

## Test 8: Creator Leveling

### Steps
1. View creator level display
2. Verify current level shows
3. Verify XP progress bar displays
4. Verify XP sources breakdown shows
5. View unlocked perks
6. Equip a perk
7. Verify perk is marked as equipped

### Expected Results
- ✅ Level displays (starts at 1)
- ✅ XP progress shows 0%
- ✅ XP sources all show 0
- ✅ No perks unlocked yet
- ✅ Upcoming perks show (Level 5, 10, etc.)

### Award Test XP
```sql
UPDATE creator_levels
SET 
  current_xp = 5000,
  total_xp_earned = 5000,
  xp_from_gifts = 5000
WHERE creator_id = 'creator-uuid';
```

---

## Test 9: Perk Unlocking

### Steps
1. Manually set creator to level 5
2. Verify perk unlock notification
3. Verify perk appears in unlocked perks
4. Equip the perk
5. Verify perk is equipped

### Expected Results
- ✅ Perk automatically unlocked at level 5
- ✅ Perk appears in unlocked list
- ✅ Can equip/unequip perk
- ✅ Equipped state persists

### Manual Level Update
```sql
UPDATE creator_levels
SET current_level = 5
WHERE creator_id = 'creator-uuid';
```

---

## Test 10: Moderation

### Steps
1. Log in as admin
2. Open `SeasonModerationPanel`
3. View audit logs
4. Zero a creator's score
5. Verify audit log entry created
6. Restore the score
7. Verify restoration logged

### Expected Results
- ✅ Audit logs display
- ✅ Score zeroed successfully
- ✅ Audit log shows old → new score
- ✅ Score restored successfully
- ✅ Restoration logged

### SQL Verification
```sql
SELECT * FROM season_score_audit_log 
WHERE creator_id = 'creator-uuid'
ORDER BY created_at DESC;
```

---

## Test 11: Season End

### Steps
1. Create a test season
2. Add some test rankings
3. End the season via admin panel
4. Verify rewards are granted
5. Verify season status changes to `ENDED`

### Expected Results
- ✅ Season status changes to `ENDED`
- ✅ Rewards created in `creator_season_rewards`
- ✅ Rewards also in `roast_seasonal_rewards`
- ✅ Audit logs created for rewards

### SQL Verification
```sql
SELECT * FROM roast_ranking_seasons WHERE id = 'season-uuid';
SELECT * FROM creator_season_rewards WHERE season_id = 'season-uuid';
SELECT * FROM reward_grant_audit_log WHERE season_id = 'season-uuid';
```

---

## Test 12: Realtime Updates

### Steps
1. Open two devices/browsers
2. Device A: View creator's season dashboard
3. Device B: Update creator's score manually
4. Verify Device A updates in real-time

### Expected Results
- ✅ Score updates without refresh
- ✅ Progress bar animates
- ✅ Rank updates if changed
- ✅ Tier updates if changed

### Manual Score Update
```sql
UPDATE creator_season_scores
SET season_score = season_score + 500
WHERE creator_id = 'creator-uuid';
```

---

## Test 13: Daily Recalculation

### Steps
1. Verify cron job is set up
2. Manually trigger the edge function
3. Verify ranks are recalculated
4. Verify tiers are assigned correctly

### Expected Results
- ✅ All ranks updated
- ✅ Tiers assigned based on score
- ✅ `last_recalculated_at` updated

### Manual Trigger
```bash
supabase functions invoke recalculate-season-rankings
```

Or via SQL:
```sql
SELECT cron.schedule(
  'recalculate-season-rankings',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/recalculate-season-rankings',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## Test 14: Anti-Whale Protection

### Steps
1. Simulate a whale sending 40% of team's gifts
2. Verify diminishing returns applied
3. Verify season score is capped appropriately

### Expected Results
- ✅ Whale detection triggers
- ✅ Excess gifts get 50% multiplier
- ✅ Season score is lower than without protection

### Note
This is calculated server-side in `calculateSeasonScore()` method.

---

## Test 15: Decay Rules

### Steps
1. Create battle participation from 8 days ago
2. Verify decay is applied
3. Create recent participation (< 48 hours)
4. Verify 2x weight is applied

### Expected Results
- ✅ Old activity decays
- ✅ Recent activity weighted higher
- ✅ Tournament battles get 20% boost

### Note
Decay is calculated in `applyDecay()` method.

---

## Performance Tests

### Load Test: Leaderboard
```typescript
// Load top 1000 creators
const rankings = await roastRankingService.getSeasonRankings(
  seasonId,
  'global',
  1000
);

console.time('leaderboard-load');
// Should complete in < 500ms
console.timeEnd('leaderboard-load');
```

### Load Test: Creator Progress
```typescript
console.time('progress-load');
const { data } = await supabase
  .rpc('get_creator_season_progress', { p_creator_id: creatorId });
console.timeEnd('progress-load');
// Should complete in < 200ms
```

---

## Edge Cases

### Test: No Active Season
- ✅ Components gracefully handle no season
- ✅ "No active season" message displays
- ✅ No errors thrown

### Test: Creator Not Ranked
- ✅ Shows "Unranked" status
- ✅ Progress shows 0%
- ✅ Rank shows as 0 or N/A

### Test: Max Level (50)
- ✅ Progress shows 100%
- ✅ "Max level reached" message
- ✅ No XP bar overflow

### Test: Max Tier (Legendary Menace)
- ✅ Progress shows 100%
- ✅ "Max tier reached" message
- ✅ No next tier threshold

---

## Automated Testing (Future)

### Unit Tests
```typescript
describe('roastRankingService', () => {
  it('should calculate season score correctly', async () => {
    const score = await roastRankingService.calculateSeasonScore(
      mockParticipation,
      mockConfig
    );
    expect(score).toBeGreaterThan(0);
  });

  it('should apply anti-whale protection', async () => {
    // Test whale detection
  });

  it('should apply decay rules', async () => {
    // Test decay calculation
  });
});
```

### Integration Tests
```typescript
describe('Season Integration', () => {
  it('should create season and tiers', async () => {
    const season = await roastRankingService.createSeason(14);
    expect(season).toBeDefined();
    expect(season.status).toBe('ACTIVE');
  });

  it('should record battle participation', async () => {
    // Test battle recording
  });

  it('should recalculate ranks', async () => {
    // Test rank recalculation
  });
});
```

---

## Checklist

### Database
- [ ] All tables exist
- [ ] RLS policies configured
- [ ] Triggers active
- [ ] Indexes created
- [ ] Realtime enabled
- [ ] Default perks seeded

### Components
- [ ] LiveSeasonIntegration renders
- [ ] SeasonProgressOverlay displays
- [ ] CreatorSeasonDashboard loads
- [ ] CreatorBurnoutProtection shows warnings
- [ ] CreatorLevelDisplay shows level
- [ ] SeasonAdminPanel accessible
- [ ] SeasonModerationPanel accessible

### Services
- [ ] roastRankingService methods work
- [ ] creatorLevelingService methods work
- [ ] seasonModerationService methods work

### Realtime
- [ ] Season updates broadcast
- [ ] Rank updates broadcast
- [ ] Gift events broadcast
- [ ] Level updates broadcast

### Moderation
- [ ] Audit logs created
- [ ] Score zeroing works
- [ ] Reward revocation works
- [ ] Score restoration works
- [ ] No live impact

### Edge Functions
- [ ] recalculate-season-rankings works
- [ ] Cron job scheduled
- [ ] Daily recalculation runs

---

## Common Issues & Solutions

### Issue: "No active season"
**Solution**: Create a season using admin panel or service

### Issue: Ranks not updating
**Solution**: Trigger manual recalculation or wait for daily cron

### Issue: Audit logs empty
**Solution**: Verify triggers are active and score has changed

### Issue: Realtime not working
**Solution**: Check Supabase realtime logs and verify subscription

### Issue: Components not rendering
**Solution**: Verify user has data in creator_season_scores table

---

## Success Criteria

✅ All 15 tests pass
✅ No console errors
✅ Realtime updates work
✅ Audit logs populate
✅ Moderation doesn't affect live
✅ Burnout warnings display
✅ Rank-up animations trigger
✅ Perks unlock at correct levels
✅ Season can be created and ended
✅ Leaderboard loads quickly (< 500ms)

---

## Next Steps After Testing

1. Monitor audit logs for first week
2. Adjust season config weights if needed
3. Add more perks for higher levels
4. Create promotional materials for seasons
5. Set up analytics dashboard
6. Plan first official season launch
