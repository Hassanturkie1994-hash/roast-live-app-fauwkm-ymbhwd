
# 👨‍💻 Developer Onboarding - Recent Changes

## Quick Start for New Developers

Welcome! This guide will help you understand the recent changes to the Roast Live app.

---

## 🎯 What Changed?

We implemented 5 major fixes:

1. **Community Guidelines Acceptance** - Users must accept before streaming
2. **React Key Fixes** - Eliminated all list rendering warnings
3. **Stream Timeout Handling** - 30-second timeout with retry
4. **Profile Search** - Full search with partial matching
5. **Dashboard Visibility** - Role-based access control

---

## 🗂️ File Structure

### Key Files to Understand

```
app/
├── services/
│   ├── communityGuidelinesService.ts  ← Guidelines logic
│   ├── searchService.ts               ← Search logic
│   └── adminService.ts                ← Role checking
├── screens/
│   ├── SafetyCommunityRulesScreen.tsx ← Rules display
│   ├── AccountSettingsScreen.tsx      ← Settings with role check
│   └── TransactionHistoryScreen.tsx   ← Transaction list
├── (tabs)/
│   ├── go-live-modal.tsx              ← Go live flow
│   ├── pre-live-setup.tsx             ← Pre-live setup
│   ├── broadcast.tsx                  ← Live broadcasting
│   └── inbox.tsx                      ← Inbox with messages
components/
├── CommunityGuidelinesModal.tsx       ← Guidelines modal
└── StoriesBar.tsx                     ← Stories display
contexts/
└── LiveStreamStateMachine.tsx         ← Stream state management
```

---

## 🔑 Key Concepts

### 1. Community Guidelines Service

**Purpose:** Manage community guidelines acceptance

**Key Methods:**
```typescript
// Check if user has accepted (uses maybeSingle to avoid PGRST116)
hasAcceptedGuidelines(userId: string): Promise<boolean>

// Record acceptance (uses upsert for idempotency)
recordAcceptance(userId: string): Promise<{success: boolean, error?: string}>

// Check if user can livestream
canUserLivestream(userId: string): Promise<{canStream: boolean, reason?: string}>
```

**Why maybeSingle()?**
- `single()` throws PGRST116 if no row exists
- `maybeSingle()` returns `null` if no row exists
- Perfect for optional records

**Why upsert()?**
- Handles duplicate acceptance attempts
- Updates existing record instead of failing
- Idempotent operation

---

### 2. React Keys Pattern

**Rule:** Every `.map()` must have a unique, stable key

**Good Examples:**
```typescript
// ✅ Use database ID
{items.map(item => (
  <View key={item.id}>...</View>
))}

// ✅ Use composite key
{items.map(item => (
  <View key={`${type}-${item.id}`}>...</View>
))}

// ✅ Use unique string for static items
<View key="your-story">...</View>
```

**Bad Examples:**
```typescript
// ❌ Don't use index
{items.map((item, index) => (
  <View key={index}>...</View>
))}

// ❌ Don't use random
{items.map(item => (
  <View key={Math.random()}>...</View>
))}
```

---

### 3. Live Stream State Machine

**Purpose:** Manage stream lifecycle with timeout

**States:**
```
IDLE → PRE_LIVE_SETUP → CONTENT_LABEL_SELECTED → 
STREAM_CREATING → STREAM_READY → BROADCASTING → STREAM_ENDED
```

**Key Features:**
- 30-second timeout for stream creation
- Prevents duplicate creation calls
- Proper cleanup on unmount
- Error state with retry

**Usage:**
```typescript
const liveStreamState = useLiveStreamState();

// Check state
console.log(liveStreamState.currentState);

// Transition
liveStreamState.startStreamCreation();

// Check conditions
if (liveStreamState.canGoLive()) {
  // User can go live
}
```

---

### 4. Search Service

**Purpose:** Search users with partial matching

**Key Method:**
```typescript
searchUsers(query: string): Promise<{
  success: boolean;
  data: UserProfile[];
  error?: any;
}>
```

**How It Works:**
1. Trims and lowercases query
2. Uses ILIKE for case-insensitive matching
3. Searches both username and display_name
4. Sorts by relevance (exact matches first)
5. Limits to 20 results

**Debouncing:**
```typescript
// In component
useEffect(() => {
  const timeout = setTimeout(() => {
    performSearch(query);
  }, 300); // 300ms debounce
  
  return () => clearTimeout(timeout);
}, [query]);
```

---

### 5. Role-Based Access Control

**Purpose:** Show/hide UI based on user role

**Roles:**
- `HEAD_ADMIN` - Full platform control
- `ADMIN` - Manage reports & users
- `SUPPORT` - Review appeals
- `LIVE_MODERATOR` - Monitor streams
- `USER` - Regular user (default)

**Implementation:**
```typescript
// Check role
const roleResult = await adminService.checkAdminRole(userId);

// Conditional rendering
{roleResult.isAdmin && (
  <View>
    {/* Admin-only content */}
  </View>
)}
```

**Stream Moderators:**
- Separate from staff roles
- Assigned to specific creators
- Checked via `moderators` table

---

## 🛠️ Development Workflow

### Making Changes

1. **Understand the requirement**
   - Read the prompt carefully
   - Identify affected files
   - Plan the implementation

2. **Implement the fix**
   - Follow existing patterns
   - Use TypeScript types
   - Add error handling
   - Add logging

3. **Test locally**
   - Run the app
   - Test the feature
   - Check console for errors
   - Verify database changes

4. **Document changes**
   - Update relevant docs
   - Add code comments
   - Update README if needed

5. **Submit for review**
   - Create pull request
   - Add description
   - Link to requirements
   - Request review

