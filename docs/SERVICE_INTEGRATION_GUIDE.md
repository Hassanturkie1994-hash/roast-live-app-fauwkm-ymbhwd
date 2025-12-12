
# Service Integration Guide

## Overview

This document provides a comprehensive guide for integrating all frontend services in the Roast Live app. All services are properly registered, accessible, and integrated with the UI and navigation flow.

## Service Registry

All services are centrally registered in `app/services/serviceRegistry.ts`. This ensures:
- ✅ All services are properly initialized
- ✅ Type-safe access to services
- ✅ Health checks for critical services
- ✅ Easy service discovery

### Usage Example

```typescript
import { ServiceRegistry } from '@/app/services/serviceRegistry';

// Access any service
const streams = await ServiceRegistry.stream.fetchLive();
const wallet = await ServiceRegistry.wallet.getBalance(userId);
```

## Service Categories

### 1. Core Services
- **Achievement Service**: User achievements, badges, milestones
- **Admin Service**: Admin dashboard, moderation, user management
- **Analytics Service**: Stream analytics, viewer tracking, engagement metrics

### 2. Streaming Services
- **Stream Service**: Live stream management, fetching streams
- **Cloudflare Service**: Start/stop live streams via Cloudflare
- **Viewer Tracking Service**: Track viewers joining/leaving streams
- **Stream Archive Service**: Archive completed streams
- **Replay Service**: VOD playback, replay management

### 3. Monetization Services
- **Wallet Service**: User wallet management, balance operations
- **Stripe Service**: Payment processing, checkout sessions
- **Gift Service**: Virtual gifts, gift transactions
- **Payout Service**: Creator payouts, earnings withdrawal
- **VIP Membership Service**: Premium subscriptions

### 4. Social Services
- **Follow Service**: User following/followers
- **Like Service**: Post/stream likes
- **Comment Service**: Comments on streams/posts
- **Messaging Service**: Direct messages
- **Notification Service**: In-app notifications

### 5. Safety & Moderation Services
- **Moderation Service**: Ban, timeout, remove content
- **Content Safety Service**: Content labeling, safety checks
- **Enhanced Content Safety Service**: Advanced safety features
- **Reporting Service**: User reports, report management
- **Device Ban Service**: Device-level bans

### 6. Creator Services
- **Creator Club Service**: Creator clubs, membership management
- **Fan Club Service**: Fan clubs, subscriber management
- **Creator Earnings Service**: Earnings tracking, revenue analytics

## Integration Patterns

### 1. Using Services in Screens

```typescript
import { useServiceIntegration } from '@/app/hooks/useServiceIntegration';
import { ServiceRegistry } from '@/app/services/serviceRegistry';

export default function MyScreen() {
  const { safeExecute } = useServiceIntegration();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await safeExecute(
        () => ServiceRegistry.stream.fetchLive(),
        [] // fallback value
      );
      
      if (result) {
        setData(result);
      }
    };

    fetchData();
  }, [safeExecute]);

  return <View>...</View>;
}
```

### 2. Error Handling

All services return consistent error responses:

```typescript
const result = await ServiceRegistry.wallet.addFunds(userId, amount);

if (!result.success) {
  Alert.alert('Error', result.error || 'Operation failed');
  return;
}

// Success - use result.data
console.log('Success:', result.data);
```

### 3. Defensive Checks

Always validate parameters before calling services:

```typescript
const startStream = async () => {
  // Defensive checks
  if (!user?.id) {
    console.error('❌ Missing user ID');
    return;
  }

  if (!streamTitle.trim()) {
    Alert.alert('Error', 'Please enter a stream title');
    return;
  }

  // Safe to call service
  const result = await ServiceRegistry.cloudflare.startLive({
    title: streamTitle,
    userId: user.id,
  });
};
```

### 4. Lifecycle Management

Use the `useServiceIntegration` hook to ensure services are called safely:

```typescript
const { isMounted, safeExecute } = useServiceIntegration();

useEffect(() => {
  const subscription = supabase
    .channel('my-channel')
    .on('broadcast', { event: 'update' }, (payload) => {
      // Only update state if component is still mounted
      if (isMounted) {
        setData(payload);
      }
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [isMounted]);
```

## Service-Specific Integration

### Live Streaming Flow

1. **Start Stream**
   ```typescript
   const result = await ServiceRegistry.cloudflare.startLive({
     title: streamTitle,
     userId: user.id,
   });
   
   if (result.success) {
     setCurrentStream(result.stream);
     setIsLive(true);
   }
   ```

2. **Track Viewers**
   ```typescript
   await ServiceRegistry.viewerTracking.joinStream(streamId, userId);
   ```

3. **End Stream**
   ```typescript
   await ServiceRegistry.cloudflare.stopLive({
     liveInputId: stream.live_input_id,
     streamId: stream.id,
   });
   
   await ServiceRegistry.viewerTracking.cleanupStreamViewers(streamId);
   ```

### Gift Flow

1. **Fetch Available Gifts**
   ```typescript
   const { data: gifts } = await ServiceRegistry.gift.fetch();
   ```

2. **Purchase Gift**
   ```typescript
   const result = await ServiceRegistry.gift.purchase(
     giftId,
     senderId,
     receiverId,
     livestreamId
   );
   
   if (result.success) {
     // Broadcast gift animation
     broadcastGift(result.giftEvent);
   }
   ```

### Wallet Flow

1. **Get Balance**
   ```typescript
   const balance = await ServiceRegistry.wallet.getBalance(userId);
   ```

