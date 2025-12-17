
# 🚀 Developer Quick Commands

## Essential Commands for Development & Debugging

---

## 🗄️ Database Queries

### Community Guidelines

```sql
-- Check if specific user has accepted
SELECT * FROM community_guidelines_acceptance 
WHERE user_id = '<user_id>' AND version = '1.0';

-- View all acceptances
SELECT 
  cga.user_id,
  cga.accepted_at,
  cga.version,
  cga.device,
  p.username,
  p.display_name
FROM community_guidelines_acceptance cga
JOIN profiles p ON p.id = cga.user_id
ORDER BY cga.accepted_at DESC
LIMIT 50;

-- Count total acceptances
SELECT COUNT(*) as total_acceptances 
FROM community_guidelines_acceptance;

-- Find users who haven't accepted
SELECT p.id, p.username, p.display_name
FROM profiles p
LEFT JOIN community_guidelines_acceptance cga 
  ON cga.user_id = p.id AND cga.version = '1.0'
WHERE cga.id IS NULL
LIMIT 20;

-- Delete acceptance (for testing)
DELETE FROM community_guidelines_acceptance 
WHERE user_id = '<user_id>';
```

### User Roles

```sql
-- Check specific user role
SELECT id, username, display_name, role, email
FROM profiles 
WHERE id = '<user_id>';

-- List all admin users
SELECT id, username, display_name, role
FROM profiles 
WHERE role IN ('HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'LIVE_MODERATOR')
ORDER BY 
  CASE role
    WHEN 'HEAD_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'SUPPORT' THEN 3
    WHEN 'LIVE_MODERATOR' THEN 4
  END,
  username;

-- Assign role to user
UPDATE profiles 
SET role = 'ADMIN' 
WHERE id = '<user_id>';

-- Remove role from user
UPDATE profiles 
SET role = 'USER' 
WHERE id = '<user_id>';

-- Check stream moderators
SELECT 
  m.id,
  p1.username as moderator,
  p2.username as streamer
FROM moderators m
JOIN profiles p1 ON p1.id = m.user_id
JOIN profiles p2 ON p2.id = m.streamer_id
ORDER BY p2.username, p1.username;
```

### Search & Users

```sql
-- Test search query
SELECT id, username, display_name, avatar_url, bio
FROM profiles
WHERE username ILIKE '%hass%' 
   OR display_name ILIKE '%hass%'
ORDER BY username
LIMIT 20;

-- Find user by exact username
SELECT * FROM profiles WHERE username = 'hass040';

-- Find user by email
SELECT * FROM profiles WHERE email ILIKE '%example@email.com%';

-- Count total users
SELECT COUNT(*) FROM profiles;

-- Recent users
SELECT id, username, display_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;
```

### Streams & Transactions

```sql
-- Active streams
SELECT 
  s.id,
  s.title,
  s.status,
  s.viewer_count,
  p.username as broadcaster,
  s.started_at
FROM streams s
JOIN profiles p ON p.id = s.broadcaster_id
WHERE s.status = 'live'
ORDER BY s.viewer_count DESC;

-- Recent transactions
SELECT 
  t.id,
  t.type,
  t.amount,
  t.status,
  t.created_at,
  p.username
FROM transactions t
JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 20;

-- User wallet balance
SELECT 
  w.user_id,
  w.balance,
  p.username
FROM wallet w
JOIN profiles p ON p.id = w.user_id
WHERE w.user_id = '<user_id>';
```

---

## 🔧 TypeScript/React Commands

### Check State Machine

```typescript
// In any component with access to liveStreamState
import { useLiveStreamState } from '@/contexts/LiveStreamStateMachine';

const liveStreamState = useLiveStreamState();

// Check current state
console.log('Current state:', liveStreamState.currentState);
console.log('Previous state:', liveStreamState.previousState);
console.log('Error:', liveStreamState.error);
console.log('Is creating:', liveStreamState.isCreatingStream);

// Check state conditions
console.log('Can go live:', liveStreamState.canGoLive());
console.log('Is in setup:', liveStreamState.isInSetup());
console.log('Is live:', liveStreamState.isLive());
console.log('Has error:', liveStreamState.hasError());

// Force reset (emergency only)
liveStreamState.resetToIdle();
```

### Check Community Guidelines

