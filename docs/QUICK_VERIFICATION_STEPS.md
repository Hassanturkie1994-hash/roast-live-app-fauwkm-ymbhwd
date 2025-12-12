
# Quick Verification Steps

## 🚀 5-Minute Verification Test

Follow these steps to verify everything is working:

### Step 1: Check Screen Registration (30 seconds)
1. Open the app
2. Navigate to Profile tab
3. Try accessing any admin screen (if you have admin role)
4. ✅ All screens should load without errors

### Step 2: Test Notification Badge (1 minute)
1. Look at the bottom tab bar
2. Check the Inbox tab
3. ✅ If you have unread notifications, you should see a red badge with count
4. ✅ Badge should be visible and readable

### Step 3: Test Inbox Screen (2 minutes)
1. Tap the Inbox tab
2. ✅ Screen should load showing notifications
3. ✅ Category filters should be visible at the top
4. ✅ Notifications should be grouped by category
5. Try tapping different category filters
6. ✅ Notifications should filter correctly

### Step 4: Test Announcement Modal (1 minute)
1. If you have an admin announcement notification:
   - Tap on it
   - ✅ Modal should open with full message
   - ✅ Modal should have close button
   - Tap "Got it" or close button
   - ✅ Modal should close
   - ✅ Notification should be marked as read

2. If you don't have an announcement:
   - Ask an admin to send a test announcement
   - Or check the "Admin & System" category for existing ones

### Step 5: Test Badge Updates (30 seconds)
1. After reading a notification
2. ✅ Badge count should decrease
3. ✅ Category badge should update
4. ✅ Unread indicator (dot) should disappear

## 🧪 Detailed Testing (15 minutes)

### Test A: Send Announcement (Admin Only)
1. Navigate to: Profile → Admin Dashboard → Send Announcement
2. Fill in:
   - Title: "Test Notification"
   - Message: "This is a test to verify the notification system."
   - Audience: "All Users"
3. Tap "Send Announcement"
4. ✅ Should see success message
5. ✅ Should show number of users notified

### Test B: Receive Announcement (Any User)
1. Wait a few seconds after announcement is sent
2. ✅ Badge should appear on Inbox tab
3. Tap Inbox tab
4. ✅ "Admin & System" category should show badge
5. Tap "Admin & System" filter
6. ✅ New announcement should appear at top
7. ✅ Should show "System" as sender
8. ✅ Should show preview of message
9. ✅ Should have unread indicator

### Test C: Open and Read
1. Tap the announcement
2. ✅ Modal opens smoothly
3. ✅ Shows full message
4. ✅ Shows timestamp
5. ✅ Has close button
6. Close the modal
7. ✅ Notification marked as read
8. ✅ Badge count decreases
9. ✅ Unread indicator disappears

### Test D: Multiple Categories
1. Have notifications in different categories
2. ✅ Each appears in correct category
3. ✅ Total badge shows sum of all unread
4. ✅ Category badges show individual counts
5. Switch between category filters
6. ✅ Filtering works correctly
7. ✅ "All" shows everything

### Test E: Mark All Read
1. Have multiple unread notifications
2. Tap "Mark All Read" button
3. ✅ All notifications marked as read
4. ✅ All badges clear
5. ✅ Visual indicators update

### Test F: Auto-Refresh
1. Open Inbox screen
2. Wait 10 seconds
3. ✅ Screen should auto-refresh
4. ✅ New notifications should appear
5. ✅ Badge counts should update

### Test G: Pull-to-Refresh
1. On Inbox screen
2. Pull down to refresh
3. ✅ Refresh indicator appears
4. ✅ Data reloads
5. ✅ Counts update

## 🔍 Database Verification

### Check Notifications Exist
```sql
SELECT COUNT(*) as total_notifications,
       SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications
WHERE receiver_id = 'YOUR_USER_ID';
```

Expected: Should show your notification counts

### Check Admin Announcements
```sql
SELECT id, title, body, segment_type, created_at
FROM admin_announcements
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Should show recent announcements

### Check Notification Categories
```sql
SELECT category, COUNT(*) as count
FROM notifications
WHERE receiver_id = 'YOUR_USER_ID'
GROUP BY category;
```

Expected: Should show distribution across categories

## ✅ Success Criteria

All of these should be true:

- [ ] All screens load without errors
- [ ] Inbox tab shows badge when there are unread notifications
- [ ] Badge count is accurate
- [ ] Notifications display in correct categories
- [ ] Category filtering works
- [ ] Announcements open in modal
- [ ] Modal displays full message
- [ ] Notifications can be marked as read
- [ ] Badge updates after marking as read
- [ ] "Mark All Read" works
- [ ] Auto-refresh updates data
- [ ] Pull-to-refresh works
- [ ] No console errors
- [ ] Smooth animations
- [ ] Responsive UI

## 🐛 Troubleshooting

### Badge Not Showing
- Check if you're logged in
- Verify you have unread notifications in database
- Try refreshing the app
- Check console for errors

### Notifications Not Loading
- Check internet connection
- Verify Supabase connection
- Check RLS policies
- Look for errors in console

### Modal Not Opening
- Verify notification type is 'admin_announcement'
- Check for JavaScript errors
- Try refreshing the app

### Count Not Updating
- Wait for auto-refresh (10s)
- Try pull-to-refresh
- Navigate away and back
- Check network requests

## 📞 Support

If you encounter issues:

1. Check console logs for errors
2. Verify database records
3. Check network requests
4. Review RLS policies
5. Restart the app

## 🎉 Expected Result

After completing all tests, you should have:

✅ A fully functional notification system
✅ Working admin announcement flow
✅ Accurate badge counts
✅ Smooth user experience
✅ All screens accessible
✅ No errors or warnings

---

**Time to Complete**: 5-15 minutes
**Difficulty**: Easy
**Prerequisites**: App installed, user account, admin access (for sending announcements)
