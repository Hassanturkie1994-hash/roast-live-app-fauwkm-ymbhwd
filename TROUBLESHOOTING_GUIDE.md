
# 🔧 Troubleshooting Guide

## Common Issues & Solutions

---

### 🚫 Community Guidelines Issues

#### Issue: "PGRST116: JSON object requested, multiple (or no) rows returned"
**Cause:** Using `.single()` when row might not exist
**Solution:** Already fixed - service uses `.maybeSingle()`
**Verification:**
```typescript
// ✅ Correct (in communityGuidelinesService.ts)
.maybeSingle()

// ❌ Wrong
.single()
```

#### Issue: "Duplicate key value violates unique constraint"
**Cause:** Trying to insert when record already exists
**Solution:** Already fixed - service uses `upsert()` with `onConflict`
**Verification:**
```typescript
// ✅ Correct
.upsert({...}, { onConflict: 'user_id,version' })

// ❌ Wrong
.insert({...})
```

#### Issue: Modal doesn't appear when going live
**Cause:** State not being set correctly
**Solution:** Check these files:
1. `go-live-modal.tsx` - Line ~50: `setShowCommunityGuidelinesModal(true)`
2. `pre-live-setup.tsx` - Line ~200: `setShowCommunityGuidelinesModal(true)`
3. `index.tsx` - Line ~150: `setShowCommunityGuidelinesModal(true)`

**Debug:**
```typescript
console.log('Has accepted guidelines:', hasAcceptedGuidelines);
console.log('Showing modal:', showCommunityGuidelinesModal);
```

#### Issue: Acceptance not saving to database
**Cause:** RLS policy blocking insert/update
**Solution:** Already fixed - UPDATE policy added
**Verification:**
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'community_guidelines_acceptance';

-- Should show 3 policies: SELECT, INSERT, UPDATE
```

---

### ⚠️ React Key Warnings

#### Issue: "Warning: Each child in a list should have a unique 'key' prop"
**Cause:** Missing or duplicate keys in `.map()`
**Solution:** All fixed, but if you add new lists, use this pattern:

```typescript
// ✅ Correct - Use database ID
{items.map((item) => (
  <View key={item.id}>
    {/* content */}
  </View>
))}

// ✅ Correct - Use composite key
{items.map((item) => (
  <View key={`${type}-${item.id}`}>
    {/* content */}
  </View>
))}

// ❌ Wrong - Don't use index
{items.map((item, index) => (
  <View key={index}>
    {/* content */}
  </View>
))}
```

#### Issue: Keys are undefined or null
**Cause:** Data not loaded yet or missing IDs
**Solution:** Add fallback or conditional rendering

```typescript
// ✅ Correct
{items.map((item, index) => (
  <View key={item.id || `fallback-${index}`}>
    {/* content */}
  </View>
))}

// ✅ Better - Don't render if no ID
{items.filter(item => item.id).map((item) => (
  <View key={item.id}>
    {/* content */}
  </View>
))}
```

---

### ⏱️ Stream Creation Timeout

#### Issue: Stream creation hangs forever
**Cause:** Network issues or Cloudflare API problems
**Solution:** Already fixed - 30-second timeout implemented
**Expected Behavior:**
1. User clicks "Go Live"
2. Loading screen appears
3. If successful: Stream starts within 5-10 seconds
4. If timeout: Error screen appears after 30 seconds
5. User can retry or exit

#### Issue: Timeout happens too quickly
**Cause:** Timeout value too low
**Solution:** Adjust in `LiveStreamStateMachine.tsx`
```typescript
const STREAM_CREATION_TIMEOUT = 30000; // 30 seconds
// Increase if needed: 45000 = 45 seconds
```

#### Issue: Multiple stream creation calls
**Cause:** Component re-rendering during creation
**Solution:** Already fixed with `streamCreationAttemptRef`
**Verification:**
```typescript
// Check console logs
// Should see only ONE "Starting stream creation" message
// If you see multiple, check for:
// - useEffect dependencies
// - State updates causing re-renders
```

---

### 🔍 Profile Search Issues

#### Issue: Search returns no results
**Possible Causes & Solutions:**

1. **No users in database**
   ```sql
   -- Check if users exist
   SELECT COUNT(*) FROM profiles;
   ```

2. **RLS blocking query**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   
   -- Ensure there's a policy allowing SELECT for authenticated users
   ```

3. **Search query too specific**
   - Try searching for just "h" or "ha"
   - Should return all users starting with those letters

4. **Case sensitivity issue**
   - Already fixed with `ILIKE`
   - Verify query uses `ILIKE` not `LIKE`

#### Issue: Search is too slow
**Cause:** No debouncing or too many results
**Solution:** Already implemented 300ms debounce
**Optimization:**
```typescript
// Adjust debounce delay in SearchScreen.tsx or index.tsx
setTimeout(() => {
  performSearch(searchQuery);
}, 300); // Increase to 500 if still slow
```

