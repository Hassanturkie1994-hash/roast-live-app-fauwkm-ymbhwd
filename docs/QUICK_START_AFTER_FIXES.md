
# Quick Start Guide - After Fixes

## What Was Fixed

### 1. ✅ Cloudflare R2 Uploads
- Fixed environment variable names
- Added retry logic (3 attempts with exponential backoff)
- Improved error handling
- Added file validation

### 2. ✅ Missing CDNService Functions
- Implemented `prefetchNextPage()`
- Implemented `trackMediaAccess()`
- Both functions are safe and never throw errors

### 3. ✅ RLS Policy Violations
- Fixed profiles table policies (INSERT, SELECT, UPDATE)
- Fixed admin_actions_log policies
- Removed recursive policy issues
- Users can now create profiles
- Admins can now log actions

## Required Configuration

### Step 1: Set Environment Variables

Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Add these 4 secrets:

```
R2_ACCESS_KEY_ID=<your-cloudflare-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-cloudflare-r2-secret-key>
R2_BUCKET=roastlive-assets
R2_ENDPOINT=https://fa8a289eee5b85ef9de55545c6a9f8e9.r2.cloudflarestorage.com
```

**Where to get these values:**
1. Log in to Cloudflare Dashboard
2. Go to R2 → Manage R2 API Tokens
3. Create a new API token with read/write permissions
4. Copy the Access Key ID and Secret Access Key

### Step 2: Configure R2 CORS (If Not Already Done)

In Cloudflare R2 bucket settings, add CORS rules:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Test the Fixes

#### Test Uploads
1. Open the app
2. Try uploading a profile image
3. Try creating a story with an image
4. Try creating a post with an image
5. Verify no "Network request failed" errors

#### Test User Signup
1. Create a new user account
2. Verify profile is created successfully
3. Verify no "RLS policy violation" errors

#### Test Admin Functions
1. Log in as an admin user
2. Try performing an admin action
3. Verify action is logged successfully
4. Verify no "infinite recursion" errors

## What to Expect

### Successful Upload
```
📤 Upload attempt 1/3 for avatars/user-id/timestamp.jpg
✅ Media uploaded successfully: {
  publicUrl: "https://pub-xxx.r2.dev/profile/user-id/timestamp.jpg",
  cdnUrl: "https://cdn.roastlive.com/profile/user-id/timestamp.jpg",
  tier: "A",
  deduplicated: false
}
```

### Failed Upload (Will Retry)
```
📤 Upload attempt 1/3 for avatars/user-id/timestamp.jpg
❌ Upload error (attempt 1): Network request failed
⏳ Waiting 2000ms before retry...
📤 Upload attempt 2/3 for avatars/user-id/timestamp.jpg
✅ Media uploaded successfully
```

### Successful Profile Creation
```
✅ Profile created successfully for user: user-id
```

### Successful Admin Action
```
✅ Admin action logged: BAN user-id
```

## Troubleshooting

### "R2 storage not configured"
**Problem:** Environment variables not set
**Solution:** Follow Step 1 above to set all 4 environment variables

### "Network request failed" (after 3 retries)
**Problem:** CORS not configured or wrong credentials
**Solution:** 
1. Check CORS configuration (Step 2)
2. Verify R2 credentials are correct
3. Check R2 bucket name matches

### "RLS policy violation" on profile creation
**Problem:** Database migration not applied
**Solution:** The migration should be applied automatically. If not, contact support.

### "Infinite recursion detected"
**Problem:** Old policies still in place
**Solution:** The migration should have fixed this. If not, contact support.

## Verification Commands

### Check Environment Variables
```bash
# In Supabase Dashboard → Edge Functions → Secrets
# Verify these 4 secrets exist:
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- R2_ENDPOINT
```

### Check RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'admin_actions_log', 'admin_roles')
ORDER BY tablename, policyname;
```

Expected output:
- profiles: 3 policies (insert_own, select_all, update_own)
- admin_actions_log: 2 policies (insert_by_admin, select_by_admin)
- admin_roles: 5 policies (various admin policies)

### Check Edge Function
```bash
# In Supabase Dashboard → Edge Functions
# Verify "upload-to-r2" function exists and is ACTIVE
# Version should be 17 or higher
```

## Common Questions

### Q: Do I need to update my app code?
**A:** No, all fixes are in the backend (Edge Functions and database). Just make sure you have the latest code from this fix.

### Q: Will existing uploads still work?
**A:** Yes, the fixes are backward compatible. Existing uploads are not affected.

### Q: Do I need to migrate existing data?
**A:** No, the RLS policy fixes only affect new operations. Existing data is not affected.

### Q: How do I know if uploads are working?
**A:** Try uploading a profile image. If it succeeds without errors, uploads are working.

### Q: What if I still get errors?
**A:** Check the troubleshooting section above. If issues persist, check:
1. Supabase Edge Function logs
2. Browser/app console logs
3. Cloudflare R2 dashboard for upload activity

## Success Indicators

✅ **Uploads Working:**
- Profile images upload successfully
- Stories upload successfully
- Posts upload successfully
- No "Network request failed" errors
- No "StorageUnknownError" errors

✅ **RLS Working:**
- New users can sign up
- Profiles are created automatically
- Users can update their profiles
- Admins can log actions
- No "RLS policy violation" errors
- No "infinite recursion" errors

✅ **CDNService Working:**
- Explore screen loads without errors
- Images load correctly
- No "prefetchNextPage is not a function" errors
- No "trackMediaAccess is not a function" errors

## Next Steps

1. ✅ Set environment variables (Step 1)
2. ✅ Configure CORS (Step 2)
3. ✅ Test uploads (Step 3)
4. ✅ Test user signup
5. ✅ Test admin functions
6. 🎉 Enjoy your working app!

## Need Help?

If you encounter any issues not covered in this guide:
1. Check the detailed documentation: `UPLOAD_AND_RLS_FIXES_COMPLETE.md`
2. Review Supabase Edge Function logs
3. Check browser/app console for errors
4. Verify all environment variables are set correctly

---

**All fixes are complete and ready to use!** 🚀