---

## 🧪 Testing Patterns

### Unit Test Pattern

```typescript
describe('communityGuidelinesService', () => {
  it('should return false if user has not accepted', async () => {
    const result = await communityGuidelinesService.hasAcceptedGuidelines('test-user-id');
    expect(result).toBe(false);
  });
  
  it('should record acceptance successfully', async () => {
    const result = await communityGuidelinesService.recordAcceptance('test-user-id');
    expect(result.success).toBe(true);
  });
});
```

### Integration Test Pattern

```typescript
describe('Go Live Flow', () => {
  it('should show guidelines modal for new user', async () => {
    // Setup
    const user = await createTestUser();
    
    // Action
    await navigateToGoLive();
    
    // Assert
    expect(screen.getByText('Community Guidelines')).toBeVisible();
  });
});
```

---

## 🐛 Debugging Tips

### Community Guidelines Issues

```typescript
// Add debug logs
console.log('Checking guidelines for user:', userId);
const hasAccepted = await communityGuidelinesService.hasAcceptedGuidelines(userId);
console.log('Has accepted:', hasAccepted);

// Check database directly
const { data, error } = await supabase
  .from('community_guidelines_acceptance')
  .select('*')
  .eq('user_id', userId);
console.log('Database record:', data, error);
```

### React Key Issues

```typescript
// Check what's being used as key
{items.map(item => {
  console.log('Key:', item.id); // Should be unique
  return <View key={item.id}>...</View>;
})}

// Verify no duplicates
const keys = items.map(item => item.id);
const uniqueKeys = new Set(keys);
console.log('Total items:', items.length);
console.log('Unique keys:', uniqueKeys.size);
// Should be equal
```

### Stream Creation Issues

```typescript
// Monitor state machine
const liveStreamState = useLiveStreamState();

useEffect(() => {
  console.log('State changed:', liveStreamState.currentState);
  console.log('Is creating:', liveStreamState.isCreatingStream);
  console.log('Error:', liveStreamState.error);
}, [liveStreamState.currentState]);
```

### Search Issues

```typescript
// Test search directly
const result = await searchService.searchUsers('test');
console.log('Search result:', result);

// Check database
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', '%test%');
console.log('Database result:', data, error);
```

---

## 📚 Code Patterns to Follow

### Service Pattern

```typescript
class MyService {
  async myMethod(param: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // Implementation
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in myMethod:', error);
      return { success: false, error: 'Error message' };
    }
  }
}

export const myService = new MyService();
```

### Component Pattern

```typescript
export default function MyScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await myService.fetchData();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  
  return (
    <View>
      {data.map(item => (
        <View key={item.id}>
          {/* Render item */}
        </View>
      ))}
    </View>
  );
}
```

---

## 🔐 Security Checklist

When adding new features:

- [ ] Check user authentication
- [ ] Verify RLS policies
- [ ] Validate user input
- [ ] Sanitize data
- [ ] Check permissions
- [ ] Log security events
- [ ] Handle errors gracefully
- [ ] Don't expose sensitive data

---

## 🎓 Learning Resources

### Understanding the Codebase

1. **Start Here:**
   - Read `IMPLEMENTATION_COMPLETE.md`
   - Review `COMPREHENSIVE_FIXES_IMPLEMENTATION.md`
   - Check `TESTING_QUICK_REFERENCE.md`

2. **Deep Dive:**
   - Study `communityGuidelinesService.ts`
   - Understand `LiveStreamStateMachine.tsx`
   - Review `searchService.ts`
   - Examine `adminService.ts`

3. **Practice:**
   - Run verification scripts
   - Test each feature
   - Try breaking things
   - Fix what you break

### External Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Native Docs:** https://reactnative.dev/docs
- **Expo Docs:** https://docs.expo.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run linter
npm run lint

# Clear cache and restart
npm run dev
```

---

## 💡 Pro Tips

### Tip 1: Use Console Logs Liberally
```typescript
console.log('🔍 Debug:', variable);
console.log('✅ Success:', result);
console.log('❌ Error:', error);
console.log('⚠️ Warning:', warning);
```

### Tip 2: Always Clean Up
```typescript
useEffect(() => {
  // Setup
  const subscription = setupSubscription();
  
  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Tip 3: Handle All States
```typescript
if (loading) return <Loading />;
if (error) return <Error error={error} />;
if (!data) return <Empty />;
return <Content data={data} />;
```

### Tip 4: Type Everything
```typescript
// ✅ Good
interface User {
  id: string;
  username: string;
}

const user: User = {...};

// ❌ Bad
const user: any = {...};
```

---

## 🎯 Common Tasks

### Add New Screen

1. Create file in `app/screens/`
2. Add navigation route
3. Implement component
4. Add to navigation
5. Test thoroughly

### Add New Service

1. Create file in `app/services/`
2. Define interface
3. Implement methods
4. Export singleton
5. Add tests

### Add New Database Table

1. Create migration
2. Add RLS policies
3. Update TypeScript types
4. Create service layer
5. Implement UI

---

## 🔍 Code Review Checklist

When reviewing code:

- [ ] TypeScript types correct
- [ ] Error handling present
- [ ] Loading states implemented
- [ ] Keys in all `.map()` calls
- [ ] Cleanup in `useEffect`
- [ ] Console logs for debugging
- [ ] User-friendly error messages
- [ ] Performance optimized
- [ ] Security considered
- [ ] Documentation updated

---

## 🎊 Welcome to the Team!

You're now ready to work on the Roast Live app. If you have questions:

1. Check the documentation
2. Review existing code
3. Ask the team
4. Test your changes
5. Have fun coding! 🚀

---

*End of Developer Onboarding*
