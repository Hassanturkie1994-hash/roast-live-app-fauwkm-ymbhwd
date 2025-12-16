
# Registration & Authentication Testing Guide

## Overview
This guide provides step-by-step instructions for testing the complete user registration, authentication, and profile management system.

## Prerequisites
- Supabase project is running
- Database trigger `on_auth_user_created` is active
- RLS policies are properly configured
- Email service is configured in Supabase

## Test Scenarios

### 1. New User Registration

#### Test Case 1.1: Successful Registration
**Steps:**
1. Open the app
2. Navigate to Register screen
3. Enter the following:
   - Display Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Tap "CREATE ACCOUNT"

**Expected Results:**
- ✅ Success alert appears: "Your account has been created successfully!"
- ✅ Alert mentions checking email for verification
- ✅ User is redirected to login screen
- ✅ Verification email is sent to the provided email
- ✅ Database trigger creates:
  - Profile in `profiles` table
  - Wallet in `wallets` table with 0 balance
  - Notification preferences in `notification_preferences` table

**Verification:**
```sql
-- Check profile was created
SELECT * FROM profiles WHERE email = 'testuser@example.com';

-- Check wallet was created
SELECT w.* FROM wallets w
JOIN profiles p ON w.user_id = p.id
WHERE p.email = 'testuser@example.com';

-- Check notification preferences
SELECT n.* FROM notification_preferences n
JOIN profiles p ON n.user_id = p.id
WHERE p.email = 'testuser@example.com';
```

#### Test Case 1.2: Email Validation
**Steps:**
1. Try to register with invalid emails:
   - "notanemail"
   - "test@"
   - "@example.com"

**Expected Results:**
- ✅ Error alert: "Please enter a valid email address"
- ✅ Registration does not proceed

#### Test Case 1.3: Password Validation
**Steps:**
1. Try to register with password "12345" (less than 6 characters)

**Expected Results:**
- ✅ Error alert: "Password must be at least 6 characters"

#### Test Case 1.4: Password Mismatch
**Steps:**
1. Enter different passwords in "Password" and "Confirm Password"

**Expected Results:**
- ✅ Error alert: "Passwords do not match"

#### Test Case 1.5: Duplicate Email
**Steps:**
1. Try to register with an email that already exists

**Expected Results:**
- ✅ Error alert from Supabase (user already registered)
- ✅ No duplicate profile created

### 2. Email Verification

#### Test Case 2.1: Verify Email
**Steps:**
1. Check email inbox for verification email
2. Click the verification link

**Expected Results:**
- ✅ User is redirected to https://natively.dev/email-confirmed
- ✅ Email is marked as verified in Supabase Auth
- ✅ User can now sign in

#### Test Case 2.2: Sign In Before Verification
**Steps:**
1. Try to sign in before clicking verification link

**Expected Results:**
- ✅ Error alert: "Please verify your email address before signing in"
- ✅ User cannot access the app

### 3. User Sign In

#### Test Case 3.1: Successful Sign In
**Steps:**
1. After email verification, enter:
   - Email: "testuser@example.com"
   - Password: "password123"
2. Tap "SIGN IN"

**Expected Results:**
- ✅ User is signed in successfully
- ✅ User is redirected to home screen
- ✅ Profile data is loaded
- ✅ Wallet data is accessible

#### Test Case 3.2: Invalid Credentials
**Steps:**
1. Enter incorrect password

**Expected Results:**
- ✅ Error alert: "Invalid email or password"
- ✅ User remains on login screen

#### Test Case 3.3: Unverified Email
**Steps:**
1. Try to sign in with unverified email

**Expected Results:**
- ✅ Error alert: "Please verify your email address before signing in"

### 4. Password Reset

#### Test Case 4.1: Request Password Reset
**Steps:**
1. On login screen, tap "Forgot Password?"
2. Enter email: "testuser@example.com"
3. Tap "SEND RESET LINK"

**Expected Results:**
- ✅ Success alert: "Password reset instructions have been sent to your email"
- ✅ Password reset email is sent
- ✅ User is redirected back to login screen

#### Test Case 4.2: Reset Password via Email
**Steps:**
1. Check email for password reset link
2. Click the reset link
3. Enter new password
4. Confirm new password

