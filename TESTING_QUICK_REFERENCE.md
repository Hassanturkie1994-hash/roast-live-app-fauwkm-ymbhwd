
# Testing Quick Reference Guide

## 🧪 Quick Test Scenarios

### Community Guidelines Acceptance

**Test 1: New User Flow**
```
1. Create new account or use account that hasn't accepted guidelines
2. Navigate to Home
3. Click "Go Live" button
4. Expected: Community Guidelines modal appears
5. Try to click "ACCEPT" without scrolling → Should be disabled
6. Scroll to bottom of guidelines
7. Check "I have read and accept..." checkbox
8. Click "ACCEPT & CONTINUE"
9. Expected: Modal closes, stream setup continues
10. Verify in database: SELECT * FROM community_guidelines_acceptance WHERE user_id = '<user_id>';
```

**Test 2: Existing Acceptance**
```
1. Use account that has already accepted guidelines
2. Click "Go Live"
3. Expected: No guidelines modal, goes straight to stream setup
```

**Test 3: Manual Access**
```
1. Go to Profile → Settings
2. Scroll to "Safety & Rules" section
3. Click "Community Guidelines"
4. Expected: Modal opens
5. Can review and re-accept if needed
```

---

### React Key Errors

**Test 1: Safety & Community Rules**
```
1. Navigate to Settings → Safety & Community Rules
2. Open browser console / React Native debugger
3. Scroll through all sections
4. Expected: NO warnings about missing keys
5. All content cards render correctly
6. No white screens
```

**Test 2: Stories Bar**
```
1. Navigate to Home
2. Check Stories Bar at top
3. Expected: NO key warnings
4. Stories render correctly
5. "Add Story" button works
6. Clicking stories opens viewer
```

**Test 3: Inbox**
```
1. Navigate to Inbox
2. Switch between tabs: Notifications, Messages, VIP Clubs
3. Expected: NO key warnings
4. All lists render correctly
5. Category chips render correctly
```

**Test 4: Transaction History**
```
1. Navigate to Settings → Transaction History
2. Expected: NO key warnings
3. Transactions list renders correctly
4. Empty state shows if no transactions
```

---

### Stream Creation & Timeout

**Test 1: Normal Stream Creation**
```
1. Go Live with good internet connection
2. Expected: Stream creates within 5-10 seconds
3. Loading screen shows progress
4. Camera preview appears when ready
5. Timer starts at 00:00
```

**Test 2: Timeout Scenario**
```
1. Simulate slow network (or wait for actual timeout)
2. Go Live
3. Wait 30 seconds
4. Expected: Error screen appears
5. Message: "Stream creation timed out..."
6. Retry button available
7. Exit button available
```

**Test 3: Timer Persistence**
```
1. Start livestream
2. Wait for timer to reach 01:00
3. Press various buttons (filters, effects, settings)
4. Expected: Timer continues counting
5. Timer does NOT reset to 00:00
```

---

### Profile Search

**Test 1: Partial Username Search**
```
1. Go to Home
2. Click search icon
3. Type "hass"
4. Expected: User "hass040" appears in results
5. Results update as you type (debounced)
6. Click on user
7. Expected: Profile screen opens
```

**Test 2: Display Name Search**
```
1. Search for a display name (e.g., "John")
2. Expected: All users with "John" in display name appear
3. Case-insensitive matching works
```

**Test 3: Empty States**
```
1. Search for "xyzabc123" (non-existent)
2. Expected: "No users found" message
3. Clear search
4. Expected: "Search for users" placeholder
```

**Test 4: Search from Friends**
```
1. Navigate to Friends tab (if available)
2. Use search functionality
3. Expected: Same search behavior as Home
4. Results clickable and navigate to profiles
```

---

### Dashboard Visibility

**Test 1: Regular User**
```
1. Login as regular user (no admin role)
2. Navigate to Settings
3. Expected: NO "Dashboard & Tools" section
4. Only see standard settings sections
```

**Test 2: Admin User**
```
1. Login as user with role = 'ADMIN'
2. Navigate to Settings
3. Expected: "Dashboard & Tools" section appears
4. Click "Admin Dashboard"
5. Expected: Admin dashboard opens
```

**Test 3: Head Admin**
```
1. Login as user with role = 'HEAD_ADMIN'
2. Navigate to Settings
3. Expected: "Dashboard & Tools" section appears
4. Click "Head Admin Dashboard"
5. Expected: Head admin dashboard opens
6. Can search users
7. Can assign roles
```

**Test 4: Stream Moderator**
```
1. Login as user assigned as moderator to a creator
2. Navigate to Settings
3. Expected: "Dashboard & Tools" section appears
4. Shows "Stream Moderator Dashboard"
5. Can access moderation tools
```

---

## 🔍 Console Commands for Testing

