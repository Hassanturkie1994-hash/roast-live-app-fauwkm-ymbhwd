
# Service Quick Reference Card

## Import Services

```typescript
// Option 1: Use Service Registry (Recommended)
import { ServiceRegistry } from '@/app/services/serviceRegistry';

// Option 2: Import Individual Services
import { walletService, stripeService } from '@/app/services';
```

## Common Patterns

### Safe Service Calls

```typescript
import { useServiceIntegration } from '@/app/hooks/useServiceIntegration';

const { safeExecute } = useServiceIntegration();

const result = await safeExecute(
  () => ServiceRegistry.wallet.getBalance(userId),
  0 // fallback value
);
```

### Error Handling

```typescript
const result = await ServiceRegistry.stripe.createWalletTopUpSession(
  userId,
  amountCents,
  'SEK'
);

if (!result.success) {
  Alert.alert('Error', result.error || 'Operation failed');
  return;
}

// Use result.data
console.log('Success:', result.data);
```

### Defensive Checks

```typescript
if (!user?.id) {
  console.error('❌ Missing user ID');
  return;
}

if (!streamTitle.trim()) {
  Alert.alert('Error', 'Please enter a stream title');
  return;
}
```

## Service Cheat Sheet

### Streaming
```typescript
// Start stream
await ServiceRegistry.cloudflare.startLive({ title, userId });

// Stop stream
await ServiceRegistry.cloudflare.stopLive({ liveInputId, streamId });

// Fetch live streams
const streams = await ServiceRegistry.stream.fetchLive();

// Track viewer
await ServiceRegistry.viewerTracking.joinStream(streamId, userId);
```

### Wallet & Payments
```typescript
// Get balance
const balance = await ServiceRegistry.wallet.getBalance(userId);

// Add funds
const result = await ServiceRegistry.stripe.createWalletTopUpSession(
  userId,
  amountCents,
  'SEK'
);

// Purchase gift
const result = await ServiceRegistry.gift.purchase(
  giftId,
  senderId,
  receiverId,
  livestreamId
);
```

### Moderation
```typescript
// Check moderator
const isMod = await ServiceRegistry.moderation.isModerator(streamerId, userId);

// Ban user
await ServiceRegistry.moderation.banUser(streamerId, targetUserId, modId, reason);

// Timeout user
await ServiceRegistry.moderation.timeoutUser(
  streamId,
  targetUserId,
  streamerId,
  modId,
  durationMinutes
);
```

### Social
```typescript
// Follow user
await ServiceRegistry.follow.followUser(followerId, followingId);

// Like post
await ServiceRegistry.like.likePost(postId, userId);

// Send message
await ServiceRegistry.messaging.sendMessage(senderId, receiverId, message);
```

### Admin
```typescript
// Check admin role
const { role } = await ServiceRegistry.admin.checkAdminRole(userId);

// Get reports
const { reports } = await ServiceRegistry.admin.getReports({ status: 'open' });

// Force stop stream
await ServiceRegistry.admin.forceStopStream(adminId, streamId, broadcasterId, reason);
```

### Achievements
```typescript
// Get user achievements
const achievements = await ServiceRegistry.achievement.getUserAchievements(userId);

// Unlock achievement
await ServiceRegistry.achievement.unlockAchievement(userId, achievementKey);

// Check and unlock
await ServiceRegistry.achievement.checkAndUnlockAchievements(userId, 'gift_sent');
```

### Analytics
```typescript
// Track viewer join
await ServiceRegistry.analytics.trackViewerJoin(streamId, userId, deviceType, isFollower);

// Get stream metrics
const metrics = await ServiceRegistry.analytics.getStreamMetrics(streamId);

// Update gift amount
await ServiceRegistry.analytics.updateViewerGiftAmount(streamId, userId, amount);
```

### Notifications
```typescript
// Create notification
await ServiceRegistry.notification.createNotification(
  senderId,
  receiverId,
  'gift_received',
  message,
  undefined,
  undefined,
  streamId,
  'gifts'
);

// Get notifications
const { notifications } = await ServiceRegistry.notification.getNotificationsByCategory(
  userId,
  'gifts'
);

// Mark as read
await ServiceRegistry.notification.markAsRead(notificationId);
```

### Content Safety
```typescript
// Validate stream start
const validation = await ServiceRegistry.contentSafety.validateStreamStart(userId);

// Set content label
await ServiceRegistry.contentSafety.setStreamContentLabel(streamId, 'roast_mode');

// Check if user can stream
const { canStream, reason } = await ServiceRegistry.enhancedContentSafety.canUserLivestream(userId);
```

## Debugging

### Check Service Health
```typescript
import { checkServiceHealth } from '@/app/services/serviceRegistry';

const health = checkServiceHealth();
console.log('Services healthy:', health.healthy);
console.log('Service status:', health.services);
```

### View Service Health Screen
Navigate to `/screens/ServiceHealthScreen` to see real-time service status.

## Best Practices

1. ✅ Always use defensive checks before service calls
2. ✅ Use `useServiceIntegration` hook for lifecycle safety
3. ✅ Handle errors gracefully with user-friendly messages
4. ✅ Check `isMounted` before state updates
5. ✅ Clean up subscriptions in useEffect return
6. ✅ Use query cache for frequently accessed data
7. ✅ Implement retry logic for critical operations
8. ✅ Log errors for debugging
9. ✅ Provide loading states for async operations
10. ✅ Test service integrations thoroughly

## Common Issues

### Service not found
- Check import path
- Verify service is registered in `serviceRegistry.ts`

### Undefined values
- Add defensive checks: `if (!user?.id) return;`
- Use optional chaining: `user?.profile?.avatar`

### Memory leaks
- Use `useServiceIntegration` hook
- Clean up subscriptions: `return () => subscription.unsubscribe();`

### Race conditions
- Use `safeExecute` wrapper
- Check `isMounted` before state updates

### Stale data
- Clear cache when data changes
- Use real-time subscriptions for live data

## Support

For detailed documentation, see:
- `docs/SERVICE_INTEGRATION_GUIDE.md` - Comprehensive guide
- `docs/INTEGRATION_COMPLETE.md` - Integration summary
- Service implementation files in `app/services/`
