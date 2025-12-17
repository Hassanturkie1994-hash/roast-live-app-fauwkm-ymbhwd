
# Quick Reference: Authentication & Registration

## For Developers

### Registration Flow (Frontend)

```typescript
// ✅ CORRECT - Call signUp() once, let database trigger handle the rest
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: 'https://natively.dev/email-confirmed',
    data: {
      display_name: displayName,
    },
  },
});

// ❌ WRONG - Don't manually create profile or wallet
// The database trigger handles this automatically
```

### What Happens Automatically

When `signUp()` is called, the database trigger creates:
1. Profile (username, display_name, email)
2. Wallet (balance = 0)
3. User Settings (theme, language, etc.)
4. Notification Preferences (all enabled)

### Login Flow

```typescript
// Simple login - no manual profile creation needed
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Profile is fetched automatically by AuthContext
```

### Password Reset

```typescript
// Request reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://natively.dev/reset-password',
});

// Update password
await supabase.auth.updateUser({
  password: newPassword,
});
```

---

## For Database Admins

### Check Trigger Status

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
```

### Verify User Data

```sql
SELECT 
  p.id,
  p.username,
  p.email,
  w.balance_cents,
  us.theme,
  np.stream_started
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
LEFT JOIN user_settings us ON us.user_id = p.id
LEFT JOIN notification_preferences np ON np.user_id = p.id
WHERE p.email = 'user@example.com';
```

### Find Orphaned Records

```sql
-- Profiles without wallets
SELECT p.id, p.username
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
WHERE w.user_id IS NULL;

-- Profiles without settings
SELECT p.id, p.username
FROM profiles p
LEFT JOIN user_settings us ON us.user_id = p.id
WHERE us.user_id IS NULL;
```

### Manual User Creation (if needed)

```sql
-- Only use if trigger fails
INSERT INTO profiles (id, username, display_name, email)
VALUES (
  'user-uuid',
  'username',
  'Display Name',
  'email@example.com'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallets (user_id, balance_cents)
VALUES ('user-uuid', 0)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_settings (user_id)
VALUES ('user-uuid')
ON CONFLICT (user_id) DO NOTHING;
```

---

## For QA Testers

### Quick Test

1. Register new user
2. Check email for verification link
3. Click verification link
4. Sign in
5. Verify profile loads
6. Check wallet shows 0 balance

### Expected Behavior

- ✅ Registration succeeds
- ✅ Email verification link received
- ✅ Can sign in after verification
- ✅ Profile exists with correct data
- ✅ Wallet exists with 0 balance
- ✅ Settings exist with defaults
- ✅ No errors in console

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Database error saving new user" | Old trigger conflict | Run migration |
| "User already registered" | Duplicate email | Use different email |
| "Email not confirmed" | Not verified | Check email and verify |
| Profile not found | Trigger failed | Check database logs |
| Wallet not found | Trigger failed | Check database logs |

---

## For Support Team

### User Can't Register

1. Check if email is already registered
2. Verify email format is valid
3. Check if device is banned
4. Look for error in Supabase logs

### User Can't Sign In

1. Verify email is confirmed
2. Check password is correct
3. Look for account suspension
4. Check device ban status

### Profile Missing

1. Check if user exists in auth.users
2. Verify trigger ran successfully
3. Manually create profile if needed
4. Report to dev team

### Wallet Missing

1. Check if profile exists
2. Verify trigger ran successfully
3. Manually create wallet if needed
4. Report to dev team

---

## Environment Variables

### Required

```env
PUBLIC_SUPABASE_URL=https://uaqsjqakhgycfopftzzp.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Email Redirect URLs

- Email Confirmation: `https://natively.dev/email-confirmed`
- Password Reset: `https://natively.dev/reset-password`

---

## Database Tables

### profiles
- Primary user data
- Username, display_name, email
- Role, streaming hours, followers

### wallets
- User balance in cents
- Lifetime earned/spent tracking

### user_settings
- App preferences
- Theme, language, auto-play

### notification_preferences
- Notification toggles
- All enabled by default

---

## Security

### RLS Policies

All tables have Row Level Security enabled:
- Users can only view/edit their own data
- Admins have elevated permissions
- Public data is read-only

### Device Bans

- Tracked via device fingerprint
- Checked before registration
- Prevents banned devices from signing up

### Email Verification

- Required before sign in
- Link expires in 24 hours
- Can resend verification email

---

## Monitoring

### Key Metrics

- Registration success rate
- Profile creation rate
- Wallet creation rate
- Email verification rate
- Sign in success rate

### Alerts

Set up alerts for:
- Registration failures
- Missing profiles
- Missing wallets
- Trigger failures
- High error rates

### Logs

Check these logs regularly:
- Supabase Auth logs
- Database trigger logs
- Application error logs
- Email delivery logs

---

## Troubleshooting

### Registration Fails

1. Check Supabase Auth logs
2. Verify trigger is active
3. Check for duplicate key errors
4. Verify RLS policies
5. Test with different email

### Profile Not Created

1. Check if trigger ran
2. Look for database errors
3. Verify user exists in auth.users
4. Manually create if needed
5. Report to dev team

### Wallet Not Created

1. Check if profile exists
2. Verify trigger ran
3. Look for foreign key errors
4. Manually create if needed
5. Report to dev team

### Email Not Received

1. Check spam folder
2. Verify email address is correct
3. Check Supabase email logs
4. Resend verification email
5. Try different email provider

---

## API Endpoints

### Registration
```
POST /auth/v1/signup
Body: { email, password, options }
```

### Login
```
POST /auth/v1/token?grant_type=password
Body: { email, password }
```

### Password Reset
```
POST /auth/v1/recover
Body: { email }
```

### Update Password
```
PUT /auth/v1/user
Body: { password }
Headers: { Authorization: Bearer <token> }
```

---

## Best Practices

### Do's ✅

- Call `signUp()` once per registration
- Let database trigger create user data
- Use email verification
- Handle errors gracefully
- Show clear error messages
- Log important events

### Don'ts ❌

- Don't manually create profiles
- Don't manually create wallets
- Don't retry signUp() on error
- Don't skip email verification
- Don't expose sensitive data
- Don't ignore errors

---

## Contact

For issues or questions:
- Dev Team: [dev@roastlive.com]
- Database Admin: [dba@roastlive.com]
- Support: [support@roastlive.com]

---

**Last Updated:** 2024-01-XX

**Version:** 1.0

**Status:** ✅ PRODUCTION READY