**Expected Results:**
- ✅ Password is updated successfully
- ✅ User can sign in with new password
- ✅ Old password no longer works

### 5. Change Password (While Logged In)

#### Test Case 5.1: Change Password
**Steps:**
1. Sign in to the app
2. Navigate to Settings → Account Security → Change Password
3. Enter:
   - Current Password: "password123"
   - New Password: "newpassword123"
   - Confirm New Password: "newpassword123"
4. Tap "Update Password"

**Expected Results:**
- ✅ Success alert: "Your password has been updated successfully"
- ✅ User can sign in with new password
- ✅ Old password no longer works

#### Test Case 5.2: Incorrect Current Password
**Steps:**
1. Enter wrong current password

**Expected Results:**
- ✅ Error alert: "Current password is incorrect"

#### Test Case 5.3: Password Mismatch
**Steps:**
1. Enter different passwords in "New Password" and "Confirm New Password"

**Expected Results:**
- ✅ Error alert: "New passwords do not match"

### 6. User Search

#### Test Case 6.1: Search by Username
**Steps:**
1. Navigate to Search screen
2. Enter username in search box

**Expected Results:**
- ✅ Users with matching usernames appear
- ✅ Results are ordered by relevance
- ✅ Partial matches are included

#### Test Case 6.2: Search by Display Name
**Steps:**
1. Enter display name in search box

**Expected Results:**
- ✅ Users with matching display names appear
- ✅ Results are ordered by relevance

#### Test Case 6.3: Search by Email (Admin Only)
**Steps:**
1. As admin, search by email

**Expected Results:**
- ✅ User with matching email appears
- ✅ Regular users cannot search by email

#### Test Case 6.4: Empty Search
**Steps:**
1. Clear search box

**Expected Results:**
- ✅ Empty state appears
- ✅ Message: "Search for users"

#### Test Case 6.5: No Results
**Steps:**
1. Search for non-existent user

**Expected Results:**
- ✅ Empty state appears
- ✅ Message: "No users found"

### 7. Follow System

#### Test Case 7.1: Follow User
**Steps:**
1. Search for a user
2. Tap "Follow" button

**Expected Results:**
- ✅ Button changes to "Following"
- ✅ Follower count increases
- ✅ Notification is sent to followed user
- ✅ Push notification is sent (if enabled)

#### Test Case 7.2: Unfollow User
**Steps:**
1. Tap "Following" button on a followed user

**Expected Results:**
- ✅ Button changes to "Follow"
- ✅ Follower count decreases
- ✅ User is removed from following list

#### Test Case 7.3: View Followers
**Steps:**
1. Navigate to profile
2. Tap on followers count

**Expected Results:**
- ✅ List of followers appears
- ✅ Each follower shows avatar, username, display name
- ✅ Can navigate to follower's profile

#### Test Case 7.4: View Following
**Steps:**
1. Navigate to profile
2. Tap on following count

**Expected Results:**
- ✅ List of following users appears
- ✅ Each user shows avatar, username, display name
- ✅ Can navigate to user's profile

### 8. Wallet Functionality

#### Test Case 8.1: View Wallet
**Steps:**
1. Sign in
2. Navigate to Wallet screen

**Expected Results:**
- ✅ Wallet balance is displayed (0 for new users)
- ✅ Transaction history is empty for new users
- ✅ Add balance button is visible

#### Test Case 8.2: Add Balance
**Steps:**
1. Tap "Add Balance"
2. Select amount
3. Complete payment

**Expected Results:**
- ✅ Balance increases
- ✅ Transaction is recorded
- ✅ `lifetime_earned_cents` increases

#### Test Case 8.3: Send Gift
**Steps:**
1. During a live stream, send a gift

**Expected Results:**
- ✅ Balance decreases
- ✅ Transaction is recorded as "gift_sent"
- ✅ Receiver's balance increases
- ✅ Receiver gets transaction as "gift_received"

### 9. Database Trigger Verification

#### Test Case 9.1: Verify Trigger Execution
**Steps:**
1. Register a new user
2. Immediately check database

**Expected Results:**
```sql
-- Trigger should be active
SELECT tgname, tgenabled, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Should return: on_auth_user_created | O | handle_new_user
```

#### Test Case 9.2: Verify Idempotency
**Steps:**
1. Manually try to insert duplicate profile

