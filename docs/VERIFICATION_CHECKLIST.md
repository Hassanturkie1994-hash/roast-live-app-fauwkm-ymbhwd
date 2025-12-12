
# Verification Checklist - RLS and Storage Fixes

## Quick Verification Steps

### ✅ 1. Database Functions and Policies

Run this SQL to verify everything is in place:

```sql
-- Check if is_admin() function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check admin_roles policies (should be 5 policies, all non-recursive)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admin_roles'
ORDER BY policyname;

-- Check profiles INSERT policy
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- Check admin_actions_log policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admin_actions_log';
```

**Expected Results:**
- `is_admin()` function should exist
- 5 policies on admin_roles (SELECT for users, SELECT/INSERT/UPDATE/DELETE for head admins)
- 1 clear INSERT policy on profiles
- 2 policies on admin_actions_log (INSERT and SELECT using is_admin())

### ✅ 2. Test User Signup

**Test Case:** New user registration
```typescript
// In your app or test environment
const testSignup = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'https://natively.dev/email-confirmed'
    }
  });
  
  if (error) {
    console.error('❌ Signup failed:', error.message);
    return false;
  }
  
  console.log('✅ Signup successful:', data.user?.id);
  
  // Check if profile was created
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single();
  
  if (profileError) {
    console.error('❌ Profile not created:', profileError.message);
    return false;
  }
  
  console.log('✅ Profile created:', profile);
  return true;
};
```

**Expected Result:** 
- No "row-level security policy" error
- User created successfully
- Profile created automatically

### ✅ 3. Test Admin Permissions

**Test Case:** Check admin role and log action
```typescript
const testAdminPermissions = async (userId: string) => {
  // Check if user is admin
  const { success, role } = await adminService.checkAdminRole(userId);
  console.log('Admin check:', { success, role });
  
  if (!role) {
    console.log('ℹ️ User is not an admin (expected for regular users)');
    return true;
  }
  
  // Try to log an action (only works for admins)
  const logResult = await adminService.logAction(
    userId,
    null,
    'WARN',
    'Test warning',
    null,
    { test: true }
  );
  
  if (!logResult.success) {
    console.error('❌ Admin logging failed:', logResult.error);
    return false;
  }
  
  console.log('✅ Admin logging successful');
  return true;
};
```

**Expected Result:**
- No "infinite recursion" error
- Admin check returns correct role
- Logging works for admins

### ✅ 4. Test Media Upload

**Test Case:** Upload profile image
```typescript
const testMediaUpload = async (userId: string, file: File) => {
  console.log('Testing media upload...');
  
  const result = await cdnService.uploadProfileImage(userId, file);
  
  if (!result.success) {
    console.error('❌ Upload failed:', result.error);
    return false;
  }
  
  console.log('✅ Upload successful:', {
    cdnUrl: result.cdnUrl,
    supabaseUrl: result.supabaseUrl,
    deduplicated: result.deduplicated
  });
  
  return true;
};
```

**Expected Result:**
- No "StorageUnknownError: Network request failed"
- Upload succeeds (may take 2-8 seconds with retries)
- Returns valid CDN and Supabase URLs

### ✅ 5. Test Admin Dashboard

**Test Case:** Fetch reports and users
```typescript
const testAdminDashboard = async () => {
  console.log('Testing admin dashboard...');
  
  // Fetch reports
  const reportsResult = await adminService.getReports({
    status: 'open',
    limit: 10
  });
  
  if (!reportsResult.success) {
    console.error('❌ Fetch reports failed:', reportsResult.error);
    return false;
  }
  
  console.log('✅ Fetched reports:', reportsResult.reports?.length || 0);
  
  // Fetch users under penalty
  const usersResult = await adminService.getUsersUnderPenalty();
  
  if (!usersResult.success) {
    console.error('❌ Fetch users failed:', usersResult.error);
    return false;
  }
  
  console.log('✅ Fetched users under penalty:', usersResult.users?.length || 0);
  
  return true;
};
```

