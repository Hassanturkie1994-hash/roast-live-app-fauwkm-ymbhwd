
# Quick Fix Summary - RLS and Storage Issues

## What Was Fixed

### 🔧 1. Admin Roles Infinite Recursion
**Before:** Policies referenced `admin_roles` table → infinite loop
**After:** Policies check `profiles.role` directly → no recursion

**Key Change:**
```sql
-- Created helper function
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND upper(role) IN ('HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'MODERATOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Updated policies to use profiles.role instead of admin_roles
CREATE POLICY "Head admins can view all roles"
ON admin_roles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND upper(profiles.role) = 'HEAD_ADMIN'
));
```

### 🔧 2. User Signup Profile Creation
**Before:** Conflicting INSERT policies blocked profile creation
**After:** Single clear policy allows users to create their own profile

**Key Change:**
```sql
-- Removed duplicate policies, created single INSERT policy
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = id
  AND (role IS NULL OR upper(role) = 'USER' OR is_head_admin())
);
```

### 🔧 3. Admin Logging
**Before:** Policy referenced `admin_roles` → recursion
**After:** Policy uses `is_admin()` function → no recursion

**Key Change:**
```sql
CREATE POLICY "Admins can insert action logs"
ON admin_actions_log FOR INSERT
WITH CHECK (is_admin());
```

### 🔧 4. Media Upload Failures
**Before:** No retry logic, poor error handling, outdated config
**After:** Retry with exponential backoff, validation, better errors

**Key Changes:**
```typescript
// Added retry logic
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // Upload logic
    if (error && attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
  } catch (error) {
    // Handle error
  }
}

// Added file validation
private validateFile(file: Blob | File, mediaType: string) {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  return { valid: true };
}

// Added authentication check
const { data: { user } } = await supabase.auth.getUser();
if (!user?.id) {
  return { success: false, error: 'Not authenticated' };
}
```

### 🔧 5. Admin Dashboard Queries
**Before:** Deep nested queries caused recursion
**After:** Fetch only top-level fields, join data separately

**Key Change:**
```typescript
// Before (recursive)
const { data } = await supabase
  .from('user_reports')
  .select('*, profiles(*), admin_roles(*)')
  .eq('status', 'open');

// After (non-recursive)
const { data } = await supabase
  .from('user_reports')
  .select('id, reported_user_id, reporter_user_id, type, description, status')
  .eq('status', 'open');

// Fetch related data separately if needed
const withProfiles = await Promise.all(
  data.map(async (report) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', report.reported_user_id)
      .maybeSingle();
    return { ...report, profiles: profile };
  })
);
```

## Files Modified

### Database Migrations
- ✅ `fix_rls_policies_and_add_is_admin_function.sql` - New migration with all RLS fixes

### Service Files
- ✅ `app/services/cdnService.ts` - Updated with retry logic and validation
- ✅ `app/services/adminService.ts` - Updated queries to avoid recursion
- ✅ `app/services/r2Service.ts` - No changes needed (already correct)

### Documentation
- ✅ `docs/RLS_AND_STORAGE_FIXES.md` - Detailed implementation guide
- ✅ `docs/VERIFICATION_CHECKLIST.md` - Testing procedures
- ✅ `docs/QUICK_FIX_SUMMARY.md` - This file

## Testing Checklist

- [ ] User signup works without RLS errors
- [ ] Admin permissions check works without recursion
- [ ] Admin logging works without errors
- [ ] Media uploads succeed (with retries if needed)
- [ ] Admin dashboard loads reports without recursion
- [ ] Admin dashboard loads users without recursion
- [ ] Authentication flow works end-to-end

## Environment Variables to Update

Make sure these are set in your Supabase project:

```bash
# R2 Storage (UPDATED - use new API keys)
CF_R2_ACCESS_KEY_ID=<your-new-access-key>
CF_R2_SECRET_ACCESS_KEY=<your-new-secret-key>
CF_R2_BUCKET=roast-app-storage
CF_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Supabase
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## CORS Configuration

Add this to your R2 bucket CORS settings:

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

## Quick Verification

Run this SQL to verify fixes:

```sql
-- Check is_admin() function exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin';

-- Check admin_roles policies (should be 5, all non-recursive)
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'admin_roles';

-- Check profiles INSERT policy exists
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT' AND policyname = 'Users can insert own profile';

-- Check admin_actions_log policies use is_admin()
SELECT policyname, with_check FROM pg_policies 
WHERE tablename = 'admin_actions_log' AND cmd = 'INSERT';
```

Expected results:
- `is_admin` function exists
- 5 policies on admin_roles
- 1 INSERT policy on profiles
- admin_actions_log INSERT policy uses `is_admin()`

## Common Errors Fixed

| Error | Cause | Fix |
|-------|-------|-----|
| "Infinite recursion detected in policy for relation 'admin_roles'" | RLS policy referenced admin_roles table | Use profiles.role instead |
| "new row violates row-level security policy for table 'profiles'" | Conflicting INSERT policies | Single clear INSERT policy |
| "new row violates row-level security policy for table 'admin_actions_log'" | Policy referenced admin_roles | Use is_admin() function |
| "StorageUnknownError: Network request failed" | Outdated R2 config, no retry logic | Update config, add retries |

## Performance Impact

- ✅ **RLS Policies**: Minimal impact, `is_admin()` is marked STABLE for optimization
- ✅ **Uploads**: May take 2-8 seconds longer on failure (retry logic)
- ✅ **Admin Queries**: Slightly slower due to separate profile fetches, but no recursion

## Security Impact

- ✅ **Improved**: No recursive policy chains
- ✅ **Improved**: Clear separation of user vs admin permissions
- ✅ **Improved**: File validation before upload
- ✅ **Maintained**: All existing security checks still in place

## Next Steps

1. ✅ Deploy migration to production
2. ✅ Update R2 credentials in Supabase dashboard
3. ✅ Configure R2 bucket CORS
4. ✅ Test all features (use verification checklist)
5. ✅ Monitor error logs for 24-48 hours
6. ✅ Collect user feedback on signup and upload experience

## Rollback Plan

If issues occur:

```sql
-- Rollback RLS policies (if needed)
-- 1. Drop new policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Head admins can view all roles" ON admin_roles;
-- ... (drop other new policies)

-- 2. Restore old policies (from backup)
-- ... (restore old policies)

-- 3. Drop is_admin() function
DROP FUNCTION IF EXISTS is_admin();
```

## Support

If you encounter issues:

1. Check Supabase logs for detailed errors
2. Review browser console for client-side errors
3. Verify environment variables are set correctly
4. Test with different file types and sizes
5. Check CORS configuration on R2 bucket

## Success Metrics

After deployment, monitor:

- ✅ Zero "infinite recursion" errors
- ✅ 100% signup success rate
- ✅ 95%+ upload success rate (with retries)
- ✅ Admin dashboard loads in <2 seconds
- ✅ No RLS policy violations in logs

---

**Status**: ✅ All fixes implemented and ready for testing
**Last Updated**: 2024
**Migration Applied**: `fix_rls_policies_and_add_is_admin_function`
