
# Registration Testing Guide

## Quick Test Scenarios

### 1. Happy Path - New User Registration

**Steps:**
1. Open the app
2. Navigate to Register screen
3. Enter:
   - Display Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Tap "CREATE ACCOUNT"

**Expected Result:**
- ✅ Success alert appears
- ✅ Message says "Please check your email to verify your account"
- ✅ Redirected to login screen
- ✅ Email received with verification link
- ✅ No errors in console

**Database Check:**
```sql
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.email,
  w.balance_cents,
  us.theme,
  np.stream_started
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
LEFT JOIN user_settings us ON us.user_id = p.id
LEFT JOIN notification_preferences np ON np.user_id = p.id
WHERE p.email = 'testuser@example.com';
```

**Expected Database State:**
- Profile exists with username, display_name, email
- Wallet exists with balance_cents = 0
- User_settings exists with default values
- Notification_preferences exists with all enabled

---

### 2. Email Verification

**Steps:**
1. Check email inbox for verification email
2. Click verification link
3. Return to app
4. Try to sign in with email/password

**Expected Result:**
- ✅ Email verification link works
- ✅ User can sign in after verification
- ✅ Profile loads correctly
- ✅ Wallet shows 0 balance
- ✅ No errors

---

### 3. Duplicate Email

**Steps:**
1. Register with email "testuser@example.com"
2. Try to register again with same email

**Expected Result:**
- ✅ Error message: "User already registered"
- ✅ No database errors
- ✅ No duplicate profiles created

---

### 4. Invalid Email Format

**Steps:**
1. Enter invalid email: "notanemail"
2. Tap "CREATE ACCOUNT"

**Expected Result:**
- ✅ Error: "Please enter a valid email address"
- ✅ No API call made
- ✅ User stays on register screen

---

### 5. Password Too Short

**Steps:**
1. Enter password: "12345" (less than 6 characters)
2. Tap "CREATE ACCOUNT"

**Expected Result:**
- ✅ Error: "Password must be at least 6 characters"
- ✅ No API call made

---

### 6. Password Mismatch

**Steps:**
1. Enter password: "password123"
2. Enter confirm password: "password456"
3. Tap "CREATE ACCOUNT"

**Expected Result:**
- ✅ Error: "Passwords do not match"
- ✅ No API call made

---

### 7. Empty Fields

**Steps:**
1. Leave all fields empty
2. Tap "CREATE ACCOUNT"

**Expected Result:**
- ✅ Error: "Please fill in all fields"
- ✅ No API call made

---

### 8. Network Error

**Steps:**
1. Turn off internet connection
2. Try to register
3. Turn internet back on

**Expected Result:**
- ✅ Error message about network
- ✅ No crash
- ✅ Can retry after reconnecting

---

### 9. Rapid Multiple Signups

**Steps:**
1. Enter valid registration details
2. Tap "CREATE ACCOUNT" multiple times rapidly

**Expected Result:**
- ✅ Button disabled after first tap
- ✅ Only one signup request sent
- ✅ No duplicate profiles created
- ✅ Loading state shown

---

### 10. Username Conflict Handling

**Steps:**
1. Register user with display name "testuser"
2. Register another user with display name "testuser"

**Expected Result:**
- ✅ Both users created successfully
- ✅ Usernames are unique (e.g., "testuser" and "testuser123")
- ✅ No database errors

---

### 11. Password Reset Flow

**Steps:**
1. Go to login screen
2. Tap "Forgot Password?"
3. Enter email
4. Tap "SEND RESET LINK"
5. Check email
6. Click reset link
7. Enter new password

**Expected Result:**
- ✅ Reset email received
- ✅ Reset link works
- ✅ Can set new password
- ✅ Can sign in with new password

---

### 12. Sign In Before Email Verification

**Steps:**
1. Register new user
2. Try to sign in immediately (before verifying email)

**Expected Result:**
- ✅ Error: "Please verify your email address before signing in"
- ✅ User cannot access app
- ✅ Clear instructions shown

---

### 13. Cross-Platform Consistency

**Test on each platform:**
- iOS
- Android
- Web

**Expected Result:**
- ✅ Registration works identically on all platforms
- ✅ Same validation rules
- ✅ Same error messages
- ✅ Same success flow

---

### 14. Profile Data Integrity

**Steps:**
1. Register new user with display name "John Doe"
2. Sign in
3. Check profile

**Expected Result:**
- ✅ Display name is "John Doe"
- ✅ Username is auto-generated (e.g., "johndoe")
- ✅ Email is correct
- ✅ Avatar is null (default)
- ✅ Followers count is 0
- ✅ Following count is 0
- ✅ Role is 'USER'
- ✅ Total streaming hours is 0

---

### 15. Wallet Initialization

**Steps:**
1. Register new user
2. Sign in
3. Navigate to wallet

**Expected Result:**
- ✅ Wallet exists
- ✅ Balance is 0 SEK
- ✅ Lifetime earned is 0
- ✅ Lifetime spent is 0
- ✅ No errors loading wallet

