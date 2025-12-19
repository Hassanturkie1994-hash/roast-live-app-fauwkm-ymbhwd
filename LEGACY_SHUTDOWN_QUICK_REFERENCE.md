
# 🚨 LEGACY SHUTDOWN - QUICK REFERENCE

## 🔴 CRITICAL: LEGACY SYSTEMS ARE PERMANENTLY DISABLED

**DO NOT** attempt to use or reactivate legacy systems.

---

## 📍 Key Configuration

### Kill Switch Location

```
constants/LegacySystemConfig.ts
```

### Current Status

```typescript
export const LEGACY_SYSTEMS_ENABLED = false; // ← DO NOT CHANGE
```

---

## ✅ ACTIVE SYSTEMS (NEW ROAST ONLY)

### Services

- `roastGiftService` - Roast Gift System (45 gifts)
- `vipMembershipService` - Roast VIP Club (levels 1-20)
- `leaderboardService` - Roast Season Rankings
- `battleService` - Roast Battle System (1v1 → 5v5)
- `creatorEarningsService` - Creator Leveling (levels 1-50)

### Database Tables

- `roast_gift_transactions` - Gift transactions
- `vip_clubs` - VIP clubs
- `vip_club_members` - VIP members
- `roast_ranking_seasons` - Ranking seasons
- `roast_ranking_entries` - Creator rankings
- `battle_team_matches` - Battle matches
- `chat_badge_metadata` - Chat badges
- `creator_levels` - Creator levels

### Realtime Channels

- `roast_gifts:{stream_id}` - Gift events
- `vip_level_up:{club_id}` - VIP level ups
- `roast_season_updates` - Season updates
- `battle_updates:{match_id}` - Battle updates

---

## ❌ BLOCKED SYSTEMS (LEGACY)

### Services (REMOVED)

- ❌ `oldGiftService`
- ❌ `oldVIPService`
- ❌ `oldRankingService`
- ❌ `oldBattleService`
- ❌ `oldBadgeService`

### Database Tables (DROPPED)

- ❌ `gift_events`
- ❌ `gift_transactions`
- ❌ `gifts`
- ❌ `old_vip_members`
- ❌ `old_vip_clubs`
- ❌ `old_rankings`
- ❌ `old_leaderboards`
- ❌ `old_battle_matches`
- ❌ `old_chat_badges`

### Realtime Channels (BLOCKED)

- ❌ `gifts:*`
- ❌ `old_vip:*`
- ❌ `old_ranking:*`
- ❌ `old_battle:*`
- ❌ `legacy_*`

---

## 🔧 COMMON TASKS

### Add a New Gift

1. Edit `constants/RoastGiftManifest.ts`
2. Add gift to `ROAST_GIFT_MANIFEST` array
3. Rebuild app

### Add a New VIP Perk

1. Edit `vip_perk_config` table in Supabase
2. Update `components/VIPClubPanel.tsx`
3. Ensure perk is **cosmetic only** (no monetization advantage)

### Add a New Season

1. Use `roast_ranking_seasons` table
2. Set `start_date`, `end_date`, `duration_days`
3. System will auto-create rankings

### Add a New Battle Format

1. Edit `app/services/battleService.ts`
2. Add format to `BattleFormat` type
3. Update `battle_team_matches` table

---

## 🚨 TROUBLESHOOTING

### Error: "LEGACY SYSTEM BLOCKED"

**Cause**: Legacy system attempted to initialize

**Fix**: Remove legacy system import/initialization

### Error: "Event dropped - invalid source"

**Cause**: Event from non-whitelisted source

**Fix**: Add source to `ALLOWED_EVENT_SOURCES` in `constants/LegacySystemConfig.ts`

### Error: "Realtime subscription BLOCKED"

**Cause**: Attempting to subscribe to legacy channel

**Fix**: Use NEW Roast channel names (e.g., `roast_gifts:*` instead of `gifts:*`)

### Error: "Database access BLOCKED"

**Cause**: Attempting to access legacy table

**Fix**: Use NEW Roast tables (e.g., `roast_gift_transactions` instead of `gift_transactions`)

---

## 📊 VALIDATION COMMANDS

### Check Legacy System Status

```typescript
import { getActiveSystemsReport } from '@/utils/legacySystemGuard';

const report = getActiveSystemsReport();
console.log('Legacy systems enabled:', report.legacySystemsEnabled); // Should be false
console.log('Active systems:', report.activeSystems); // Should show NEW Roast systems
console.log('Blocked systems:', report.blockedSystems); // Should show legacy systems
```

### Clear Legacy State Manually

```typescript
import { clearLegacyPersistedState } from '@/constants/LegacySystemConfig';

await clearLegacyPersistedState();
```

---

## 🎯 EVENT SOURCE WHITELIST

Only these sources can emit events:

```typescript
'RoastGiftEngine'
'RoastBattleManager'
'RoastSeasonEngine'
'RoastVIPEngine'
'RoastChatBadgeSystem'
'RoastLevelingSystem'
```

Any event from other sources will be **DROPPED**.

---

## 🔒 SECURITY NOTES

### Why Hard Shutdown?

1. **Prevents data corruption** - No mixing of old and new data
2. **Prevents UI confusion** - Users see only one system
3. **Prevents event conflicts** - No duplicate events
4. **Prevents state conflicts** - No legacy state rehydration
5. **Enforces single source of truth** - Only NEW systems emit events

### What Happens if LEGACY_SYSTEMS_ENABLED = true?

```
🚨 App will THROW ERROR at startup
🚨 Build will FAIL (if build-time checks are enabled)
🚨 Legacy tables do not exist (dropped in migration)
🚨 Legacy services do not exist (removed from codebase)
```

**DO NOT SET TO TRUE**

---

## 📞 NEED HELP?

### Check These Files

1. `constants/LegacySystemConfig.ts` - Kill switch configuration
2. `utils/legacySystemGuard.ts` - Runtime guards
3. `app/_layout.tsx` - Startup initialization
4. `app/services/serviceRegistry.ts` - Service registry

### Check Console Logs

Look for these prefixes:

- `🛡️ [LEGACY GUARD]` - Legacy system guard logs
- `🎁 [RoastGiftService]` - Roast gift service logs
- `⚠️ EVENT DROPPED` - Event filtering logs
- `🚨 LEGACY SYSTEM BLOCKED` - Legacy system blocked logs

---

**END OF QUICK REFERENCE**