**Expected Result:**
- No "infinite recursion" error
- Reports fetched successfully
- Users under penalty fetched successfully

### ✅ 6. Test Authentication Flow

**Test Case:** Complete signup and signin flow
```typescript
const testAuthFlow = async () => {
  console.log('Testing auth flow...');
  
  // 1. Sign up
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: 'authtest@example.com',
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'https://natively.dev/email-confirmed'
    }
  });
  
  if (signupError) {
    console.error('❌ Signup failed:', signupError.message);
    return false;
  }
  
  console.log('✅ Signup successful');
  
  // 2. Check profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signupData.user?.id)
    .single();
  
  if (profileError) {
    console.error('❌ Profile check failed:', profileError.message);
    return false;
  }
  
  console.log('✅ Profile exists:', profile.id);
  
  // 3. Sign out
  await supabase.auth.signOut();
  
  // 4. Sign in (after email verification in real scenario)
  // Note: This will fail until email is verified
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email: 'authtest@example.com',
    password: 'TestPassword123!'
  });
  
  if (signinError && signinError.message.includes('Email not confirmed')) {
    console.log('ℹ️ Email not confirmed (expected)');
    return true;
  }
  
  if (signinError) {
    console.error('❌ Signin failed:', signinError.message);
    return false;
  }
  
  console.log('✅ Signin successful');
  return true;
};
```

**Expected Result:**
- Signup works without RLS errors
- Profile created automatically
- Signin works after email verification

## Environment Variables Checklist

Verify these are set correctly in your Supabase project:

### R2 Storage Configuration
- [ ] `CF_R2_ACCESS_KEY_ID` - Updated R2 access key
- [ ] `CF_R2_SECRET_ACCESS_KEY` - Updated R2 secret key
- [ ] `CF_R2_BUCKET` - R2 bucket name (e.g., 'roast-app-storage')
- [ ] `CF_R2_ENDPOINT` - R2 endpoint URL (e.g., 'https://xxxxx.r2.cloudflarestorage.com')

### Supabase Configuration
- [ ] `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## CORS Configuration Checklist

Verify R2 bucket CORS settings:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Common Issues and Solutions

### Issue: "Infinite recursion detected"
**Solution:** 
- Verify `is_admin()` function exists
- Check admin_roles policies don't reference admin_roles table
- Review adminService.ts queries for deep nesting

### Issue: "new row violates row-level security policy"
**Solution:**
- Check profiles INSERT policy exists
- Verify user is authenticated (auth.uid() is not null)
- Check role value is NULL or 'USER'

### Issue: "StorageUnknownError: Network request failed"
**Solution:**
- Verify R2 credentials are updated
- Check CORS configuration
- Test with smaller file first
- Check network connectivity
- Review retry logic in cdnService.ts

### Issue: Upload takes too long
**Solution:**
- Check file size (max 100MB)
- Verify network speed
- Review retry attempts (max 3 attempts with exponential backoff)
- Check Supabase storage quota

## Success Criteria

All tests should pass with these results:

- ✅ No "infinite recursion" errors
- ✅ User signup creates profile successfully
- ✅ Admin logging works without errors
- ✅ Media uploads succeed (with retries if needed)
- ✅ Admin dashboard loads reports and users
- ✅ Authentication flow works correctly

## Monitoring

After verification, monitor these metrics:

1. **Error Logs**: Check Supabase logs for RLS errors
2. **Upload Success Rate**: Monitor CDN service upload success/failure ratio
3. **Query Performance**: Check admin dashboard query times
4. **User Feedback**: Collect feedback on signup and upload experience

## Rollback Plan

If issues persist:

1. **Database**: Revert RLS policies using migration rollback
2. **Code**: Revert cdnService.ts and adminService.ts changes
3. **Environment**: Restore previous R2 credentials if needed

## Support

If you encounter issues not covered here:

1. Check Supabase logs for detailed error messages
2. Review browser console for client-side errors
3. Test with different file types and sizes
4. Verify user permissions and roles
5. Contact support with specific error messages and reproduction steps
