
# Cloudflare R2 Upload Fix Guide

## Problem
The `upload-to-r2` Edge Function is returning 500 errors because the R2 credentials are not properly configured in Supabase.

## Solution

### Step 1: Set Environment Variables in Supabase

You need to set the following environment variables in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uaqsjqakhgycfopftzzp
2. Navigate to **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
3. Add the following environment variables:

#### Required Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `R2_ACCESS_KEY_ID` | Your R2 Access Key ID | Get this from Cloudflare R2 dashboard |
| `R2_SECRET_ACCESS_KEY` | Your R2 Secret Access Key | Get this from Cloudflare R2 dashboard |
| `R2_BUCKET` | `roastlive-assets` | Your R2 bucket name |
| `R2_ENDPOINT` | `https://fa8a289eee5b85ef9de55545c6a9f8e9.r2.cloudflarestorage.com` | Your R2 endpoint URL |

**IMPORTANT:** The correct variable names are:
- ✅ `R2_ACCESS_KEY_ID` (CORRECT)
- ❌ `CF_R2_ACCESS_KEY` (WRONG - do not use this)

### Step 2: Get Your R2 Credentials from Cloudflare

1. Log in to your Cloudflare Dashboard: https://dash.cloudflare.com/
2. Navigate to **R2** in the left sidebar
3. Click on **Manage R2 API Tokens**
4. Create a new API token or use an existing one
5. Copy the **Access Key ID** and **Secret Access Key**

### Step 3: Configure R2 Bucket Permissions

Make sure your R2 bucket has the correct permissions:

1. Go to your R2 bucket settings in Cloudflare
2. Enable **Public Access** if you want the uploaded files to be publicly accessible
3. Configure CORS settings to allow uploads from your app domain:

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

### Step 4: Redeploy the Edge Function

After setting the environment variables, you need to redeploy the Edge Function:

**Option A: Using Supabase CLI**
```bash
supabase functions deploy upload-to-r2
```

**Option B: Using the Dashboard**
1. Go to Edge Functions in Supabase Dashboard
2. Find the `upload-to-r2` function
3. Click **Redeploy** or **Deploy New Version**

### Step 5: Test the Upload

After redeploying, test the upload functionality in your app:

1. Try uploading a story
2. Check the console logs for any errors
3. If you see errors, check the Edge Function logs in Supabase Dashboard

### Troubleshooting

#### Error: "R2 storage not configured"
- **Cause:** Environment variables are not set or have incorrect names
- **Solution:** Double-check that you've set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` (not `CF_R2_ACCESS_KEY`)

#### Error: "Invalid authentication token"
- **Cause:** User is not logged in or session has expired
- **Solution:** Make sure the user is logged in before attempting to upload

#### Error: "R2 upload failed: 403 Forbidden"
- **Cause:** R2 credentials are incorrect or don't have permission to upload
- **Solution:** Verify your R2 API token has write permissions

#### Error: "R2 upload failed: 404 Not Found"
- **Cause:** Bucket name or endpoint is incorrect
- **Solution:** Verify `R2_BUCKET` and `R2_ENDPOINT` are correct

### Verification Checklist

- [ ] Environment variables are set in Supabase Edge Functions settings
- [ ] Variable names are correct (`R2_ACCESS_KEY_ID`, not `CF_R2_ACCESS_KEY`)
- [ ] R2 credentials are valid and have write permissions
- [ ] R2 bucket exists and is accessible
- [ ] CORS is configured on the R2 bucket
- [ ] Edge Function has been redeployed after setting environment variables
- [ ] User is authenticated when attempting to upload

### Additional Notes

1. **Environment Variable Naming:** The Edge Function specifically looks for `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`. Using different names like `CF_R2_ACCESS_KEY` will not work.

2. **Public Access:** If you want uploaded files to be publicly accessible, make sure to enable public access on your R2 bucket and configure the public URL domain.

3. **CDN URL:** The Edge Function returns a public URL in the format `https://pub-{accountId}.r2.dev/{filePath}`. You may want to configure a custom domain for better branding.

4. **File Size Limits:** The current implementation has a 100MB file size limit. This is configured in `cdnService.ts`.

5. **Retry Logic:** The `cdnService.ts` includes retry logic with exponential backoff (3 attempts). If all attempts fail, check the Edge Function logs for detailed error messages.

## Summary

The main issue is that the environment variables are not set in Supabase. Follow the steps above to:

1. Set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Supabase Edge Functions settings
2. Redeploy the `upload-to-r2` Edge Function
3. Test the upload functionality

After completing these steps, the upload errors should be resolved.
