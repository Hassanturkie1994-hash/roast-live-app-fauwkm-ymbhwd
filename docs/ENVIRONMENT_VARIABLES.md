
# Environment Variables Configuration

## Overview

This document describes the environment variable configuration for the Roast Live app, with a focus on security and proper separation between client-safe and server-only variables.

## Client-Side Variables (Public/Safe)

These variables are **safe to expose** in the client bundle and are prefixed with `PUBLIC_` to make this clear:

### `PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://uaqsjqakhgycfopftzzp.supabase.co`
- **Usage**: Client-side Supabase client initialization
- **Security**: ✅ Safe to expose - this is a public URL

### `PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Your Supabase anonymous (anon) key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage**: Client-side Supabase client initialization
- **Security**: ✅ Safe to expose - designed for client-side use with Row Level Security (RLS)
- **Note**: This key only provides access controlled by RLS policies

## Server-Side Variables (Private/Privileged)

These variables are **NEVER exposed** to the client and are only used in Supabase Edge Functions:

### `SUPABASE_URL`
- **Description**: Supabase project URL (server-side)
- **Usage**: Edge Functions only
- **Security**: ⚠️ Server-only - automatically available in Edge Functions

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key with admin privileges
- **Usage**: Edge Functions only - bypasses RLS
- **Security**: 🔒 **CRITICAL** - Never expose to client, only use in Edge Functions
- **Note**: This key has full database access and bypasses all RLS policies

### Cloudflare Variables
- `CF_ACCOUNT_ID` / `CLOUDFLARE_ACCOUNT_ID`
- `CF_API_TOKEN` / `CLOUDFLARE_API_TOKEN`
- **Security**: 🔒 Server-only - used in Edge Functions for live streaming

## Setup Instructions

### 1. Local Development

Create a `.env` file in the project root (this file is gitignored):

```bash
# .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Expo Configuration

For Expo apps, environment variables need to be configured in `app.json` or using `expo-constants`:

```json
{
  "expo": {
    "extra": {
      "PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
      "PUBLIC_SUPABASE_ANON_KEY": "your-anon-key-here"
    }
  }
}
```

Access them in code:
```typescript
import Constants from 'expo-constants';

const url = Constants.expoConfig?.extra?.PUBLIC_SUPABASE_URL;
const key = Constants.expoConfig?.extra?.PUBLIC_SUPABASE_ANON_KEY;
```

### 3. Edge Functions

Edge Functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Additional secrets can be set using:
```bash
supabase secrets set CF_ACCOUNT_ID=your-account-id
supabase secrets set CF_API_TOKEN=your-api-token
```

## Security Best Practices

### ✅ DO:
- Use `PUBLIC_` prefix for client-safe variables
- Keep the anon key in client code (it's designed for this)
- Use RLS policies to control data access
- Store service role keys only in Edge Functions
- Use environment variables instead of hardcoding values

### ❌ DON'T:
- Expose service role keys to the client
- Expose database connection strings to the client
- Use privileged keys in client-side code
- Commit `.env` files to version control
- Hardcode sensitive values in source code

## Migration from Old Variable Names

If you're migrating from the old `SUPABASE_URL` and `SUPABASE_ANON_KEY` naming:

1. **Client-side code**: Update to use `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
2. **Edge Functions**: Continue using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (no changes needed)

## Verification

To verify your configuration:

1. **Client-side**: Check that the Supabase client initializes successfully
2. **Edge Functions**: Check logs for any missing environment variable errors
3. **Security**: Ensure no service role keys appear in client bundles

## Troubleshooting

### "Missing Supabase configuration" error
- Ensure `.env` file exists with correct variable names
- Check that variables are prefixed with `PUBLIC_`
- Verify Expo configuration if using `expo-constants`

### Edge Function authentication errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Supabase dashboard
- Check Edge Function logs for specific error messages

### RLS policy errors
- Ensure RLS is enabled on all tables
- Verify policies allow the intended access patterns
- Test with the anon key to simulate client access

## References

- [Supabase Client Libraries](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
