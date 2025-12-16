
# Authentication & Registration Quick Reference

## 🚀 Quick Start

### Register a New User
```typescript
const { error } = await signUp(email, password, displayName);
```

### Sign In
```typescript
const { error } = await signIn(email, password);
```

### Reset Password
```typescript
const { error } = await resetPassword(email);
```

### Change Password
```typescript
const { error } = await updatePassword(newPassword);
```

### Search Users
```typescript
const users = await adminService.searchUsers(query, limit);
```

### Follow User
```typescript
await followService.followUser(myUserId, targetUserId);
```

### Unfollow User
```typescript
await followService.unfollowUser(myUserId, targetUserId);
```

## 📊 Database Structure

### Tables Created on Signup
1. **profiles** - User profile information
2. **wallets** - User wallet with balance
3. **notification_preferences** - User notification settings

### Automatic Creation
All three tables are created automatically by the `handle_new_user()` trigger when a user signs up.

## 🔐 Security

### RLS Policies
- **profiles**: Users can insert/update own profile, everyone can view
- **wallets**: Users can only access own wallet
- **notification_preferences**: Users can only access own preferences

### Email Verification
- Required before sign in
- Link expires in 24 hours
- Redirect to: https://natively.dev/email-confirmed

### Password Requirements
- Minimum 6 characters
- No maximum length
- Can include any characters

## 🔍 User Search

### Search Function
```sql
SELECT * FROM search_users('query', 20);
```

### Search Capabilities
- Username (exact and partial match)
- Display name (exact and partial match)
- Email (admin only)
- Case-insensitive
- Ordered by relevance and follower count

### Indexes
- `idx_profiles_username`
- `idx_profiles_email`
- `idx_profiles_display_name`
- `idx_profiles_display_name_trgm` (fuzzy search)
- `idx_profiles_username_trgm` (fuzzy search)

## 💰 Wallet System

### Initial Balance
- New users start with 0 balance
- Balance is in cents (SEK)

### Transaction Types
- `deposit` - Add funds
- `withdraw` - Withdraw funds
- `gift_sent` - Send gift to creator
- `gift_received` - Receive gift from fan
- `subscription_payment` - Club subscription
- `platform_fee` - Platform commission
- `adjustment` - Manual adjustment

### Get Wallet Balance
```typescript
const balance = await walletService.getBalance(userId);
```

### Add Funds
```typescript
await walletService.addFunds(userId, amountCents, metadata);
```

## 👥 Follow System

### Check Following Status
```typescript
const isFollowing = await followService.isFollowing(myId, targetId);
```

### Get Followers
```typescript
const { data: followers } = await followService.getFollowers(userId);
```

### Get Following
```typescript
const { data: following } = await followService.getFollowing(userId);
```

## 🐛 Common Issues

### "Database error saving new user"
**Cause**: RLS policy blocking profile creation
**Solution**: Database trigger now handles creation with elevated privileges

### "Email not confirmed"
**Cause**: User trying to sign in before verifying email
**Solution**: Check email and click verification link

### "Profile not found"
**Cause**: Race condition between signup and trigger execution
**Solution**: Retry logic with exponential backoff (automatic)

### "Insufficient balance"
**Cause**: User trying to spend more than wallet balance
**Solution**: Validate balance before transactions

## 📝 Code Examples

### Complete Registration Flow
```typescript
// 1. User fills form
const displayName = "John Doe";
const email = "john@example.com";
const password = "securepassword123";

// 2. Call signUp
const { error } = await signUp(email, password, displayName);

// 3. Handle response
if (error) {
  Alert.alert('Error', error.message);
} else {
  Alert.alert('Success', 'Check your email to verify your account');
}
```

### Complete Sign In Flow
```typescript
// 1. User enters credentials
const email = "john@example.com";
const password = "securepassword123";

// 2. Call signIn
const { error } = await signIn(email, password);

// 3. Handle response
if (error) {
  if (error.message.includes('Email not confirmed')) {
    Alert.alert('Error', 'Please verify your email first');
  } else {
    Alert.alert('Error', error.message);
  }
}
```

### Complete Password Reset Flow
```typescript
// 1. Request reset
const { error } = await resetPassword(email);

// 2. User clicks link in email

// 3. Update password
const { error: updateError } = await updatePassword(newPassword);
```

### Complete User Search Flow
```typescript
// 1. Search users
const users = await adminService.searchUsers('john', 20);

// 2. Display results
users.forEach(user => {
  console.log(user.username, user.display_name);
});

// 3. Follow user
await followService.followUser(myId, user.id);
```

## 🔧 Maintenance

### Check Trigger Status
```sql
SELECT tgname, tgenabled, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

### Check RLS Policies
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('profiles', 'wallets', 'notification_preferences');
```

### Monitor Recent Signups
```sql
SELECT 
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.username,
  w.balance_cents
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN wallets w ON u.id = w.user_id
ORDER BY u.created_at DESC
LIMIT 10;
```

## 📚 Related Files

### Frontend
- `contexts/AuthContext.tsx` - Auth state management
- `app/auth/register.tsx` - Registration screen
- `app/auth/login.tsx` - Login screen
- `app/auth/forgot-password.tsx` - Password reset screen
- `app/screens/ChangePasswordScreen.tsx` - Change password screen
- `app/screens/SearchScreen.tsx` - User search screen

### Services
- `app/services/adminService.ts` - User search and admin functions
- `app/services/walletService.ts` - Wallet management
- `app/services/followService.ts` - Follow/unfollow functionality

### Database
- `handle_new_user()` - Trigger function for new users
- `search_users()` - User search function
- RLS policies on `profiles`, `wallets`, `notification_preferences`

## 🎯 Best Practices

1. **Always use the auth context methods** - Don't call Supabase directly
2. **Handle errors gracefully** - Show user-friendly messages
3. **Validate input** - Check email format, password length, etc.
4. **Use retry logic** - For profile fetching after signup
5. **Check device bans** - Before allowing registration/login
6. **Send notifications** - For important events (new follower, etc.)
7. **Log everything** - For debugging and monitoring
8. **Test thoroughly** - Use the testing guide

## 🔗 Useful Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
