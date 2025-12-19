
# 🔥 Developer Guide - NEW Roast Systems

## 📚 Overview

This guide covers the **NEW Roast Live systems** that replaced all legacy systems.

**Target Audience**: Developers working on the Roast Live app

---

## 🎯 System Architecture

### Single Source of Truth

All systems follow the **Single Source of Truth** principle:

- ✅ One system per feature
- ✅ No duplicate functionality
- ✅ Clear ownership of data
- ✅ Event-driven architecture

### Event Whitelist

Only these sources can emit events:

```typescript
'RoastGiftEngine'
'RoastBattleManager'
'RoastSeasonEngine'
'RoastVIPEngine'
'RoastChatBadgeSystem'
'RoastLevelingSystem'
```

---

## 🎁 1. Roast Gift System

### Service

```typescript
import { roastGiftService } from '@/app/services/roastGiftService';
```

### Key Functions

```typescript
// Initialize service
roastGiftService.initialize();

// Send a gift
const result = await roastGiftService.sendGift(
  giftId: string,
  senderId: string,
  creatorId: string,
  streamId: string | null
);

// Subscribe to gifts
const unsubscribe = roastGiftService.subscribeToGifts(
  streamId: string,
  callback: (giftData: any) => void
);

// Get creator earnings
const earnings = await roastGiftService.getCreatorEarnings(
  creatorId: string,
  streamId?: string
);

// Get top roasters
const topRoasters = await roastGiftService.getTopRoasters(
  streamId: string,
  limit: number = 3
);
```

### Database Table

```sql
roast_gift_transactions (
  id UUID PRIMARY KEY,
  gift_id TEXT NOT NULL,
  price_sek INTEGER NOT NULL,
  sender_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  stream_id UUID,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Realtime Channel

```typescript
// Subscribe to gift events
const channel = supabase.channel(`roast_gifts:${streamId}`);
channel.on('broadcast', { event: 'gift_sent' }, (payload) => {
  // Handle gift received
});
```

### Gift Manifest

```typescript
import { ROAST_GIFT_MANIFEST, getRoastGiftById } from '@/constants/RoastGiftManifest';

// Get all gifts
const allGifts = ROAST_GIFT_MANIFEST; // 45 gifts

// Get gift by ID
const gift = getRoastGiftById('roast_nuke');

// Get gifts by tier
const ultraGifts = getRoastGiftsByTier('ULTRA');
```

---

## 👑 2. Roast VIP Club

### Service

```typescript
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';
import { vipLevelService } from '@/app/services/vipLevelService';
```

### Key Functions

```typescript
// Create VIP club
const result = await unifiedVIPClubService.createVIPClub(
  creatorId: string,
  clubName: string,
  badgeName: string,
  badgeColor: string,
  monthlyPriceSEK: number
);

// Get VIP club members
const members = await unifiedVIPClubService.getVIPClubMembers(clubId: string);

// Update VIP level after gift
const result = await vipLevelService.updateVIPLevelAfterGift(
  clubId: string,
  userId: string,
  giftAmountSEK: number
);

// Check if user is VIP member
const isMember = await unifiedVIPClubService.isVIPMember(
  clubId: string,
  userId: string
);
```

### Database Tables

```sql
vip_clubs (
  id UUID PRIMARY KEY,
  creator_id UUID UNIQUE,
  club_name TEXT,
  badge_name TEXT,
  badge_color TEXT,
  monthly_price_sek NUMERIC DEFAULT 30.00,
  is_active BOOLEAN DEFAULT true,
  total_members INTEGER DEFAULT 0
)

vip_club_members (
  id UUID PRIMARY KEY,
  club_id UUID,
  user_id UUID,
  vip_level INTEGER DEFAULT 1 CHECK (vip_level >= 1 AND vip_level <= 20),
  total_gifted_sek NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  join_method TEXT DEFAULT 'subscription'
)
```

### VIP Levels

- **Level 1-4**: Bronze VIP (0-999 kr)
- **Level 5-9**: Silver VIP (1000-4999 kr)
- **Level 10-14**: Gold VIP (5000-14999 kr)
- **Level 15-20**: Elite VIP (15000+ kr)

---

## 🏆 3. Roast Season Rankings

### Service

```typescript
import { leaderboardService } from '@/app/services/leaderboardService';
import { roastRankingService } from '@/services/roastRankingService';
```

### Key Functions

```typescript
// Get current season
const season = await leaderboardService.getCurrentSeason();

// Get creator ranking
const ranking = await leaderboardService.getCreatorRanking(
  creatorId: string,
  seasonId: string
);

// Update creator stats
await roastRankingService.updateCreatorStats(
  creatorId: string,
  updates: {
    giftsReceivedSek?: number;
    uniqueRoaster?: string;
    battlesWon?: number;
  }
);

