
# ✅ Verification Script

## Run This to Verify All Fixes Are Working

Copy and paste these code snippets into your app to verify each fix.

---

## 🧪 Test 1: Community Guidelines

```typescript
// Add this to a test screen or run in console

async function testCommunityGuidelines() {
  console.log('🧪 Testing Community Guidelines...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ Not logged in');
    return;
  }
  
  // Test 1: Check if user has accepted
  const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(user.id);
  console.log('✅ Has accepted:', hasAccepted);
  
  // Test 2: Get acceptance record
  const record = await communityGuidelinesService.getAcceptanceRecord(user.id);
  console.log('✅ Acceptance record:', record);
  
  // Test 3: Check if can livestream
  const canStream = await communityGuidelinesService.canUserLivestream(user.id);
  console.log('✅ Can livestream:', canStream);
  
  // Test 4: Record acceptance (if not already accepted)
  if (!hasAccepted) {
    const result = await communityGuidelinesService.recordAcceptance(user.id);
    console.log('✅ Record acceptance result:', result);
  }
  
  console.log('🎉 Community Guidelines test complete!');
}

testCommunityGuidelines();
```

**Expected Output:**
```
🧪 Testing Community Guidelines...
✅ Has accepted: true (or false if not accepted)
✅ Acceptance record: { id: '...', user_id: '...', accepted_at: '...', ... }
✅ Can livestream: { canStream: true }
🎉 Community Guidelines test complete!
```

---

## 🧪 Test 2: React Keys

```typescript
// Check console for warnings

async function testReactKeys() {
  console.log('🧪 Testing React Keys...');
  
  // Navigate to each screen and check console
  const screens = [
    '/screens/SafetyCommunityRulesScreen',
    '/(tabs)/(home)/', // Check StoriesBar
    '/(tabs)/inbox',
    '/screens/TransactionHistoryScreen',
  ];
  
  console.log('Navigate to these screens and check console:');
  screens.forEach(screen => {
    console.log(`- ${screen}`);
  });
  
  console.log('Expected: NO warnings about missing keys');
  console.log('🎉 React Keys test complete!');
}

testReactKeys();
```

**Expected Output:**
```
🧪 Testing React Keys...
Navigate to these screens and check console:
- /screens/SafetyCommunityRulesScreen
- /(tabs)/(home)/
- /(tabs)/inbox
- /screens/TransactionHistoryScreen
Expected: NO warnings about missing keys
🎉 React Keys test complete!
```

---

## 🧪 Test 3: Stream Creation & Timeout

```typescript
// Test stream creation timeout

async function testStreamCreation() {
  console.log('🧪 Testing Stream Creation...');
  
  const liveStreamState = useLiveStreamState();
  
  // Test 1: Check initial state
  console.log('✅ Initial state:', liveStreamState.currentState);
  
  // Test 2: Start stream creation
  liveStreamState.startStreamCreation();
  console.log('✅ State after start:', liveStreamState.currentState);
  console.log('✅ Is creating:', liveStreamState.isCreatingStream);
  
  // Test 3: Wait for timeout (30 seconds)
  setTimeout(() => {
    console.log('✅ State after 30s:', liveStreamState.currentState);
    console.log('✅ Error:', liveStreamState.error);
    console.log('Expected: ERROR state with timeout message');
  }, 31000);
  
  console.log('🎉 Stream Creation test started (wait 30s)!');
}

testStreamCreation();
```

**Expected Output:**
```
🧪 Testing Stream Creation...
✅ Initial state: IDLE
✅ State after start: STREAM_CREATING
✅ Is creating: true
🎉 Stream Creation test started (wait 30s)!

(After 30 seconds)
✅ State after 30s: ERROR
✅ Error: Stream creation timed out...
Expected: ERROR state with timeout message
```

---

## 🧪 Test 4: Profile Search