**Expected Results:**
- ✅ `ON CONFLICT DO NOTHING` prevents duplicate
- ✅ No error is thrown
- ✅ Original profile remains unchanged

### 10. Security Testing

#### Test Case 10.1: RLS Policy Enforcement
**Steps:**
1. Try to access another user's wallet

**Expected Results:**
- ✅ Access is denied
- ✅ Only own wallet is accessible

#### Test Case 10.2: Device Ban
**Steps:**
1. Ban a device
2. Try to register from banned device

**Expected Results:**
- ✅ Error: "This device is banned from accessing Roast Live"
- ✅ Registration is blocked

#### Test Case 10.3: Profile Privacy
**Steps:**
1. View another user's profile

**Expected Results:**
- ✅ Public information is visible
- ✅ Private information (email) is hidden
- ✅ Wallet balance is hidden

## Performance Testing

### Test Case P.1: Search Performance
**Steps:**
1. Search for common term
2. Measure response time

**Expected Results:**
- ✅ Results appear within 500ms
- ✅ Trigram indexes are used
- ✅ No full table scans

### Test Case P.2: Profile Fetch Performance
**Steps:**
1. Sign in
2. Measure profile fetch time

**Expected Results:**
- ✅ Profile loads within 1 second
- ✅ Retry logic works if trigger is slow

## Error Handling

### Test Case E.1: Network Error
**Steps:**
1. Disable network
2. Try to register

**Expected Results:**
- ✅ Error alert: "Network error"
- ✅ User can retry when network is restored

### Test Case E.2: Database Error
**Steps:**
1. Simulate database error

**Expected Results:**
- ✅ Error is logged
- ✅ User-friendly error message is shown
- ✅ App doesn't crash

## Regression Testing

After any changes to auth system, verify:
- [ ] Registration still works
- [ ] Email verification still works
- [ ] Sign in still works
- [ ] Password reset still works
- [ ] Password change still works
- [ ] User search still works
- [ ] Follow/unfollow still works
- [ ] Wallet creation still works

## Monitoring

### Metrics to Track
1. **Registration Success Rate**: % of successful registrations
2. **Email Verification Rate**: % of users who verify email
3. **Password Reset Requests**: Number of reset requests per day
4. **Search Performance**: Average search response time
5. **Trigger Execution Time**: Time to create profile/wallet

### Logs to Monitor
```sql
-- Check recent registrations
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

-- Check for failed profile creations
SELECT u.email, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check for failed wallet creations
SELECT p.username, p.created_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL;
```

## Troubleshooting

### Issue: "Database error saving new user"
**Solution:**
1. Check if trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Check trigger function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Check RLS policies allow inserts
4. Review Supabase logs for detailed error

### Issue: Profile not found after registration
**Solution:**
1. Wait 1-2 seconds for trigger to complete
2. Check if trigger executed successfully
3. Verify user exists in `auth.users`
4. Check for errors in Supabase logs

### Issue: Wallet not created
**Solution:**
1. Verify trigger creates wallet
2. Check RLS policies on `wallets` table
3. Ensure `user_id` foreign key is valid

### Issue: Email not sent
**Solution:**
1. Check Supabase email settings
2. Verify email template is configured
3. Check spam folder
4. Review Supabase Auth logs

### Issue: Cannot search users
**Solution:**
1. Verify `search_users` function exists
2. Check trigram extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`
3. Verify indexes are created
4. Check function permissions

## Success Criteria

The registration system is working correctly when:
- ✅ New users can register without errors
- ✅ Email verification works
- ✅ Profile is created automatically
- ✅ Wallet is created automatically with 0 balance
- ✅ Users can sign in after verification
- ✅ Password reset works
- ✅ Password change works
- ✅ User search works
- ✅ Follow/unfollow works
- ✅ No "Database error saving new user" errors
- ✅ No duplicate profiles or wallets
- ✅ All RLS policies are enforced

## Next Steps

After successful testing:
1. Monitor registration success rate
2. Track email verification rate
3. Monitor search performance
4. Review user feedback
5. Optimize based on metrics

## Support

For issues:
1. Check application logs
2. Review Supabase dashboard logs
3. Verify database trigger status
4. Check RLS policies
5. Review this testing guide