#### Issue: Clicking search result doesn't navigate
**Cause:** Navigation handler not working
**Solution:** Check `handleUserPress` function
```typescript
const handleUserPress = (userId: string) => {
  console.log('Navigating to profile:', userId); // Debug log
  router.push({
    pathname: '/screens/PublicProfileScreen',
    params: { userId },
  });
};
```

---

### 👥 Dashboard Visibility Issues

#### Issue: Regular user still sees Dashboard
**Possible Causes:**

1. **Role not set correctly in database**
   ```sql
   -- Check user role
   SELECT id, username, role FROM profiles WHERE id = '<user_id>';
   
   -- Should be 'USER' or NULL for regular users
   ```

2. **Role check not working**
   ```typescript
   // Add debug logs in AccountSettingsScreen.tsx
   console.log('User role:', userRole);
   console.log('Is stream moderator:', isStreamModerator);
   console.log('Should show dashboard:', userRole || isStreamModerator);
   ```

3. **Conditional rendering broken**
   - Check that the condition is: `{(userRole || isStreamModerator) && ...}`
   - NOT: `{userRole && ...}` (would miss stream moderators)

#### Issue: Admin user doesn't see Dashboard
**Possible Causes:**

1. **Role not uppercase in database**
   ```sql
   -- Fix role casing
   UPDATE profiles 
   SET role = UPPER(role) 
   WHERE id = '<user_id>';
   ```

2. **Role check failing**
   ```typescript
   // Check adminService.checkAdminRole()
   const result = await adminService.checkAdminRole(user.id);
   console.log('Admin check result:', result);
   // Should return: { role: 'ADMIN', isAdmin: true }
   ```

---

## 🔄 State Machine Issues

### Issue: State machine stuck in STREAM_CREATING
**Cause:** Timeout not firing or cleanup not working
**Solution:**
```typescript
// Force reset (emergency only)
liveStreamState.resetToIdle();

// Or cancel creation
liveStreamState.cancelStreamCreation();
```

### Issue: Can't go live from certain states
**Cause:** Invalid state transition
**Solution:** Check `canGoLive()` function
```typescript
const canGoLive = () => {
  return currentState === 'CONTENT_LABEL_SELECTED' 
      || currentState === 'PRACTICE_MODE_ACTIVE';
};
```

---

## 🗄️ Database Issues

### Issue: RLS policy blocking operations
**Check policies:**
```sql
-- View all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'community_guidelines_acceptance';

-- Test policy manually
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user_id>';
SELECT * FROM community_guidelines_acceptance WHERE user_id = '<user_id>';
```

### Issue: Unique constraint violation
**Cause:** Trying to insert duplicate record
**Solution:** Use `upsert()` instead of `insert()`
```typescript
// ✅ Correct
.upsert({...}, { onConflict: 'user_id,version' })

// ❌ Wrong
.insert({...})
```

---

## 🎨 UI Issues

### Issue: Modal not showing
**Debug checklist:**
1. Check state: `console.log('Modal visible:', showModal)`
2. Check z-index: Modal should have high z-index
3. Check parent views: No `overflow: hidden` blocking modal
4. Check Modal props: `visible={true}` and `transparent={true}`

### Issue: Buttons not clickable
**Possible causes:**
1. Overlapping views with higher z-index
2. `pointerEvents="none"` on parent
3. Button disabled
4. TouchableOpacity has `activeOpacity={0}` (invisible feedback)

**Solution:**
```typescript
// Check button props
<TouchableOpacity
  onPress={handlePress}
  disabled={false} // Should be false
  activeOpacity={0.7} // Should be > 0
  style={{ zIndex: 100 }} // If needed
>
```

---

## 🌐 Network Issues

### Issue: Requests timing out
**Cause:** Slow network or server issues
**Solution:**
1. Check network connection
2. Verify Supabase URL is correct
3. Check if Supabase project is active
4. Increase timeout if needed

### Issue: Realtime subscriptions not working
**Cause:** Channel not subscribed or unsubscribed too early
**Solution:**
```typescript
// Ensure cleanup in useEffect
useEffect(() => {
  const channel = supabase.channel('my-channel')...
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [dependencies]);
```

---

## 🔐 Authentication Issues

### Issue: User not authenticated
**Cause:** Session expired or not logged in
**Solution:**
```typescript
// Check auth state
const { user } = useAuth();
if (!user) {
  router.replace('/auth/login');
  return;
}
```

### Issue: RLS blocking queries
**Cause:** User not authenticated or wrong user
**Solution:**
```typescript
// Verify auth.uid() matches user_id
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user:', user?.id);
```

---