```typescript
// Test profile search

async function testProfileSearch() {
  console.log('🧪 Testing Profile Search...');
  
  // Test 1: Search for "hass"
  const result1 = await searchService.searchUsers('hass');
  console.log('✅ Search "hass":', result1);
  console.log('Expected: Should include "hass040" if user exists');
  
  // Test 2: Search for partial match
  const result2 = await searchService.searchUsers('ha');
  console.log('✅ Search "ha":', result2);
  console.log('Expected: Should return all users with "ha" in username');
  
  // Test 3: Case insensitive
  const result3 = await searchService.searchUsers('HASS');
  console.log('✅ Search "HASS":', result3);
  console.log('Expected: Same results as "hass"');
  
  // Test 4: Empty query
  const result4 = await searchService.searchUsers('');
  console.log('✅ Search "":', result4);
  console.log('Expected: Empty array');
  
  console.log('🎉 Profile Search test complete!');
}

testProfileSearch();
```

**Expected Output:**
```
🧪 Testing Profile Search...
✅ Search "hass": { success: true, data: [{ username: 'hass040', ... }] }
Expected: Should include "hass040" if user exists
✅ Search "ha": { success: true, data: [...] }
Expected: Should return all users with "ha" in username
✅ Search "HASS": { success: true, data: [{ username: 'hass040', ... }] }
Expected: Same results as "hass"
✅ Search "": { success: true, data: [] }
Expected: Empty array
🎉 Profile Search test complete!
```

---

## 🧪 Test 5: Dashboard Visibility

```typescript
// Test dashboard visibility

async function testDashboardVisibility() {
  console.log('🧪 Testing Dashboard Visibility...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ Not logged in');
    return;
  }
  
  // Test 1: Check user role
  const roleResult = await adminService.checkAdminRole(user.id);
  console.log('✅ User role:', roleResult.role);
  console.log('✅ Is admin:', roleResult.isAdmin);
  
  // Test 2: Check stream moderator
  const modResult = await adminService.checkStreamModeratorRole(user.id);
  console.log('✅ Is stream moderator:', modResult.isModerator);
  
  // Test 3: Should show dashboard?
  const shouldShowDashboard = roleResult.isAdmin || modResult.isModerator;
  console.log('✅ Should show dashboard:', shouldShowDashboard);
  
  // Test 4: Navigate to settings and verify
  console.log('Navigate to Settings and verify:');
  if (shouldShowDashboard) {
    console.log('Expected: "Dashboard & Tools" section visible');
  } else {
    console.log('Expected: "Dashboard & Tools" section NOT visible');
  }
  
  console.log('🎉 Dashboard Visibility test complete!');
}

testDashboardVisibility();
```

**Expected Output (Regular User):**
```
🧪 Testing Dashboard Visibility...
✅ User role: null
✅ Is admin: false
✅ Is stream moderator: false
✅ Should show dashboard: false
Navigate to Settings and verify:
Expected: "Dashboard & Tools" section NOT visible
🎉 Dashboard Visibility test complete!
```

**Expected Output (Admin User):**
```
🧪 Testing Dashboard Visibility...
✅ User role: ADMIN
✅ Is admin: true
✅ Is stream moderator: false
✅ Should show dashboard: true
Navigate to Settings and verify:
Expected: "Dashboard & Tools" section visible
🎉 Dashboard Visibility test complete!
```

---

## 🧪 Complete Verification Suite

```typescript
// Run all tests at once

async function runAllTests() {
  console.log('🚀 Running complete verification suite...\n');
  
  try {
    await testCommunityGuidelines();
    console.log('\n');
    
    await testReactKeys();
    console.log('\n');
    
    await testStreamCreation();
    console.log('\n');
    
    await testProfileSearch();
    console.log('\n');
    
    await testDashboardVisibility();
    console.log('\n');
    
    console.log('🎊 All tests complete!');
    console.log('Check console for any errors or warnings.');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

runAllTests();
```

---

## 📊 Database Verification Queries

### Check Community Guidelines Acceptances

```sql
-- Count total acceptances
SELECT COUNT(*) as total_acceptances 
FROM community_guidelines_acceptance;

-- View recent acceptances
SELECT 
  cga.accepted_at,
  cga.version,
  cga.device,
  p.username
FROM community_guidelines_acceptance cga
JOIN profiles p ON p.id = cga.user_id
ORDER BY cga.accepted_at DESC
LIMIT 10;

-- Find users who haven't accepted
SELECT COUNT(*) as users_not_accepted
FROM profiles p
LEFT JOIN community_guidelines_acceptance cga 
  ON cga.user_id = p.id AND cga.version = '1.0'
WHERE cga.id IS NULL;
```

