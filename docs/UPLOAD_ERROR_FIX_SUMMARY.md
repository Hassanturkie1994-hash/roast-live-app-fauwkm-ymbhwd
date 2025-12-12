
# Upload Error Fix Summary

## Problem
The app is showing upload errors because the Cloudflare R2 credentials are not configured in Supabase Edge Functions.

**Error Messages:**
- "Edge Function error (attempt 1/2/3): FunctionsHttpError: Edge Function returned a non-2xx status code"
- "All upload attempts failed: Edge Function returned a non-2xx status code"

## Root Cause
The `upload-to-r2` Edge Function is returning HTTP 500 errors because the required environment variables (`R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`) are not set in Supabase.

## Solution

### ✅ Correct Environment Variable Names

Use these exact names in Supabase:
- ✅ `R2_ACCESS_KEY_ID` (CORRECT)
- ✅ `R2_SECRET_ACCESS_KEY` (CORRECT)
- ❌ `CF_R2_ACCESS_KEY` (WRONG - do not use)

### 📋 Step-by-Step Fix

#### 1. Get Your R2 Credentials from Cloudflare

1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com/
2. Go to **R2** in the sidebar
3. Click **Manage R2 API Tokens**
4. Create a new API token or use an existing one
5. Copy the **Access Key ID** and **Secret Access Key**

#### 2. Set Environment Variables in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/uaqsjqakhgycfopftzzp
2. Navigate to **Project Settings** → **Edge Functions**
3. Add these environment variables:

| Variable | Value | Example |
|----------|-------|---------|
| `R2_ACCESS_KEY_ID` | Your R2 Access Key ID | `abc123def456...` |
| `R2_SECRET_ACCESS_KEY` | Your R2 Secret Access Key | `xyz789uvw012...` |
| `R2_BUCKET` | `roastlive-assets` | `roastlive-assets` |
| `R2_ENDPOINT` | Your R2 endpoint | `https://fa8a289eee5b85ef9de55545c6a9f8e9.r2.cloudflarestorage.com` |

#### 3. Redeploy the Edge Function

After setting the environment variables, you need to redeploy the Edge Function:

**Option A: Using Supabase Dashboard**
1. Go to **Edge Functions** in Supabase Dashboard
2. Find `upload-to-r2`
3. Click **Redeploy** or **Deploy New Version**

**Option B: Using Supabase CLI**
```bash
supabase functions deploy upload-to-r2
```

#### 4. Test the Upload

1. Open your app
2. Try uploading a story
3. Check the console logs for success messages
4. If you still see errors, check the Edge Function logs in Supabase Dashboard

## Verification

After completing the steps above, you should see:

✅ **Success Logs:**
```
📤 Upload attempt 1/3 for stories/...
✅ User authenticated: ...
📝 Upload request: ... (image/jpeg) - story
🔧 R2 Configuration: { hasAccessKey: true, hasSecretKey: true, ... }
✅ Presigned URL received
✅ File uploaded to R2 successfully
✅ Media uploaded successfully
```

❌ **Error Logs (if not configured):**
```
❌ Missing R2 credentials
Required environment variables:
  - R2_ACCESS_KEY_ID (currently: NOT SET)
  - R2_SECRET_ACCESS_KEY (currently: NOT SET)
```

## Troubleshooting

### Error: "R2 storage not configured"
**Solution:** Set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Supabase Edge Functions settings

### Error: "Invalid authentication token"
**Solution:** Make sure you're logged in before uploading

### Error: "R2 upload failed: 403 Forbidden"
**Solution:** Verify your R2 API token has write permissions

### Error: "R2 upload failed: 404 Not Found"
**Solution:** Check that `R2_BUCKET` and `R2_ENDPOINT` are correct

## Additional Resources

- **Detailed Guide:** See `docs/R2_UPLOAD_FIX_GUIDE.md` for comprehensive instructions
- **Edge Function Code:** See `supabase/functions/upload-to-r2/index.ts`
- **CDN Service Code:** See `app/services/cdnService.ts`

## Quick Checklist

- [ ] Get R2 credentials from Cloudflare Dashboard
- [ ] Set `R2_ACCESS_KEY_ID` in Supabase (NOT `CF_R2_ACCESS_KEY`)
- [ ] Set `R2_SECRET_ACCESS_KEY` in Supabase
- [ ] Set `R2_BUCKET` to `roastlive-assets`
- [ ] Set `R2_ENDPOINT` to your R2 endpoint URL
- [ ] Redeploy the `upload-to-r2` Edge Function
- [ ] Test upload functionality in the app
- [ ] Check Edge Function logs for any errors

## Summary

The issue is simply that the R2 credentials are not configured in Supabase. Once you set the correct environment variables (`R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`) and redeploy the Edge Function, the uploads will work.

**Remember:** Use `R2_ACCESS_KEY_ID`, NOT `CF_R2_ACCESS_KEY`!