// Get top creators
const topCreators = await leaderboardService.getTopCreators(
  seasonId: string,
  limit: number = 50
);
```

### Database Tables

```sql
roast_ranking_seasons (
  id UUID PRIMARY KEY,
  season_number INTEGER UNIQUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  duration_days INTEGER,
  status TEXT DEFAULT 'upcoming'
)

roast_ranking_entries (
  id UUID PRIMARY KEY,
  season_id UUID,
  creator_id UUID,
  rank INTEGER DEFAULT 0,
  composite_score INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  total_gifts_received_sek INTEGER DEFAULT 0,
  team_battles_won INTEGER DEFAULT 0,
  current_tier TEXT
)
```

### Scoring Formula

```typescript
composite_score = 
  (individual_weighted_gift_score * 0.5) +
  (team_contribution_score * 0.3) +
  (unique_roasters_impact * 0.1) +
  (hype_momentum_score * 0.1)
```

---

## ⚔️ 4. Roast Battle System

### Service

```typescript
import { battleService } from '@/app/services/battleService';
```

### Key Functions

```typescript
// Create battle lobby
const { lobby, error } = await battleService.createLobby(
  hostId: string,
  format: '1v1' | '2v2' | '3v3' | '4v4' | '5v5',
  returnToSoloStream: boolean,
  originalStreamId: string | null
);

// Join matchmaking queue
await battleService.joinMatchmakingQueue(lobbyId: string);

// Accept battle match
await battleService.acceptBattleMatch(
  matchId: string,
  userId: string,
  team: 'team_a' | 'team_b'
);

// Send gift during battle
await battleService.sendBattleGift(
  matchId: string,
  senderId: string,
  receiverTeam: 'team_a' | 'team_b',
  giftId: string,
  priceSEK: number
);
```

### Database Tables

```sql
battle_lobbies (
  id UUID PRIMARY KEY,
  host_id UUID,
  format TEXT CHECK (format IN ('1v1', '2v2', '3v3', '4v4', '5v5')),
  status TEXT DEFAULT 'waiting',
  team_a_players UUID[],
  team_b_players UUID[]
)

battle_team_matches (
  id UUID PRIMARY KEY,
  format TEXT,
  team_a_id UUID,
  team_b_id UUID,
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  winner_team TEXT,
  status TEXT DEFAULT 'pre_lobby'
)
```

---

## 📈 5. Creator Leveling

### Service

```typescript
import { creatorLevelingService } from '@/services/creatorLevelingService';
```

### Key Functions

```typescript
// Get creator level
const level = await creatorLevelingService.getCreatorLevel(creatorId: string);

// Award XP
await creatorLevelingService.awardXP(
  creatorId: string,
  xpAmount: number,
  source: 'gift' | 'battle' | 'stream_duration' | 'season'
);

// Get unlocked perks
const perks = await creatorLevelingService.getUnlockedPerks(creatorId: string);
```

### Database Table

```sql
creator_levels (
  id UUID PRIMARY KEY,
  creator_id UUID UNIQUE,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 50),
  current_xp BIGINT DEFAULT 0,
  xp_to_next_level BIGINT DEFAULT 1000,
  total_xp_earned BIGINT DEFAULT 0
)
```

### XP Formula

```typescript
xp_to_next_level = 1000 * (current_level ^ 1.5)
```

---

## 💬 6. Roast Chat Badges

### Database Table

```sql
chat_badge_metadata (
  id UUID PRIMARY KEY,
  user_id UUID,
  stream_id UUID,
  badge_type TEXT CHECK (badge_type IN ('creator', 'moderator', 'vip', 'top_roaster')),
  vip_level INTEGER,
  vip_badge_name TEXT,
  vip_badge_color TEXT,
  is_top_roaster BOOLEAN DEFAULT false
)
```

### Badge Priority

1. **Creator** (highest priority)
2. **Moderator**
3. **VIP** (with level)
4. **Top Roaster**

---

## 🔧 DEVELOPMENT WORKFLOW

### Adding a New Feature

1. **Check if it's a NEW Roast system**
   - If yes, proceed
   - If no, ensure it doesn't conflict with legacy systems

2. **Validate service name**
   ```typescript
   import { validateServiceInitialization } from '@/utils/legacySystemGuard';
   validateServiceInitialization('MyNewService');
   ```

3. **Add event source to whitelist** (if emitting events)
   ```typescript
   // constants/LegacySystemConfig.ts
   export const ALLOWED_EVENT_SOURCES = [
     // ... existing sources
     'MyNewEventSource',
   ] as const;
   ```

4. **Create service**
   ```typescript
   // app/services/myNewService.ts
   class MyNewService {
     initialize() {
       validateServiceInitialization('MyNewService');
       // ... initialization logic
     }
   }
   ```

5. **Register service**
   ```typescript
   // app/services/serviceRegistry.ts
   import { myNewService } from './myNewService';
   
   export const ServiceRegistry = {
     // ... existing services
     myNew: myNewService,
   };
   ```

---

## 🚨 COMMON PITFALLS

### ❌ DON'T: Use Legacy Service Names

```typescript
// ❌ BAD
import { oldGiftService } from './oldGiftService';