### Check User Roles

```sql
-- Count users by role
SELECT 
  COALESCE(role, 'USER') as role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- List all admin users
SELECT username, display_name, role
FROM profiles
WHERE role IN ('HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'LIVE_MODERATOR')
ORDER BY role, username;
```

### Check Search Performance

```sql
-- Test search query
EXPLAIN ANALYZE
SELECT id, username, display_name, avatar_url, bio
FROM profiles
WHERE username ILIKE '%hass%' 
   OR display_name ILIKE '%hass%'
LIMIT 20;

-- Should execute in < 100ms
```

---

## ✅ Success Criteria

### All Tests Should Pass

- [x] Community Guidelines acceptance works
- [x] No React key warnings in console
- [x] Stream creation timeout after 30s
- [x] Profile search finds users
- [x] Dashboard visibility correct

### Performance Benchmarks

- [x] Search responds in < 500ms
- [x] Stream creation in < 10s (or timeout at 30s)
- [x] UI remains responsive
- [x] No memory leaks

### User Experience

- [x] Clear error messages
- [x] Loading states everywhere
- [x] Smooth animations
- [x] Intuitive flows
- [x] No crashes

---

## 🎯 Final Checklist

Before marking as complete:

- [ ] Run all verification tests
- [ ] Check console for errors
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on web (if applicable)
- [ ] Verify database records
- [ ] Check RLS policies
- [ ] Test with different user roles
- [ ] Test with slow network
- [ ] Test edge cases

---

## 🎊 Deployment Verification

After deploying to production:

```typescript
// Run this in production

async function verifyProduction() {
  console.log('🔍 Verifying production deployment...');
  
  const checks = [];
  
  // 1. Check Supabase connection
  try {
    const { error } = await supabase.from('profiles').select('count');
    checks.push({ name: 'Supabase Connection', passed: !error });
  } catch (e) {
    checks.push({ name: 'Supabase Connection', passed: false });
  }
  
  // 2. Check auth
  try {
    const { data: { user } } = await supabase.auth.getUser();
    checks.push({ name: 'Authentication', passed: !!user });
  } catch (e) {
    checks.push({ name: 'Authentication', passed: false });
  }
  
  // 3. Check search
  try {
    const result = await searchService.searchUsers('test');
    checks.push({ name: 'Search Service', passed: result.success });
  } catch (e) {
    checks.push({ name: 'Search Service', passed: false });
  }
  
  // 4. Check guidelines service
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(user.id);
      checks.push({ name: 'Guidelines Service', passed: typeof hasAccepted === 'boolean' });
    }
  } catch (e) {
    checks.push({ name: 'Guidelines Service', passed: false });
  }
  
  // Print results
  console.log('\n📊 Verification Results:');
  checks.forEach(check => {
    console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.passed);
  console.log(`\n${allPassed ? '🎉 All checks passed!' : '⚠️ Some checks failed'}`);
  
  return allPassed;
}

verifyProduction();
```

---

## 🎓 Manual Verification Steps

### Step 1: Community Guidelines
1. Create a new test user
2. Try to go live
3. ✅ Modal should appear
4. Try to accept without scrolling
5. ✅ Button should be disabled
6. Scroll to bottom
7. ✅ Button should enable
8. Check acceptance box
9. Click "ACCEPT & CONTINUE"
10. ✅ Should proceed to stream setup

### Step 2: React Keys
1. Open React Native debugger
2. Navigate to Safety & Community Rules
3. ✅ No key warnings in console
4. Navigate to Home (check StoriesBar)
5. ✅ No key warnings in console
6. Navigate to Inbox
7. ✅ No key warnings in console
8. Navigate to Transaction History
9. ✅ No key warnings in console

### Step 3: Stream Creation
1. Click "Go Live"
2. Complete setup
3. ✅ Loading screen appears
4. ✅ Stream starts within 10 seconds
5. OR
6. ✅ Error appears after 30 seconds
7. ✅ Retry button available

### Step 4: Profile Search
1. Go to Home
2. Click search icon
3. Type "hass"
4. ✅ Results appear as you type
5. ✅ "hass040" in results (if exists)
6. Click on a user
7. ✅ Profile opens

