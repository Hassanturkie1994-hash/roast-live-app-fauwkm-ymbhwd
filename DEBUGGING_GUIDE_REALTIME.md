
# 🐛 Debugging Guide: Realtime & RLS Issues

## Common Issues & Solutions

---

## 1. VIP Club Chat: "Row violates RLS policy"

### Symptoms
- Error when sending VIP club message
- Message doesn't appear in chat
- Console shows RLS policy violation

### Debug Steps

**Step 1: Verify user is authenticated**
```typescript
console.log('Current user:', user?.id);
console.log('Auth UID:', (await supabase.auth.getUser()).data.user?.id);
```

**Step 2: Check VIP membership**
```sql
SELECT * FROM vip_club_members 
WHERE user_id = 'user-id' 
  AND club_id = 'club-id' 
  AND status = 'active';
```

**Step 3: Check RLS policies**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'vip_club_chat_messages';
```

**Step 4: Test policy manually**
```sql
-- As the user, try to select
SELECT * FROM vip_club_chat_messages 
WHERE club_id = 'club-id';

-- Should return messages if member, empty if not
```

### Solutions

**If user is not a member:**
- Join the VIP club first
- Verify membership status is 'active'
- Check subscription hasn't expired

**If user is a member but still fails:**
- Check `auth.uid()` matches `user_id` in insert
- Verify RLS policies are enabled
- Check for typos in club_id

**If creator cannot access:**
- Verify creator_id matches in vip_clubs table
- Check RLS policy includes creator check

---

## 2. Follow System: Foreign Key Constraint Error

### Symptoms
- Error when following user
- "violates foreign key constraint"
- Follow button doesn't work

### Debug Steps

**Step 1: Verify user exists in profiles**
```sql
SELECT id, username FROM profiles 
WHERE id = 'user-id-to-follow';
```

**Step 2: Check foreign key constraints**
```sql
SELECT
  tc.constraint_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'followers';
```

**Step 3: Try manual insert**
```sql
INSERT INTO followers (follower_id, following_id)
VALUES ('your-user-id', 'user-to-follow-id');
```

### Solutions

**If user doesn't exist in profiles:**
- User might only exist in auth.users
- Create profile row:
```sql
INSERT INTO profiles (id, username, display_name)
SELECT id, email, email FROM auth.users
WHERE id = 'user-id'
ON CONFLICT (id) DO NOTHING;
```

**If foreign keys point to wrong table:**
- Run migration to fix foreign keys
- See `IMPLEMENTATION_COMPLETE_SUPABASE_RLS_REALTIME.md`

**If duplicate follow:**
- Unique constraint prevents duplicates
- Check if already following:
```sql
SELECT * FROM followers 
WHERE follower_id = 'user-a' 
  AND following_id = 'user-b';
```

---

## 3. Messages Not Appearing in Real-time

### Symptoms
- Messages don't appear without refresh
- Realtime subscription not working
- Console shows no broadcast events

### Debug Steps

**Step 1: Check subscription status**
```typescript
const channel = supabase.channel('conversation:123:messages');
console.log('Channel state:', channel.state);
// Should be 'subscribed'
```

**Step 2: Verify broadcast event**
```typescript
channel.on('broadcast', { event: 'message_created' }, (payload) => {
  console.log('📨 Broadcast received:', payload);
});
```

**Step 3: Check trigger exists**
```sql
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'messages'::regclass;
```

**Step 4: Test trigger manually**
```sql
INSERT INTO messages (conversation_id, sender_id, content)
VALUES ('conv-id', 'user-id', 'test message');

-- Check if pg_notify was called
```

### Solutions

**If subscription fails:**
```typescript
// Ensure private channel config
const channel = supabase.channel('conversation:123:messages', {
  config: { private: true }
});

// Set auth after subscription
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await supabase.realtime.setAuth();
  }
});
```

**If trigger doesn't exist:**
- Run migration again
- Verify function exists:
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'notify_private_message';
```

**If broadcast not received:**
- Check channel name matches exactly
- Verify event name is correct
- Ensure user is authenticated
- Check realtime is enabled in Supabase dashboard

---

## 4. Message Requests Not Working