```typescript
import { communityGuidelinesService } from '@/app/services/communityGuidelinesService';

// Check if user has accepted
const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(userId);
console.log('Has accepted:', hasAccepted);

// Get acceptance record
const record = await communityGuidelinesService.getAcceptanceRecord(userId);
console.log('Acceptance record:', record);

// Check if user can livestream
const canStream = await communityGuidelinesService.canUserLivestream(userId);
console.log('Can stream:', canStream);

// Record acceptance (for testing)
const result = await communityGuidelinesService.recordAcceptance(userId);
console.log('Record result:', result);
```

### Check User Role

```typescript
import { adminService } from '@/app/services/adminService';

// Check admin role
const roleResult = await adminService.checkAdminRole(userId);
console.log('Role:', roleResult.role);
console.log('Is admin:', roleResult.isAdmin);

// Check stream moderator
const modResult = await adminService.checkStreamModeratorRole(userId);
console.log('Is moderator:', modResult.isModerator);
console.log('Streamer ID:', modResult.streamerId);
```

### Test Search

```typescript
import { searchService } from '@/app/services/searchService';

// Search users
const result = await searchService.searchUsers('hass');
console.log('Search results:', result);

// Search all
const allResults = await searchService.searchAll('test');
console.log('All results:', allResults);
```

---

## 🐛 Debug Commands

### Enable Verbose Logging

```typescript
// Add to top of file
const DEBUG = true;

// Use throughout code
if (DEBUG) console.log('Debug info:', data);
```

### React Native Debugger

```bash
# Open debugger
# Press Cmd+D (iOS) or Cmd+M (Android)
# Select "Debug"

# Or use Flipper
npx react-native-flipper
```

### Check Supabase Connection

```typescript
// Test connection
const { data, error } = await supabase
  .from('profiles')
  .select('count');

console.log('Supabase connected:', !error);
console.log('Profile count:', data);
```

---

## 🔄 Reset Commands

### Reset User State (Testing)

```sql
-- Reset community guidelines acceptance
DELETE FROM community_guidelines_acceptance 
WHERE user_id = '<user_id>';

-- Reset user role
UPDATE profiles 
SET role = 'USER' 
WHERE id = '<user_id>';

-- Reset wallet
UPDATE wallet 
SET balance = 0 
WHERE user_id = '<user_id>';

-- Delete all user transactions
DELETE FROM transactions 
WHERE user_id = '<user_id>';
```

### Reset App State (Frontend)

```typescript
// Clear AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();

// Reset state machine
liveStreamState.resetToIdle();

// Clear auth
await supabase.auth.signOut();
```

---

## 📊 Performance Monitoring

### Check Query Performance

```sql
-- Enable query timing
\timing on

-- Run query and see execution time
SELECT * FROM profiles 
WHERE username ILIKE '%hass%' 
LIMIT 20;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Monitor Realtime Connections

```typescript
// Check active channels
const channels = supabase.getChannels();
console.log('Active channels:', channels.length);
channels.forEach(ch => {
  console.log('Channel:', ch.topic, 'State:', ch.state);
});
```

---

## 🧹 Cleanup Commands

### Clean Up Old Data

```sql
-- Delete expired stories
DELETE FROM stories 
WHERE expires_at < NOW();

-- Delete old notifications (older than 30 days)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete inactive sessions
DELETE FROM stream_sessions 
WHERE status = 'ended' 
  AND created_at < NOW() - INTERVAL '7 days';
```

### Clean Up Test Data

```sql
-- Delete test users (be careful!)
DELETE FROM profiles 
WHERE username LIKE 'test%';

-- Delete test streams
DELETE FROM streams 
WHERE title LIKE 'TEST%';
```

---

## 🎨 UI Debug Commands

### Check Component Rendering

```typescript
// Add to component
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// Check re-renders
useEffect(() => {
  console.log('Component re-rendered');
});

// Check specific state changes
useEffect(() => {
  console.log('State changed:', someState);
}, [someState]);
```

### Check Navigation

```typescript
import { useNavigation, useRoute } from '@react-navigation/native';

const navigation = useNavigation();
const route = useRoute();

console.log('Current route:', route.name);
console.log('Route params:', route.params);
console.log('Can go back:', navigation.canGoBack());
```

---

## 🔐 Security Checks

### Verify RLS Policies

```sql
-- Check all policies for a table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'community_guidelines_acceptance';

-- Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user_id>';

-- Try to query
SELECT * FROM community_guidelines_acceptance;

-- Reset role
RESET ROLE;
```

### Check User Permissions

```typescript
// Check if user can perform action
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
console.log('User email:', user?.email);
console.log('User metadata:', user?.user_metadata);

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session expires:', session?.expires_at);
```

---

## 📱 Platform-Specific Commands

### iOS

```bash
# Clear build cache
cd ios && rm -rf build && cd ..

# Clean pods
cd ios && pod deintegrate && pod install && cd ..

# Reset simulator
xcrun simctl erase all
```

### Android

```bash
# Clear build cache
cd android && ./gradlew clean && cd ..

# Reset emulator
adb shell pm clear com.yourapp.package
```

### Expo

```bash
# Clear cache
expo start -c

# Reset project
expo prebuild --clean

# Update dependencies
expo install --fix
```

---

## 🎯 Quick Fixes

### Fix: Community Guidelines Not Showing

```typescript
// Force show modal (for testing)
setShowCommunityGuidelinesModal(true);

// Or bypass check temporarily (DEV ONLY)
// In communityGuidelinesService.ts
async hasAcceptedGuidelines() {
  return true; // TEMPORARY
}
```

### Fix: Search Not Working

```typescript
// Test search directly
const { data } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', '%hass%')
  .limit(5);
console.log('Direct search:', data);
```

### Fix: Dashboard Showing for Wrong Users

```typescript
// Force hide (for testing)
const userRole = null;
const isStreamModerator = false;

// Or force show (for testing)
const userRole = 'ADMIN';
```

### Fix: Stream Creation Stuck

```typescript
// Cancel and reset
liveStreamState.cancelStreamCreation();
liveStreamState.resetToIdle();
router.back();
```

---

## 📚 Useful Resources

### Supabase Docs
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime
- Storage: https://supabase.com/docs/guides/storage

### React Native Docs
- Keys in Lists: https://react.dev/learn/rendering-lists
- useEffect: https://react.dev/reference/react/useEffect
- Performance: https://reactnative.dev/docs/performance

### Expo Docs
- Camera: https://docs.expo.dev/versions/latest/sdk/camera/
- Image Picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Router: https://docs.expo.dev/router/introduction/

---

## 🎓 Code Snippets

### Add New List with Proper Keys

```typescript
// ✅ Correct pattern
interface Item {
  id: string;
  name: string;
}

const items: Item[] = [...];

return (
  <View>
    {items.map((item) => (
      <View key={item.id}>
        <Text>{item.name}</Text>
      </View>
    ))}
  </View>
);
```

### Add New Modal

```typescript
const [showModal, setShowModal] = useState(false);

return (
  <>
    <TouchableOpacity onPress={() => setShowModal(true)}>
      <Text>Open Modal</Text>
    </TouchableOpacity>

    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal content */}
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </>
);
```

### Add Debounced Input

```typescript
const [query, setQuery] = useState('');
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  if (query.length > 0) {
    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }

  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, [query]);
```

### Add Role-Based UI

```typescript
const [userRole, setUserRole] = useState<string | null>(null);

useEffect(() => {
  const checkRole = async () => {
    const result = await adminService.checkAdminRole(user.id);
    setUserRole(result.role);
  };
  checkRole();
}, [user]);

// Conditional rendering
{userRole && (
  <View>
    {/* Admin-only content */}
  </View>
)}
```

---

## 🔍 Debugging Checklist

When something doesn't work:

1. **Check Console**
   - [ ] Any error messages?
   - [ ] Any warnings?
   - [ ] Any network errors?

2. **Check State**
   - [ ] Is user authenticated?
   - [ ] Is data loaded?
   - [ ] Are states correct?

3. **Check Database**
   - [ ] Does record exist?
   - [ ] Are RLS policies correct?
   - [ ] Is data formatted correctly?

4. **Check Network**
   - [ ] Is internet connected?
   - [ ] Is Supabase reachable?
   - [ ] Are requests timing out?

5. **Check Code**
   - [ ] Are imports correct?
   - [ ] Are types correct?
   - [ ] Are conditions correct?

---

## 🚀 Performance Optimization

### Optimize Queries

```typescript
// ✅ Good - Specific columns
.select('id, username, display_name')

