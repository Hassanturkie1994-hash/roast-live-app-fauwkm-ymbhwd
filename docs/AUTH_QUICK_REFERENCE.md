
# Authentication Quick Reference

## For Developers

### How to Check if User is Authenticated

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Text>Please log in</Text>;
  }
  
  return <Text>Welcome {user.email}</Text>;
}
```

### How to Get User Profile

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { profile } = useAuth();
  
  return (
    <View>
      <Text>{profile?.display_name}</Text>
      <Text>@{profile?.username}</Text>
    </View>
  );
}
```

### How to Implement Logout

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LogoutButton() {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
    // NavigationGuard will automatically redirect to login
  };
  
  return <Button onPress={handleLogout}>Logout</Button>;
}
```

### How to Protect a Screen

**You don't need to!** The `NavigationGuard` in `_layout.tsx` automatically protects all screens. Unauthenticated users cannot access any screen except `/auth/login` and `/auth/register`.

### How to Access Supabase Client

```typescript
import { supabase } from '@/app/integrations/supabase/client';

async function fetchData() {
  const { data, error } = await supabase
    .from('my_table')
    .select('*');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  return data;
}
```

### How to Check Auth State

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading } = useAuth();
  
  console.log('User:', user);
  console.log('Session:', session);
  console.log('Loading:', loading);
}
```

## Common Patterns

### Pattern 1: Show Different UI for Authenticated Users

```typescript
function MyComponent() {
  const { user } = useAuth();
  
  return (
    <View>
      {user ? (
        <Text>Welcome back!</Text>
      ) : (
        <Text>Please log in</Text>
      )}
    </View>
  );
}
```

### Pattern 2: Fetch User-Specific Data

```typescript
function MyComponent() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchUserData() {
      const { data } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id);
        
      setData(data);
    }
    
    fetchUserData();
  }, [user]);
  
  return <View>{/* Render data */}</View>;
}
```

### Pattern 3: Refresh User Profile

```typescript
function MyComponent() {
  const { refreshProfile } = useAuth();
  
  const handleUpdateProfile = async () => {
    // Update profile in database
    await supabase
      .from('profiles')
      .update({ display_name: 'New Name' })
      .eq('id', user.id);
    
    // Refresh profile in context
    await refreshProfile();
  };
  
  return <Button onPress={handleUpdateProfile}>Update</Button>;
}
```

## Navigation

### How Navigation Works

1. **Unauthenticated Users:**
   - Can only access `/auth/login` and `/auth/register`
   - Attempting to access other routes redirects to login
   - Cannot navigate back to app screens

2. **Authenticated Users:**
   - Can access all app screens
   - Cannot access auth screens (redirected to home)
   - Can navigate freely within app

3. **Loading State:**
   - Shows loading screen while checking auth
   - Prevents flickering between screens
   - Ensures smooth user experience

### Manual Navigation (Not Recommended)

```typescript
import { router } from 'expo-router';

// Don't do this - NavigationGuard handles it
router.push('/(tabs)/(home)');

// Instead, just update auth state
await signIn(email, password);
// NavigationGuard will automatically navigate
```

## Debugging

### Enable Verbose Logging

Auth flow already includes comprehensive logging. Check console for:
- 🔐 Auth initialization
- 📱 Session status
- 🔄 Auth state changes
- ✅ Success messages
- ❌ Error messages

### Check Auth State

```typescript
import { supabase } from '@/app/integrations/supabase/client';

async function debugAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Current session:', session);
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
}
```

### Force Logout

```typescript
import { supabase } from '@/app/integrations/supabase/client';

async function forceLogout() {
  await supabase.auth.signOut();
  // NavigationGuard will redirect to login
}
```

## Best Practices

### ✅ DO

- Use `useAuth()` hook to access auth state
- Let NavigationGuard handle navigation
- Always check `loading` state before rendering
- Use try/catch for async operations
- Reset loading states in finally blocks

### ❌ DON'T

- Don't manually navigate after login/logout
- Don't store auth state in local component state
- Don't bypass NavigationGuard
- Don't access Supabase auth directly (use AuthContext)
- Don't forget to handle loading states

## Troubleshooting

### Problem: User sees login screen after logging in
**Solution:** Check console logs for auth state changes. Ensure NavigationGuard is working.

### Problem: Login button freezes
**Solution:** Check that loading state is reset in finally block. Check network connection.

### Problem: User logged out unexpectedly
**Solution:** Check session expiry. Ensure autoRefreshToken is enabled. Check Supabase status.

### Problem: Can't access protected screens
**Solution:** This is expected! NavigationGuard protects all screens. User must log in first.

## Support

For issues or questions:
1. Check console logs for error messages
2. Review this documentation
3. Check `docs/AUTH_FLOW_FIXES_COMPLETE.md` for detailed information
4. Contact development team

## Summary

- ✅ Authentication is handled automatically
- ✅ Navigation is managed by NavigationGuard
- ✅ Sessions persist across app restarts
- ✅ Use `useAuth()` hook for all auth operations
- ✅ Let the system handle navigation
- ✅ Focus on building features, not auth logic