### Symptoms
- Request not created
- Cannot accept/reject
- Request doesn't appear in inbox

### Debug Steps

**Step 1: Check if request was created**
```sql
SELECT * FROM message_requests 
WHERE conversation_id = 'conv-id';
```

**Step 2: Verify RLS policies**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'message_requests';
```

**Step 3: Check follow status**
```sql
SELECT * FROM followers 
WHERE follower_id = 'sender-id' 
  AND following_id = 'recipient-id';
```

**Step 4: Test manual insert**
```sql
INSERT INTO message_requests (
  conversation_id, 
  requester_id, 
  recipient_id, 
  status
) VALUES (
  'conv-id', 
  'sender-id', 
  'recipient-id', 
  'pending'
);
```

### Solutions

**If request not created:**
- Check `getOrCreateConversation` logic
- Verify follow check is working
- Ensure conversation exists first

**If cannot accept/reject:**
- Verify user is recipient
- Check RLS policy allows UPDATE
- Ensure status is 'pending'

**If request doesn't appear:**
- Check `getMessageRequests` query
- Verify recipient_id matches
- Check status is 'pending'

---

## 5. Search Not Working

### Symptoms
- No results returned
- Partial matching doesn't work
- Results not clickable

### Debug Steps

**Step 1: Test search query**
```sql
SELECT id, username, display_name 
FROM profiles 
WHERE username ILIKE '%hass%' 
   OR display_name ILIKE '%hass%';
```

**Step 2: Check service method**
```typescript
const result = await searchService.searchUsers('hass');
console.log('Search result:', result);
```

**Step 3: Verify navigation**
```typescript
console.log('Navigating to:', userId);
router.push({
  pathname: '/screens/PublicProfileScreen',
  params: { userId },
});
```

### Solutions

**If no results:**
- Check search term is lowercase
- Verify ILIKE operator used
- Check profiles table has data

**If partial matching fails:**
- Ensure `%` wildcards used
- Check case-insensitive search
- Verify column names correct

**If navigation fails:**
- Check userId is valid
- Verify screen is registered
- Check route path is correct

---

## 6. Private Profile Content Visible

### Symptoms
- Private profile shows content to non-followers
- Privacy setting not working
- Content not hidden

### Debug Steps

**Step 1: Check user settings**
```sql
SELECT profile_visibility 
FROM user_settings 
WHERE user_id = 'user-id';
```

**Step 2: Check follow status**
```sql
SELECT * FROM followers 
WHERE follower_id = 'viewer-id' 
  AND following_id = 'profile-owner-id';
```

**Step 3: Verify content fetch logic**
```typescript
const isPublic = settings?.profile_visibility === 'public';
const canViewContent = isPublic || isFollowing || isOwnProfile;

