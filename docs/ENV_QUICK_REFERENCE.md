
# Environment Variables - Quick Reference

## Client-Side (React Native App)

```typescript
// ✅ Use these in client code
PUBLIC_SUPABASE_URL=https://uaqsjqakhgycfopftzzp.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Usage:**
```typescript
const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
```

**Security:** ✅ Safe to expose in client bundle

---

## Server-Side (Edge Functions)

```typescript
// 🔒 Only available in Edge Functions
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CF_ACCOUNT_ID
CF_API_TOKEN
```

**Usage:**
```typescript
const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

**Security:** 🔒 Never expose to client

---

## Setup

### 1. Create `.env` file:
```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Edge Function secrets:
```bash
supabase secrets set CF_ACCOUNT_ID=your-id
supabase secrets set CF_API_TOKEN=your-token
```

---

## Security Rules

### ✅ DO:
- Use `PUBLIC_` prefix for client variables
- Keep anon key in client code
- Use RLS policies for data access
- Store service keys in Edge Functions only

### ❌ DON'T:
- Expose service role keys to client
- Hardcode credentials in source code
- Commit `.env` to git
- Use privileged keys in client

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Supabase configuration" | Check `.env` file exists with `PUBLIC_` prefix |
| Edge Function auth errors | Verify `SUPABASE_SERVICE_ROLE_KEY` in dashboard |
| RLS policy errors | Ensure RLS enabled and policies configured |

---

**Full Documentation:** See `docs/ENVIRONMENT_VARIABLES.md`