---

### 16. Settings Initialization

**Steps:**
1. Register new user
2. Sign in
3. Navigate to settings

**Expected Result:**
- ✅ Settings exist
- ✅ Theme is 'system'
- ✅ Language is 'en'
- ✅ Auto-play videos is enabled
- ✅ Show mature content is disabled

---

### 17. Notification Preferences

**Steps:**
1. Register new user
2. Sign in
3. Navigate to notification settings

**Expected Result:**
- ✅ All notifications enabled by default
- ✅ Stream started: enabled
- ✅ Gift received: enabled
- ✅ New follower: enabled
- ✅ Safety alerts: enabled
- ✅ Admin announcements: enabled

---

### 18. Search Visibility

**Steps:**
1. Register new user "SearchTest"
2. Sign in with different account
3. Search for "SearchTest"

**Expected Result:**
- ✅ New user appears in search results
- ✅ Profile is visible
- ✅ Can view profile
- ✅ Can follow user

---

### 19. Device Ban Check

**Steps:**
1. Ban a device (admin action)
2. Try to register from banned device

**Expected Result:**
- ✅ Error: "This device is banned from accessing Roast Live"
- ✅ Registration blocked
- ✅ No user created

---

### 20. VIP Club Eligibility

**Steps:**
1. Register new user
2. Check VIP club creation option

**Expected Result:**
- ✅ VIP club creation is locked
- ✅ Message: "Need 10 hours of streaming to unlock"
- ✅ total_streaming_hours is 0 in database

---

## Console Logs to Check

### Successful Registration
```
📝 Attempting sign up...
✅ Sign up successful - user data created automatically by database trigger
```

### Failed Registration
```
❌ Sign up error: [error details]
```

### Profile Fetch
```
Fetching profile for user: [user_id]
Profile fetched successfully: [profile data]
```

---

## Database Verification Queries

### Check User Creation
```sql
-- Verify all user data was created
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.email,
  p.created_at,
  w.balance_cents,
  us.theme,
  np.stream_started
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
LEFT JOIN user_settings us ON us.user_id = p.id
LEFT JOIN notification_preferences np ON np.user_id = p.id
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;
```

### Check for Orphaned Records
```sql
-- Find profiles without wallets
SELECT p.id, p.username, p.email
FROM profiles p
LEFT JOIN wallets w ON w.user_id = p.id
WHERE w.user_id IS NULL;

-- Find profiles without settings
SELECT p.id, p.username, p.email
FROM profiles p
LEFT JOIN user_settings us ON us.user_id = p.id
WHERE us.user_id IS NULL;
```

### Check Trigger Status
```sql
-- Verify trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
```

---

## Performance Testing

### Load Test
1. Register 10 users simultaneously
2. Check for:
   - ✅ All profiles created
   - ✅ All wallets created
   - ✅ No duplicate key errors
   - ✅ Reasonable response time (<2s)

### Stress Test
1. Register 100 users in quick succession
2. Check for:
   - ✅ All users created successfully
   - ✅ No database deadlocks
   - ✅ No trigger failures
   - ✅ Consistent data integrity

---

## Rollback Testing

### Test Rollback Procedure
1. Note current state
2. Run rollback SQL
3. Verify old behavior
4. Re-run migration
5. Verify new behavior

---

## Success Criteria

All tests must pass with:
- ✅ No "Database error saving new user" errors
- ✅ 100% profile creation rate
- ✅ 100% wallet creation rate
- ✅ 100% settings creation rate
- ✅ Zero duplicate key errors
- ✅ Email verification working
- ✅ Password reset working
- ✅ Cross-platform consistency

---

## Reporting Issues

If any test fails, report:
1. Test scenario number
2. Platform (iOS/Android/Web)
3. Error message
4. Console logs
5. Database state
6. Steps to reproduce

---

## Automated Testing

Consider adding automated tests for:
- Registration API calls
- Database trigger execution
- Profile/wallet creation
- Email verification flow
- Error handling

Example test:
```typescript
describe('Registration Flow', () => {
  it('should create profile, wallet, and settings on signup', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: { display_name: 'Test User' }
      }
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    
    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    expect(profile).toBeDefined();
    expect(profile.username).toBeDefined();
    
    // Verify wallet exists
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    
    expect(wallet).toBeDefined();
    expect(wallet.balance_cents).toBe(0);
  });
});
```

---

## Final Checklist

Before marking as complete:
- [ ] All 20 test scenarios pass
- [ ] Database queries return expected results
- [ ] Console logs show success messages
- [ ] No errors in Supabase logs
- [ ] Email verification works
- [ ] Password reset works
- [ ] Cross-platform tested
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team trained on new flow

---

**Status:** ✅ READY FOR TESTING

**Last Updated:** 2024-01-XX

**Tested By:** [Your Name]

**Approved By:** [Approver Name]