// ✅ GOOD
import { roastGiftService } from './roastGiftService';
```

### ❌ DON'T: Subscribe to Legacy Channels

```typescript
// ❌ BAD
const channel = supabase.channel('gifts:stream123');

// ✅ GOOD
const channel = supabase.channel('roast_gifts:stream123');
```

### ❌ DON'T: Access Legacy Tables

```typescript
// ❌ BAD
const { data } = await supabase.from('gift_transactions').select('*');

// ✅ GOOD
const { data } = await supabase.from('roast_gift_transactions').select('*');
```

### ❌ DON'T: Emit Events from Non-Whitelisted Sources

```typescript
// ❌ BAD
channel.send({
  type: 'broadcast',
  event: 'gift_sent',
  payload: { source: 'OldGiftEngine' } // ← Will be dropped
});

// ✅ GOOD
channel.send({
  type: 'broadcast',
  event: 'gift_sent',
  payload: { source: 'RoastGiftEngine' } // ← Will be processed
});
```

---

## 🔍 DEBUGGING

### Check Legacy System Status

```typescript
import { getActiveSystemsReport } from '@/utils/legacySystemGuard';

const report = getActiveSystemsReport();
console.log(report);
// {
//   legacySystemsEnabled: false,
//   activeSystems: ['RoastGiftEngine', 'RoastBattleManager', ...],
//   blockedSystems: ['old_gift_engine', 'old_vip_club', ...]
// }
```

### Check Service Health

```typescript
import { checkServiceHealth } from '@/app/services/serviceRegistry';

const health = checkServiceHealth();
console.log(health);
// {
//   healthy: true,
//   services: {
//     roastGift: true,
//     vipMembership: true,
//     leaderboard: true,
//     ...
//   }
// }
```

### Clear Legacy State

```typescript
import { clearLegacyPersistedState } from '@/constants/LegacySystemConfig';

await clearLegacyPersistedState();
```

---

## 📊 DATABASE SCHEMA

### NEW Roast System Tables

```
roast_gift_transactions
├── id (UUID)
├── gift_id (TEXT)
├── price_sek (INTEGER)
├── sender_id (UUID → auth.users)
├── creator_id (UUID → auth.users)
├── stream_id (UUID → streams)
└── status (TEXT)

vip_clubs
├── id (UUID)
├── creator_id (UUID → profiles)
├── club_name (TEXT)
├── badge_name (TEXT)
├── badge_color (TEXT)
├── monthly_price_sek (NUMERIC)
└── is_active (BOOLEAN)

vip_club_members
├── id (UUID)
├── club_id (UUID → vip_clubs)
├── user_id (UUID → profiles)
├── vip_level (INTEGER 1-20)
├── total_gifted_sek (NUMERIC)
├── status (TEXT)
└── join_method (TEXT)

roast_ranking_seasons
├── id (UUID)
├── season_number (INTEGER)
├── start_date (TIMESTAMPTZ)
├── end_date (TIMESTAMPTZ)
├── duration_days (INTEGER)
└── status (TEXT)

roast_ranking_entries
├── id (UUID)
├── season_id (UUID → roast_ranking_seasons)
├── creator_id (UUID → profiles)
├── rank (INTEGER)
├── composite_score (INTEGER)
├── battles_won (INTEGER)
├── total_gifts_received_sek (INTEGER)
└── current_tier (TEXT)

battle_team_matches
├── id (UUID)
├── format (TEXT)
├── team_a_id (UUID)
├── team_b_id (UUID)
├── team_a_score (INTEGER)
├── team_b_score (INTEGER)
├── winner_team (TEXT)
└── status (TEXT)

creator_levels
├── id (UUID)
├── creator_id (UUID → profiles)
├── current_level (INTEGER 1-50)
├── current_xp (BIGINT)
├── xp_to_next_level (BIGINT)
└── total_xp_earned (BIGINT)