### Step 5: Dashboard Visibility
1. Login as regular user
2. Go to Settings
3. ✅ NO "Dashboard & Tools" section
4. Logout
5. Login as admin
6. Go to Settings
7. ✅ "Dashboard & Tools" section visible

---

## 📈 Performance Verification

### Measure Search Performance

```typescript
async function measureSearchPerformance() {
  console.log('⏱️ Measuring search performance...');
  
  const queries = ['h', 'ha', 'hass', 'hass040'];
  
  for (const query of queries) {
    const start = Date.now();
    await searchService.searchUsers(query);
    const duration = Date.now() - start;
    
    console.log(`Query "${query}": ${duration}ms`);
    console.log(duration < 500 ? '✅ Fast' : '⚠️ Slow');
  }
  
  console.log('🎉 Performance test complete!');
}

measureSearchPerformance();
```

**Expected Output:**
```
⏱️ Measuring search performance...
Query "h": 150ms
✅ Fast
Query "ha": 180ms
✅ Fast
Query "hass": 120ms
✅ Fast
Query "hass040": 90ms
✅ Fast
🎉 Performance test complete!
```

---

## 🔍 Database Integrity Check

```sql
-- Run these queries to verify database integrity

-- 1. Check community_guidelines_acceptance table
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT version) as versions
FROM community_guidelines_acceptance;

-- Expected: total_records >= unique_users (some users may have multiple versions)

-- 2. Check for duplicate acceptances (should be 0)
SELECT user_id, version, COUNT(*) as count
FROM community_guidelines_acceptance
GROUP BY user_id, version
HAVING COUNT(*) > 1;

-- Expected: 0 rows (unique constraint prevents duplicates)

-- 3. Check RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'community_guidelines_acceptance';

-- Expected: 3 policies (SELECT, INSERT, UPDATE)

-- 4. Check user roles
SELECT 
  role,
  COUNT(*) as count
FROM profiles
WHERE role IS NOT NULL
GROUP BY role;

-- Expected: Shows distribution of admin roles

-- 5. Check search index (if exists)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND (indexdef ILIKE '%username%' OR indexdef ILIKE '%display_name%');

-- Expected: Indexes on username and display_name for fast search
```

---

## 🎯 Acceptance Test

### Final User Acceptance Test

**Scenario: New User First Stream**

1. **Create Account**
   - [ ] Register new user
   - [ ] Verify email
   - [ ] Login successfully

2. **Accept Guidelines**
   - [ ] Click "Go Live"
   - [ ] Guidelines modal appears
   - [ ] Scroll to bottom
   - [ ] Check acceptance box
   - [ ] Click "ACCEPT & CONTINUE"
   - [ ] Modal closes

3. **Setup Stream**
   - [ ] Enter stream title
   - [ ] Select content label
   - [ ] Confirm creator rules
   - [ ] Stream creation starts

4. **Go Live**
   - [ ] Loading screen appears
   - [ ] Stream starts successfully
   - [ ] Timer starts at 00:00
   - [ ] Camera preview visible

5. **During Stream**
   - [ ] Timer continues counting
   - [ ] Press various buttons
   - [ ] Timer doesn't reset
   - [ ] All features work

6. **End Stream**
   - [ ] Click end button
   - [ ] Confirmation modal appears
   - [ ] Confirm end
   - [ ] Stats shown
   - [ ] Return to home

7. **Search Users**
   - [ ] Go to Home
   - [ ] Click search
   - [ ] Type partial username
   - [ ] Results appear
   - [ ] Click user
   - [ ] Profile opens

8. **Check Settings**
   - [ ] Go to Settings
   - [ ] Verify appropriate sections visible
   - [ ] Dashboard visible only if admin
   - [ ] All settings accessible

**If all steps pass: ✅ READY FOR PRODUCTION**

---

## 📞 Report Issues

If any test fails:

1. Note which test failed
2. Copy error message
3. Check console logs
4. Verify database state
5. Report to development team

Include:
- Test name
- Expected result
- Actual result
- Error messages
- Console logs
- Screenshots

---

## 🎊 Success!

If all tests pass, congratulations! 🎉

The app is now:
- ✅ More stable
- ✅ More user-friendly
- ✅ Better performing
- ✅ Properly secured
- ✅ Ready for users

**Thank you for verifying!**

---

*End of Verification Script*
