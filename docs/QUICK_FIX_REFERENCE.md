
# Quick Fix Reference - RLS & Upload Issues

## 🚨 Common Errors & Solutions

### Error: "infinite recursion detected in policy for relation 'admin_roles'"

**Cause**: Policy references `admin_roles` table within itself

**Solution**: ✅ FIXED - Policies now check `profiles.role` directly

**Verify**:
```sql
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'admin_roles';
```

---

### Error: "new row violates row-level security policy for table 'profiles'"

**Cause**: Missing or incorrect INSERT policy for profiles

**Solution**: ✅ FIXED - New policy allows authenticated users to insert own profile

**Verify**:
```sql
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';
```

---

### Error: "new row violates row-level security policy for table 'admin_actions_log'"

**Cause**: Missing INSERT policy for admin logging

**Solution**: ✅ FIXED - Admins can now insert logs using `is_admin()` check

**Verify**:
```sql
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'admin_actions_log' AND cmd = 'INSERT';
```

---

### Error: "StorageUnknownError: Network request failed"

**Cause**: CDN service not using Cloudflare R2

**Solution**: ✅ FIXED - Now uses R2 via Edge Function with retry logic

**Verify**:
```typescript
// Check cdnService.ts uploadMedia() method
// Should call: supabase.functions.invoke('upload-to-r2')
```

---

## 🔍 Quick Diagnostics

### Check RLS Policies
```sql
-- View all policies for affected tables
SELECT tablename, policyname, cmd, 
  CASE 
    WHEN qual LIKE '%admin_roles%' THEN '❌ RECURSIVE'
    ELSE '✅ OK'
  END as status
FROM pg_policies 
WHERE tablename IN ('profiles', 'admin_roles', 'admin_actions_log', 'user_reports')
ORDER BY tablename, cmd;
```

### Check is_admin() Function
```sql
-- Verify function exists and is correct
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';
```

### Check Edge Function
```bash
# List all edge functions
supabase functions list

# Should include: upload-to-r2
```

---

## 🛠️ Manual Fixes (If Needed)

### Re-apply RLS Policies
```sql
-- Run this if policies are missing
\i supabase/migrations/fix_rls_recursion_and_policies.sql
```

### Re-create is_admin() Function
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND upper(role) IN ('HEAD_ADMIN', 'ADMIN', 'SUPPORT', 'MODERATOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Re-deploy Edge Function
```bash
supabase functions deploy upload-to-r2
```

---

## 📊 Health Check

Run this query to verify everything is working:

```sql
-- Comprehensive health check
WITH policy_check AS (
  SELECT COUNT(*) as policy_count
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'admin_roles', 'admin_actions_log', 'user_reports')
),
function_check AS (
  SELECT COUNT(*) as function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin'
),
recursion_check AS (
  SELECT COUNT(*) as recursive_policies
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'admin_roles', 'admin_actions_log', 'user_reports')
  AND (qual LIKE '%admin_roles%' OR with_check LIKE '%admin_roles%')
)
SELECT 
  policy_count,
  function_count,
  recursive_policies,
  CASE 
    WHEN policy_count >= 14 
      AND function_count = 1 
      AND recursive_policies = 0 
    THEN '✅ ALL CHECKS PASSED'
    ELSE '❌ ISSUES DETECTED'
  END as status
FROM policy_check, function_check, recursion_check;
```

**Expected Result**:
- `policy_count`: 14 or more
- `function_count`: 1
- `recursive_policies`: 0
- `status`: ✅ ALL CHECKS PASSED

---

## 🔧 Environment Variables

### Required for R2 Uploads
```bash
# In Supabase Edge Function settings
CF_R2_ACCESS_KEY_ID=<your-key>
CF_R2_SECRET_ACCESS_KEY=<your-secret>
CF_R2_BUCKET=<your-bucket>
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
```

### Verify in Dashboard
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `upload-to-r2`
4. Check Environment Variables section

---

## 🎯 Testing Checklist

### User Signup
```typescript
// Should work without errors
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});

// Then create profile
const { error: profileError } = await supabase
  .from('profiles')
  .insert({ id: data.user.id, username: 'testuser' });

// ✅ Should succeed
```

### Admin Dashboard
```typescript
// Should load without recursion errors
const { data, error } = await supabase
  .from('user_reports')
  .select('*')
  .eq('status', 'open');

// ✅ Should return reports
```

### Media Upload
```typescript
// Should upload to R2 successfully
const result = await cdnService.uploadProfileImage(userId, file);

// ✅ Should return { success: true, cdnUrl: '...' }
```

### Admin Logging
```typescript
// Should log without errors
const result = await adminService.logAction(
  adminUserId,
  targetUserId,
  'BAN',
  'Violation of terms',
  null,
  {}
);

// ✅ Should return { success: true }
```

---

## 📞 Support

### If Issues Persist

1. **Check Logs**
   - Browser console for frontend errors
   - Supabase logs for database errors
   - Edge Function logs for upload errors

2. **Verify Policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = '<table_name>';
   ```

3. **Test is_admin()**
   ```sql
   SELECT is_admin();
   -- Should return true for admins, false for others
   ```

4. **Test Edge Function**
   ```bash
   curl -X POST https://<project-ref>.supabase.co/functions/v1/upload-to-r2 \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"fileName":"test.jpg","fileType":"image/jpeg"}'
   ```

---

## ✅ Success Indicators

- No "infinite recursion" errors
- Users can sign up and create profiles
- Admins can view reports and users
- Media uploads succeed
- Admin actions are logged
- No RLS violations in console

---

**Last Updated**: 2025-01-XX

**Status**: ✅ ALL FIXES APPLIED