2. **Add Funds**
   ```typescript
   const result = await ServiceRegistry.stripe.createWalletTopUpSession(
     userId,
     amountCents,
     'SEK'
   );
   
   if (result.success) {
     // Open Stripe checkout
     openCheckout(result.data.url);
   }
   ```

### Moderation Flow

1. **Check Moderator Status**
   ```typescript
   const isMod = await ServiceRegistry.moderation.isModerator(
     streamerId,
     userId
   );
   ```

2. **Ban User**
   ```typescript
   const result = await ServiceRegistry.moderation.banUser(
     streamerId,
     targetUserId,
     moderatorId,
     reason
   );
   ```

3. **Timeout User**
   ```typescript
   const result = await ServiceRegistry.moderation.timeoutUser(
     streamId,
     targetUserId,
     streamerId,
     moderatorId,
     durationMinutes
   );
   ```

## Navigation Integration

All service-backed features have corresponding screens:

### Admin Features
- `/screens/AdminDashboardScreen` - Main admin dashboard
- `/screens/AdminReportsScreen` - User reports management
- `/screens/AdminLiveStreamsScreen` - Live stream monitoring
- `/screens/AdminPenaltiesScreen` - User penalties
- `/screens/RoleManagementScreen` - Admin role management

### Wallet & Payments
- `/screens/WalletScreen` - Wallet balance and transactions
- `/screens/AddBalanceScreen` - Add funds via Stripe
- `/screens/TransactionHistoryScreen` - Transaction history
- `/screens/WithdrawScreen` - Withdraw earnings

### Creator Features
- `/screens/CreatorEarningsScreen` - Earnings dashboard
- `/screens/StreamDashboardScreen` - Stream analytics
- `/screens/FanClubManagementScreen` - Fan club management
- `/screens/CreatorClubSetupScreen` - Creator club setup

### Streaming
- `/screens/BroadcasterScreen` - Go live, stream controls
- `/screens/ViewerScreen` - Watch live streams
- `/screens/ReplayPlayerScreen` - Watch replays
- `/screens/ArchivedStreamsScreen` - Browse archived streams

### Social
- `/screens/PublicProfileScreen` - User profiles
- `/screens/ChatScreen` - Direct messages
- `/screens/InboxScreen` - Message inbox
- `/screens/LeaderboardScreen` - Leaderboards

## Performance Optimization

### 1. Query Caching

Services use `queryCache` to avoid redundant network calls:

```typescript
import { queryCache } from '@/app/services/queryCache';

const fetchData = async () => {
  const cacheKey = `streams:live`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from API
  const data = await fetchFromAPI();
  
  // Cache result
  queryCache.set(cacheKey, data, 60000); // 1 minute TTL
  
  return data;
};
```

### 2. Debouncing

Use debouncing for search and real-time features:

```typescript
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce(async (query: string) => {
    const results = await ServiceRegistry.search.searchUsers(query);
    setSearchResults(results);
  }, 300),
  []
);
```

### 3. Pagination

Implement pagination for large datasets:

```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (!hasMore) return;
  
  const result = await ServiceRegistry.stream.fetchPast(20, page);
  
  if (result.length < 20) {
    setHasMore(false);
  }
  
  setStreams(prev => [...prev, ...result]);
  setPage(prev => prev + 1);
};
```

## Error Handling Best Practices

### 1. User-Friendly Messages

```typescript
const handleError = (error: string) => {
  const userMessage = error.includes('insufficient balance')
    ? 'You don\'t have enough balance. Please add funds.'
    : 'Something went wrong. Please try again.';
  
  Alert.alert('Error', userMessage);
};
```

### 2. Retry Logic

```typescript
const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Graceful Degradation

```typescript
const fetchData = async () => {
  try {
    const data = await ServiceRegistry.stream.fetchLive();
    setStreams(data);
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    // Show cached data or empty state
    setStreams([]);
  }
};
```

## Testing Services

### Unit Testing

```typescript
import { ServiceRegistry } from '@/app/services/serviceRegistry';

describe('WalletService', () => {
  it('should add funds successfully', async () => {
    const result = await ServiceRegistry.wallet.addFunds(
      'user-id',
      10000,
      { source: 'test' }
    );
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Gift Flow', () => {
  it('should complete gift purchase flow', async () => {
    // 1. Fetch gifts
    const { data: gifts } = await ServiceRegistry.gift.fetch();
    expect(gifts).toBeDefined();
    
    // 2. Purchase gift
    const result = await ServiceRegistry.gift.purchase(
      gifts[0].id,
      'sender-id',
      'receiver-id',
      'stream-id'
    );
    expect(result.success).toBe(true);
    
    // 3. Verify wallet balance updated
    const balance = await ServiceRegistry.wallet.getBalance('sender-id');
    expect(balance).toBeLessThan(initialBalance);
  });
});
```

## Troubleshooting

### Common Issues

1. **Service not found**
   - Check that service is registered in `serviceRegistry.ts`
   - Verify import path is correct

2. **Undefined values**
   - Add defensive checks before calling services
   - Use optional chaining: `user?.id`

3. **Memory leaks**
   - Use `useServiceIntegration` hook
   - Clean up subscriptions in useEffect return

4. **Race conditions**
   - Use `safeExecute` from `useServiceIntegration`
   - Check `isMounted` before state updates

5. **Stale data**
   - Clear cache when data changes
   - Use real-time subscriptions for live data

## Conclusion

All services are now properly integrated, accessible, and stable. The app behaves as a cohesive system where frontend UI, navigation, and services operate smoothly together.

For questions or issues, refer to the service implementation files in `app/services/`.
