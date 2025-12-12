
# Admin Announcement Testing Guide

## Quick Test Steps

### 1. Send an Announcement (Admin Side)

1. **Login as Admin**
   - Ensure your user has admin role in the database

2. **Navigate to Admin Dashboard**
   ```
   Profile Tab → Admin Dashboard → Send Announcement
   ```

3. **Fill Out Announcement Form**
   - **Title**: "Test Announcement"
   - **Message**: "This is a test announcement to verify the notification system is working correctly."
   - **Target Audience**: Select "All Users"

4. **Send**
   - Tap "Send Announcement"
   - Confirm the action
   - ✅ Should see success message: "Announcement sent to X users!"

### 2. Receive Announcement (User Side)

1. **Check Notification Badge**
   - ✅ Red badge appears on Inbox tab
   - ✅ Shows unread count (e.g., "1")

2. **Open Inbox**
   - Tap Inbox tab
   - ✅ "Admin & System" category shows badge with count

3. **Filter by Category**
   - Tap "📢 Admin & System" filter
   - ✅ Announcement appears in list
   - ✅ Shows "System" as sender
   - ✅ Shows preview of message
   - ✅ Shows timestamp (e.g., "Just now")
   - ✅ Has unread indicator (dot)

4. **Open Announcement**
   - Tap on the announcement
   - ✅ Modal opens with full message
   - ✅ Shows announcement icon
   - ✅ Shows "Admin Announcement" title
   - ✅ Shows full message text
   - ✅ Shows timestamp
   - ✅ Has "Got it" button

5. **Close and Verify**
   - Tap "Got it" or close button
   - ✅ Modal closes
   - ✅ Notification marked as read (no dot)
   - ✅ Badge count decreases
   - ✅ Category badge updates

## Database Verification

### Check Notification Created
```sql
SELECT 
  id,
  type,
  category,
  message,
  read,
  receiver_id,
  created_at
FROM notifications
WHERE type = 'admin_announcement'
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
- ✅ New row with type = 'admin_announcement'
- ✅ category = 'admin'
- ✅ message contains announcement text
- ✅ read = false (initially)
- ✅ receiver_id matches target user

### Check Announcement Record
```sql
SELECT 
  id,
  title,
  body,
  segment_type,
  is_active,
  created_at
FROM admin_announcements
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
- ✅ New row with announcement details
- ✅ segment_type matches selected audience
- ✅ is_active = true

## Troubleshooting

### Badge Not Showing
1. Check user is logged in
2. Verify notification exists in database
3. Check `receiver_id` matches current user
4. Refresh the app
5. Check console for errors

### Announcement Not Opening
1. Verify notification type is 'admin_announcement' or 'system_update'
2. Check modal state in inbox screen
3. Look for JavaScript errors in console
4. Verify notification data structure

### Count Not Updating
1. Check auto-refresh is working (10s interval)
2. Manually pull-to-refresh
3. Navigate away and back to inbox
4. Check `notificationService.getUnreadCount()` response

## Test Scenarios

### Scenario A: Single User
1. Send announcement to "All Users"
2. ✅ User receives notification
3. ✅ Badge shows "1"
4. ✅ Can open and read
5. ✅ Badge clears after reading

### Scenario B: Multiple Categories
1. Send admin announcement
2. Receive gift notification
3. Receive like notification
4. ✅ Each in correct category
5. ✅ Total badge shows sum
6. ✅ Category badges show individual counts

### Scenario C: Mark All Read
1. Have multiple unread notifications
2. Tap "Mark All Read"
3. ✅ All notifications marked as read
4. ✅ All badges clear
5. ✅ Visual indicators update

### Scenario D: Category Filtering
1. Have notifications in multiple categories
2. Tap "Admin & System" filter
3. ✅ Only admin notifications show
4. ✅ Other categories hidden
5. ✅ Can switch between filters
6. ✅ "All" shows everything

## API Endpoints Used

### Send Announcement
```typescript
pushNotificationService.sendAdminAnnouncement(
  announcementId: string,
  title: string,
  body: string,
  segmentType: string,
  adminId: string
)
```

### Get Notifications
```typescript
notificationService.getNotificationsByCategory(
  userId: string,
  category?: NotificationCategory
)
```

### Get Unread Count
```typescript
notificationService.getUnreadCount(userId: string)
notificationService.getUnreadCountByCategory(userId: string, category: NotificationCategory)
```

### Mark as Read
```typescript
notificationService.markAsRead(notificationId: string)
notificationService.markAllAsRead(userId: string, category?: NotificationCategory)
```

## Success Criteria

✅ **All checks must pass:**

1. Admin can send announcements
2. Notifications created in database
3. Users receive notifications
4. Badge appears on Inbox tab
5. Badge shows correct count
6. Notifications appear in correct category
7. Users can open announcements
8. Modal displays full message
9. Notifications marked as read
10. Badge count updates
11. Auto-refresh works
12. Pull-to-refresh works
13. Category filtering works
14. Mark all as read works
15. No console errors
16. Smooth animations
17. Responsive UI

## Performance Metrics

- **Notification delivery**: < 1 second
- **Badge update**: < 500ms
- **Modal open**: < 300ms
- **Mark as read**: < 500ms
- **Auto-refresh**: Every 10 seconds
- **Badge refresh**: Every 30 seconds

## Notes

- Notifications persist across app restarts
- Unread count syncs across devices
- Push notifications sent to offline users
- Announcements can target specific user segments
- All actions logged for audit trail
- RLS policies ensure data security

---

**Last Updated**: 2025-01-XX
**Status**: ✅ All Tests Passing