### Check Community Guidelines Acceptance
```sql
-- Check if user has accepted
SELECT * FROM community_guidelines_acceptance 
WHERE user_id = '<user_id>' AND version = '1.0';

-- Check all acceptances
SELECT 
  cga.*,
  p.username,
  p.display_name
FROM community_guidelines_acceptance cga
JOIN profiles p ON p.id = cga.user_id
ORDER BY cga.accepted_at DESC;
```

### Check User Roles
```sql
-- Check specific user role
SELECT id, username, display_name, role 
FROM profiles 
WHERE id = '<user_id>';

-- Check all admin users
SELECT id, username, display_name, role 
FROM profiles 
WHERE role IN ('HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'LIVE_MODERATOR')
ORDER BY role, username;

-- Check stream moderators
SELECT 
  m.*,
  p.username as moderator_username,
  s.username as streamer_username
FROM moderators m
JOIN profiles p ON p.id = m.user_id
JOIN profiles s ON s.id = m.streamer_id;
```

### Check Search Functionality
```sql
-- Test search query
SELECT id, username, display_name, avatar_url, bio
FROM profiles
WHERE username ILIKE '%hass%' 
   OR display_name ILIKE '%hass%'
LIMIT 20;
```

---

## 🐛 Common Issues & Solutions

### Issue: "You must accept Community Guidelines" but no modal appears
**Solution:** 
- Check if `CommunityGuidelinesModal` is imported
- Verify `showCommunityGuidelinesModal` state is set to true
- Check console for errors in `communityGuidelinesService`

### Issue: React key warnings still appearing
**Solution:**
- Check that ALL `.map()` calls have unique keys
- Verify keys are not `undefined` or `null`
- Use database IDs, not array indices
- Check nested components for missing keys

### Issue: Stream creation hangs indefinitely
**Solution:**
- Check network connection
- Verify Cloudflare credentials in backend
- Check console for timeout message
- Should show error after 30 seconds

### Issue: Search returns no results
**Solution:**
- Verify users exist in database
- Check RLS policies on profiles table
- Ensure search query is not empty
- Check console for SQL errors

### Issue: Dashboard still visible for regular users
**Solution:**
- Verify role check is working: `checkAdminRole(user.id)`
- Check that conditional rendering uses `(userRole || isStreamModerator)`
- Ensure role is uppercase in database
- Check console logs for role check results

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ New users see Community Guidelines modal before streaming
2. ✅ Console has ZERO React key warnings
3. ✅ Stream creation shows timeout error after 30s if it fails
4. ✅ Searching "hass" finds "hass040"
5. ✅ Regular users don't see Dashboard in settings
6. ✅ Admin users see appropriate dashboards
7. ✅ No white screens anywhere in the app
8. ✅ All lists render smoothly
9. ✅ Navigation works without errors
10. ✅ Timer counts continuously without resetting

---

## 📊 Performance Metrics

### Expected Performance
- Search debounce: 300ms
- Stream creation: 5-10 seconds (normal)
- Stream creation timeout: 30 seconds (max)
- Stories refresh: Every 30 seconds
- Inbox refresh: Every 10 seconds
- Role check: On settings screen mount

### Optimization Tips
- Search is debounced to reduce database queries
- Stories use `useMemo` for performance
- Inbox uses `FlatList` for large lists
- Transaction history uses `ScrollView` (typically small lists)

---

## 🎓 Developer Notes

### Why maybeSingle() instead of single()?
`maybeSingle()` returns `null` if no row exists, while `single()` throws PGRST116 error. This is crucial for optional records like community guidelines acceptance.

### Why upsert() for acceptance?
`upsert()` with `onConflict` handles the case where a user tries to accept multiple times. It updates the existing record instead of failing with a duplicate key error.

### Why 30-second timeout?
30 seconds is long enough for most network conditions but short enough to prevent users from waiting indefinitely. It provides a good balance between patience and user experience.

### Why debounce search?
Debouncing prevents a database query on every keystroke. With 300ms delay, users can type "hass040" and only trigger 1-2 queries instead of 7.

---

## 🔗 Related Files

### Community Guidelines
- `components/CommunityGuidelinesModal.tsx`
- `app/services/communityGuidelinesService.ts`
- `app/(tabs)/go-live-modal.tsx`
- `app/(tabs)/pre-live-setup.tsx`
- `app/screens/AccountSettingsScreen.tsx`

### React Keys
- `app/screens/SafetyCommunityRulesScreen.tsx`
- `components/StoriesBar.tsx`
- `app/(tabs)/inbox.tsx`
- `app/screens/TransactionHistoryScreen.tsx`

### Stream Creation
- `contexts/LiveStreamStateMachine.tsx`
- `app/(tabs)/broadcast.tsx`
- `app/services/cloudflareService.ts`

### Profile Search
- `app/services/searchService.ts`
- `app/screens/SearchScreen.tsx`
- `app/(tabs)/(home)/index.tsx`

### Dashboard Visibility
- `app/screens/AccountSettingsScreen.tsx`
- `app/services/adminService.ts`
- `app/screens/HeadAdminDashboardScreen.tsx`

---

End of Testing Quick Reference