// ❌ Bad - All columns
.select('*')

// ✅ Good - Limit results
.limit(20)

// ❌ Bad - No limit
// (returns all rows)

// ✅ Good - Index-friendly
.eq('user_id', userId)

// ❌ Bad - Not index-friendly
.ilike('bio', '%something%')
```

### Optimize React

```typescript
// ✅ Good - Memoized
const MemoizedComponent = React.memo(MyComponent);

// ✅ Good - Memoized callback
const handlePress = useCallback(() => {
  // handler
}, [dependencies]);

// ✅ Good - Memoized value
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## 📦 Build Commands

### Development

```bash
# Start development server
npm start

# Start with cache clear
npm run dev

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Production

```bash
# Build for production
npm run build:web
npm run build:android

# EAS builds
npm run eas:prod:ios
npm run eas:prod:android
```

---

## 🎯 Testing Commands

### Unit Tests (if implemented)

```bash
# Run all tests
npm test

# Run specific test
npm test -- SafetyCommunityRulesScreen

# Run with coverage
npm test -- --coverage
```

### E2E Tests (if implemented)

```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- community-guidelines
```

---

## 🔄 Git Commands

### Useful Git Commands

```bash
# Check status
git status

# View changes
git diff

# Commit changes
git add .
git commit -m "Fix: Implemented all 5 prompts"

# Push changes
git push origin main

# Create branch
git checkout -b fix/community-guidelines

# View commit history
git log --oneline -10
```

---

## 📝 Documentation Commands

### Generate TypeScript Types

```bash
# Generate types from Supabase
npx supabase gen types typescript --project-id uaqsjqakhgycfopftzzp > types/supabase.ts
```

### Update Dependencies

```bash
# Check outdated
npm outdated

# Update all
npm update

# Update specific package
npm install @supabase/supabase-js@latest
```

---

## 🎊 Success Verification

### Run This After Deployment

```typescript
async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  
  const checks = {
    auth: false,
    database: false,
    search: false,
    guidelines: false,
    roles: false,
  };
  
  try {
    // 1. Check auth
    const { data: { user } } = await supabase.auth.getUser();
    checks.auth = !!user;
    
    // 2. Check database
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count');
    checks.database = !dbError;
    
    // 3. Check search
    const searchResult = await searchService.searchUsers('test');
    checks.search = searchResult.success;
    
    // 4. Check guidelines
    if (user) {
      const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(user.id);
      checks.guidelines = typeof hasAccepted === 'boolean';
    }
    
    // 5. Check roles
    if (user) {
      const roleResult = await adminService.checkAdminRole(user.id);
      checks.roles = roleResult.role !== undefined;
    }
    
    console.log('✅ Verification results:', checks);
    
    const allPassed = Object.values(checks).every(v => v);
    console.log(allPassed ? '🎉 All checks passed!' : '⚠️ Some checks failed');
    
    return checks;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return checks;
  }
}

// Run verification
verifyDeployment();
```

---

## 🎓 Learning Resources

### Understanding the Fixes

1. **Community Guidelines**
   - Read: `COMPREHENSIVE_FIXES_IMPLEMENTATION.md`
   - Code: `communityGuidelinesService.ts`
   - UI: `CommunityGuidelinesModal.tsx`

2. **React Keys**
   - Read: React docs on lists
   - Code: All screen files
   - Pattern: Always use unique IDs

3. **State Machine**
   - Read: `LiveStreamStateMachine.tsx` comments
   - Code: State transitions
   - Pattern: Finite state machine

4. **Search**
   - Read: `searchService.ts` comments
   - Code: ILIKE queries
   - Pattern: Debounced input

5. **Roles**
   - Read: `adminService.ts` comments
   - Code: Role checking
   - Pattern: Conditional rendering

---

## 🆘 Emergency Contacts

### If Critical Issue

1. **Check error logs immediately**
2. **Identify affected users**
3. **Determine severity**
4. **Apply quick fix if available**
5. **Plan proper fix**
6. **Deploy fix**
7. **Verify fix**
8. **Document incident**

### Quick Fixes Available

- Community Guidelines: Bypass check temporarily
- Search: Use basic query
- Dashboard: Show to all or hide from all
- Stream: Use practice mode
- Keys: Add fallback keys

---

End of Developer Quick Commands