if (canViewContent) {
  // Fetch posts and streams
} else {
  // Show privacy message
}
```

### Solutions

**If setting not saved:**
- Check upsert query
- Verify user_id correct
- Check for database errors

**If content still visible:**
- Verify `canViewContent` logic
- Check `isFollowing` is accurate
- Ensure privacy check runs before fetch

**If privacy message not shown:**
- Check `isPrivateProfile` variable
- Verify `renderContent()` logic
- Ensure conditional rendering works

---

## 7. Follow Button Not Updating

### Symptoms
- Button doesn't change after tap
- Loading state stuck
- Error not shown

### Debug Steps

**Step 1: Check optimistic update**
```typescript
console.log('Before:', localFollowing);
setLocalFollowing(!localFollowing);
console.log('After:', localFollowing);
```

**Step 2: Check service call**
```typescript
const result = await followService.followUser(userId1, userId2);
console.log('Follow result:', result);
```

**Step 3: Check error recovery**
```typescript
try {
  await onPress();
} catch (error) {
  console.error('Follow error:', error);
  setLocalFollowing(localFollowing); // Revert
}
```

### Solutions

**If button doesn't update:**
- Check `setLocalFollowing` is called
- Verify state is used in render
- Ensure component re-renders

**If loading stuck:**
- Check `setLoading(false)` in finally block
- Verify async function completes
- Check for infinite loops

**If error not handled:**
- Add try-catch block
- Revert optimistic update
- Show error alert

---

## 8. Realtime Subscription Leaks

### Symptoms
- Multiple subscriptions created
- Memory usage increases
- Duplicate messages received

### Debug Steps

**Step 1: Check cleanup**
```typescript
useEffect(() => {
  const channel = supabase.channel('...');
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [dependencies]);
```

**Step 2: Monitor active channels**
```typescript
console.log('Active channels:', supabase.getChannels());
```

**Step 3: Check for duplicate subscriptions**
```typescript
if (channelRef.current?.state === 'subscribed') {
  console.log('Already subscribed');
  return;
}
```

### Solutions

**If multiple subscriptions:**
- Use `channelRef` to track subscription
- Check if already subscribed before creating new
- Clean up in useEffect return

**If memory leak:**
- Ensure `removeChannel` called
- Verify cleanup runs on unmount
- Check dependencies array

**If duplicate messages:**
- Remove duplicate subscriptions
- Use unique channel names
- Check event handlers

---

## 🔧 Debugging Tools

### Console Logging
```typescript
// Add strategic logs
console.log('🔌 Subscribing to channel:', channelName);
console.log('📨 Message received:', payload);
console.log('✅ Operation successful');
console.log('❌ Error occurred:', error);
```

### Supabase Dashboard
- Check RLS policies
- View table data
- Monitor realtime connections
- Check logs

### React DevTools
- Inspect component state
- Check prop values
- Monitor re-renders
- View context values

### Network Tab
- Monitor API calls
- Check WebSocket connections
- Verify request/response
- Check for errors

---

## 🆘 Emergency Fixes

### App Won't Open
```typescript
// Check _layout.tsx for errors
// Verify all providers are imported
// Check ErrorBoundary is working
```

### Database Locked
```sql
-- Check for long-running queries
SELECT * FROM pg_stat_activity 
WHERE state = 'active';

-- Kill if needed
SELECT pg_terminate_backend(pid);
```

### Realtime Not Working
```typescript
// Check Supabase dashboard
// Verify realtime is enabled
// Check API keys are correct
// Test with simple channel
```

### RLS Blocking Everything
```sql
-- Temporarily disable RLS (TESTING ONLY)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Monitoring

### Key Metrics to Watch

**Database:**
- Query response time
- Connection pool usage
- RLS policy hits
- Index usage

**Realtime:**
- Active subscriptions
- Message throughput
- Connection drops
- Reconnection rate

**App:**
- Crash rate
- Error frequency
- User engagement
- Feature usage

---

## ✅ Health Check

Run this query to verify everything is working:

```sql
-- Check critical tables
SELECT 
  'followers' as table_name,
  COUNT(*) as row_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'followers') as policy_count
FROM followers
UNION ALL
SELECT 
  'message_requests',
  COUNT(*),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'message_requests')
FROM message_requests
UNION ALL
SELECT 
  'vip_club_chat_messages',
  COUNT(*),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vip_club_chat_messages')
FROM vip_club_chat_messages;
```

**Expected:**
- ✅ All tables exist
- ✅ All have RLS policies
- ✅ Row counts reasonable

---

## 🎯 Quick Fixes

### Reset Realtime Connection
```typescript
// Disconnect all channels
supabase.removeAllChannels();

// Reconnect
const channel = supabase.channel('...');
channel.subscribe();
```

### Clear Message Request
```sql
-- If stuck in pending
UPDATE message_requests 
SET status = 'accepted' 
WHERE id = 'request-id';
```

### Fix Follow Count
```sql
-- Recalculate follower count
UPDATE profiles 
SET followers_count = (
  SELECT COUNT(*) FROM followers 
  WHERE following_id = profiles.id
)
WHERE id = 'user-id';
```

### Refresh User Session
```typescript
await supabase.auth.refreshSession();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📞 Support Contacts

**Database Issues:**
- Check Supabase dashboard
- Review migration logs
- Contact Supabase support

**Realtime Issues:**
- Check WebSocket connection
- Verify API keys
- Test with simple channel

**App Crashes:**
- Check error logs
- Review ErrorBoundary
- Test on different devices

---

**Remember: Most issues are solved by checking auth, RLS policies, and realtime subscriptions!** 🔍