chat_badge_metadata
├── id (UUID)
├── user_id (UUID → profiles)
├── stream_id (UUID → streams)
├── badge_type (TEXT)
├── vip_level (INTEGER)
├── vip_badge_name (TEXT)
└── vip_badge_color (TEXT)
```

---

## 🎨 UI COMPONENTS

### Roast Gift Components

```typescript
import RoastGiftSelector from '@/components/RoastGiftSelector';
import RoastGiftAnimationOverlay from '@/components/RoastGiftAnimationOverlay';
import CinematicGiftOverlay from '@/components/CinematicGiftOverlay';
```

### VIP Club Components

```typescript
import VIPClubPanel from '@/components/VIPClubPanel';
import VIPMemberList from '@/components/VIPMemberList';
import VIPActivityMetrics from '@/components/VIPActivityMetrics';
import UnifiedVIPClubBadge from '@/components/UnifiedVIPClubBadge';
```

### Season Ranking Components

```typescript
import RoastSeasonRankingDisplay from '@/components/RoastSeasonRankingDisplay';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import SeasonProgressOverlay from '@/components/SeasonProgressOverlay';
```

### Battle Components

```typescript
import BattleLobbyScreen from '@/app/screens/BattleLobbyScreen';
import BattleLiveMatchScreen from '@/app/screens/BattleLiveMatchScreen';
import BattlePostMatchScreen from '@/app/screens/BattlePostMatchScreen';
```

---

## 🔐 SECURITY & VALIDATION

### Event Source Validation

Always validate event sources:

```typescript
import { filterEventBySource } from '@/utils/legacySystemGuard';

// In your service
channel.on('broadcast', { event: 'my_event' }, (payload) => {
  const source = payload.payload?.source || 'unknown';
  
  if (!filterEventBySource(source, 'my_event')) {
    console.warn('Event dropped - invalid source');
    return;
  }
  
  // Process event
});
```

### Service Initialization Validation

Always validate service initialization:

```typescript
import { validateServiceInitialization } from '@/utils/legacySystemGuard';

class MyService {
  initialize() {
    validateServiceInitialization('MyService');
    // ... initialization logic
  }
}
```

---

## 📝 CODING STANDARDS

### Service Structure

```typescript
class MyService {
  private initialized = false;
  
  public initialize(): void {
    validateServiceInitialization('MyService');
    
    if (this.initialized) return;
    
    console.log('🚀 [MyService] Initializing...');
    this.initialized = true;
  }
  
  public destroy(): void {
    console.log('🗑️ [MyService] Destroying...');
    this.initialized = false;
  }
  
  public async myMethod(): Promise<{ success: boolean; error?: string }> {
    try {
      // ... logic
      return { success: true };
    } catch (error) {
      console.error('❌ [MyService] Error:', error);
      return { success: false, error: 'Error message' };
    }
  }
}

export const myService = new MyService();
```

### Event Emission

```typescript
// Always include source in payload
channel.send({
  type: 'broadcast',
  event: 'my_event',
  payload: {
    source: 'MyEventSource', // ← REQUIRED
    // ... other data
  },
});
```

---

## 🧪 TESTING

### Unit Tests

```typescript
import { roastGiftService } from '@/app/services/roastGiftService';

describe('RoastGiftService', () => {
  it('should send gift successfully', async () => {
    const result = await roastGiftService.sendGift(
      'roast_nuke',
      'sender-id',
      'creator-id',
      'stream-id'
    );
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';
import { vipLevelService } from '@/app/services/vipLevelService';

describe('VIP Level Progression', () => {
  it('should level up after gift threshold', async () => {
    // Create VIP club
    const club = await unifiedVIPClubService.createVIPClub(...);
    
    // Send gift
    await roastGiftService.sendGift(...);
    
    // Check level
    const result = await vipLevelService.updateVIPLevelAfterGift(...);
    
    expect(result.leveledUp).toBe(true);
  });
});
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation

- `LEGACY_SYSTEM_HARD_SHUTDOWN_COMPLETE.md` - Full implementation details
- `LEGACY_SHUTDOWN_QUICK_REFERENCE.md` - Quick reference
- `USER_GUIDE_LEGACY_SHUTDOWN.md` - User-facing guide

### Key Files

- `constants/LegacySystemConfig.ts` - Kill switch
- `utils/legacySystemGuard.ts` - Runtime guards
- `constants/RoastGiftManifest.ts` - Gift catalog
- `app/services/serviceRegistry.ts` - Service registry

---

## 🎊 BEST PRACTICES

### ✅ DO

- ✅ Use NEW Roast system services
- ✅ Validate event sources
- ✅ Follow naming conventions
- ✅ Add console logs for debugging
- ✅ Handle errors gracefully
- ✅ Use TypeScript types

### ❌ DON'T

- ❌ Use legacy service names
- ❌ Access legacy tables
- ❌ Subscribe to legacy channels
- ❌ Emit events from non-whitelisted sources
- ❌ Set `LEGACY_SYSTEMS_ENABLED = true`

---

**END OF DEVELOPER GUIDE**