## 📱 Platform-Specific Issues

### iOS Issues
- Camera permissions: Check Info.plist
- Notifications: Check entitlements
- Background modes: Check app.json

### Android Issues
- Camera permissions: Check AndroidManifest.xml
- Notifications: Check FCM setup
- Back button: Handled in broadcast screen

### Web Issues
- Camera not supported in some browsers
- WebRTC may have limitations
- Use feature detection

---

## 🛠️ Development Tools

### Useful Console Commands

```typescript
// Check current state
console.log('Current state:', liveStreamState.currentState);

// Check user role
console.log('User role:', userRole);

// Check search results
console.log('Search results:', searchResults);

// Check acceptance status
const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(user.id);
console.log('Has accepted:', hasAccepted);
```

### Useful SQL Queries

```sql
-- Check community guidelines acceptances
SELECT 
  cga.*,
  p.username,
  p.display_name
FROM community_guidelines_acceptance cga
JOIN profiles p ON p.id = cga.user_id
ORDER BY cga.accepted_at DESC;

-- Check user roles
SELECT username, display_name, role 
FROM profiles 
WHERE role IS NOT NULL 
ORDER BY role, username;

-- Check active streams
SELECT 
  s.*,
  p.username as broadcaster
FROM streams s
JOIN profiles p ON p.id = s.broadcaster_id
WHERE s.status = 'live';

-- Check transactions
SELECT 
  t.*,
  p.username
FROM transactions t
JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 20;
```

---

## 🎓 Best Practices Reminder

### React Keys
- ✅ Always use stable, unique identifiers
- ✅ Prefer database UUIDs
- ✅ Use composite keys when needed
- ❌ Never use array index
- ❌ Never use random values

### State Management
- ✅ Use refs for values that don't need re-render
- ✅ Use state for UI values
- ✅ Use context for global state
- ✅ Clean up effects on unmount

### Error Handling
- ✅ Always show user-friendly messages
- ✅ Log detailed errors to console
- ✅ Provide retry options when possible
- ✅ Handle edge cases gracefully

### Database Queries
- ✅ Use `maybeSingle()` for optional records
- ✅ Use `upsert()` for idempotent operations
- ✅ Always check for errors
- ✅ Handle null/undefined results

### Performance
- ✅ Debounce user input
- ✅ Use memoization for expensive operations
- ✅ Limit query results
- ✅ Clean up subscriptions

---

## 📊 Monitoring

### What to Monitor

1. **Console Warnings**
   - React key warnings
   - State update warnings
   - Memory leaks

2. **Error Logs**
   - Database errors
   - Network errors
   - Permission errors

3. **User Feedback**
   - Can't go live
   - Search not working
   - Dashboard issues

4. **Performance**
   - Search response time
   - Stream creation time
   - UI responsiveness

---

## 🆘 Emergency Fixes

### If Community Guidelines Completely Broken
```typescript
// Temporary bypass (DEVELOPMENT ONLY)
// In communityGuidelinesService.ts
async hasAcceptedGuidelines(userId: string): Promise<boolean> {
  return true; // TEMPORARY - REMOVE AFTER FIXING
}
```

### If Search Completely Broken
```typescript
// Fallback to basic search
const { data } = await supabase
  .from('profiles')
  .select('*')
  .limit(20);
```

### If State Machine Stuck
```typescript
// Force reset
liveStreamState.resetToIdle();
router.back();
```

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check console logs
2. ✅ Check database records
3. ✅ Verify RLS policies
4. ✅ Test with different users
5. ✅ Check network connection

### Information to Provide

When reporting an issue, include:
- User ID
- Error message (exact text)
- Console logs
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## ✅ Health Check Script

Run this to verify everything is working:

```typescript
// Add to a test screen or run in console

async function healthCheck() {
  console.log('🏥 Running health check...');
  
  // 1. Check auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('✅ Auth:', user ? 'Logged in' : '❌ Not logged in');
  
  // 2. Check community guidelines table
  const { data: cga, error: cgaError } = await supabase
    .from('community_guidelines_acceptance')
    .select('count');
  console.log('✅ Community Guidelines Table:', cgaError ? '❌ Error' : '✅ OK');
  
  // 3. Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('count');
  console.log('✅ Profiles Table:', profilesError ? '❌ Error' : '✅ OK');
  
  // 4. Check search
  const searchResult = await searchService.searchUsers('test');
  console.log('✅ Search Service:', searchResult.success ? '✅ OK' : '❌ Error');
  
  // 5. Check role
  if (user) {
    const roleResult = await adminService.checkAdminRole(user.id);
    console.log('✅ Role Check:', roleResult.role || 'USER');
  }
  
  console.log('🏥 Health check complete!');
}

// Run it
healthCheck();
```

---

End of Troubleshooting Guide
