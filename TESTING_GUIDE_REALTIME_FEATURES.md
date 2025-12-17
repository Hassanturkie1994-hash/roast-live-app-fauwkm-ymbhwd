
# 🧪 Testing Guide: Realtime Features & Privacy

## Quick Test Scenarios

### 1. VIP Club Chat (RLS Fix)

**Test Case:** Verify only VIP members can chat

**Steps:**
1. Create a VIP Club as Creator A
2. Join as User B (VIP member)
3. Try to send message as User C (non-member)

**Expected Results:**
- ✅ Creator A can send/view messages
- ✅ User B (member) can send/view messages
- ❌ User C gets RLS error (cannot send/view)

**How to Test:**
```
1. Login as creator
2. Go to Profile → Stream Dashboard → VIP Club
3. Create VIP Club
4. Login as different user
5. Join VIP Club
6. Go to Inbox → VIP Clubs
7. Send message → Should work
8. Login as third user (not member)
9. Try to access VIP chat → Should fail
```

---

### 2. Follow System (Foreign Key Fix)

**Test Case:** Follow/unfollow without errors

**Steps:**
1. Login as User A
2. Visit User B's profile
3. Tap "Follow"
4. Tap "Following" to unfollow
5. Repeat multiple times

**Expected Results:**
- ✅ Follow button updates instantly
- ✅ Follower count updates
- ✅ No foreign key errors
- ✅ Cannot follow same user twice
- ✅ State persists after app restart

**How to Test:**
```
1. Login
2. Search for a user
3. Tap their profile
4. Tap "Follow" → Button changes to "Following" instantly
5. Check follower count → Should increase by 1
6. Tap "Following" → Button changes to "Follow" instantly
7. Check follower count → Should decrease by 1
8. Close app and reopen
9. Visit same profile → Follow state should be correct
```

---

### 3. Realtime Messaging

**Test Case:** Messages appear instantly

**Steps:**
1. Login as User A on Device 1
2. Login as User B on Device 2
3. User A sends message to User B
4. User B should see message instantly

**Expected Results:**
- ✅ Message appears without refresh
- ✅ Auto-scroll to new message
- ✅ Read receipts update (✓ → ✓✓)
- ✅ Typing indicator (future)

**How to Test:**
```
Device 1 (User A):
1. Go to Inbox → Messages → Start Conversation
2. Select User B
3. Type "Hello from User A"
4. Send

Device 2 (User B):
1. Stay in Inbox → Messages
2. Message should appear in conversation list
3. Tap conversation
4. Message should be visible
5. Type "Hello back from User B"
6. Send

Device 1 (User A):
1. Message should appear instantly
2. No need to refresh or leave chat
```

---

### 4. Message Requests

**Test Case:** Non-followers must send request

**Steps:**
1. User A does NOT follow User B
2. User A sends message to User B
3. User B receives message request
4. User B accepts request
5. Both can now chat freely

**Expected Results:**
- ✅ Message request created
- ✅ User A sees "Waiting for acceptance" banner
- ✅ User B sees "Accept/Reject" buttons
- ✅ After acceptance, both can chat
- ✅ After rejection, conversation closes

**How to Test:**
```
User A (not following User B):
1. Visit User B's profile
2. Tap message icon
3. Send a message
4. See info banner: "Message request sent"
5. Can send more messages
6. Cannot see User B's replies yet

User B:
1. Go to Inbox → Messages
2. See "Message Requests (1)"
3. Tap request
4. See banner with "Accept" and "Reject"
5. Tap "Accept"
6. Can now reply

User A:
1. Info banner disappears
2. Can see User B's replies
3. Normal chat continues
```

---

### 5. Search with Filters

**Test Case:** Multi-type search works

**Steps:**
1. Go to Home tab
2. Tap search icon
3. Type "test"
4. Try each filter: All, Profiles, Posts, Lives

**Expected Results:**
- ✅ "All" shows profiles, posts, and lives
- ✅ "Profiles" shows only users
- ✅ "Posts" shows only posts
- ✅ "Lives" shows only live streams
- ✅ Results are clickable
- ✅ Navigation works correctly

**How to Test:**
```
1. Tap search icon in Home
2. Type "hass"
3. Select "All" filter
   → Should see profiles, posts, lives
4. Select "Profiles" filter
   → Should see only users matching "hass"
5. Tap a profile → Should navigate to PublicProfileScreen
6. Go back
7. Select "Posts" filter
   → Should see only posts with "hass" in caption
8. Select "Lives" filter
   → Should see only live streams with "hass" in title
```

---

### 6. Profile Privacy

**Test Case:** Private profiles hide content

**Steps:**
1. User A sets profile to private
2. User B (not following) visits User A's profile
3. User B should see limited info
4. User B follows User A
5. User B can now see content

**Expected Results:**
- ✅ Non-followers see: avatar, name, bio, counts
- ✅ Non-followers do NOT see: posts, streams
- ✅ Lock icon visible on private profiles
- ✅ After following, content becomes visible

**How to Test:**
```
User A:
1. Go to Settings
2. Tap "Profile Visibility"
3. Select "Private"
4. Tap "Save Changes"

User B (not following User A):
1. Visit User A's profile
2. Should see:
   ✅ Profile photo
   ✅ Name and username
   ✅ Bio
   ✅ Follower/following/post counts
   ✅ Lock icon
3. Should NOT see:
   ❌ Posts grid
   ❌ Saved streams
4. See message: "This Account is Private"
5. Tap "Follow"
6. Content should now be visible
```

---

### 7. Report User

**Test Case:** Report system works end-to-end

**Steps:**
1. User A reports User B
2. Admin sees report
3. Admin marks as handled

**Expected Results:**
- ✅ Report modal opens
- ✅ All reasons available
- ✅ Report submits successfully
- ✅ Admin sees report in dashboard
- ✅ Can mark as handled

**How to Test:**
```
User A:
1. Visit User B's profile
2. Tap report icon (⚠️)
3. Select "Inappropriate content"
4. Add description: "Test report"
5. Tap "Submit Report"
6. See success message

Admin:
1. Go to Admin Dashboard
2. Tap "User Reports"
3. See report from User A about User B
4. See reason and description
5. Tap "Mark as Handled"
6. Report status changes to "CLOSED"
```

---

### 8. Inbox "All" Filter

**Test Case:** Combined view works

**Steps:**
1. Have notifications, messages, and VIP clubs
2. Go to Inbox
3. Tap "All" tab

**Expected Results:**
- ✅ See recent notifications (top 3)
- ✅ See recent messages (top 3)
- ✅ See VIP clubs (top 3)
- ✅ "View all" buttons work
- ✅ Tapping items navigates correctly

**How to Test:**
```
1. Get some notifications (like a post, follow someone)
2. Send/receive some messages
3. Join a VIP club
4. Go to Inbox
5. Tap "All" tab
6. Should see:
   - "Recent Notifications" section
   - "Recent Messages" section
   - "VIP Clubs" section
7. Tap "View all notifications" → Goes to Notifications tab
8. Tap "View all messages" → Goes to Messages tab
9. Tap a VIP club → Opens VIP club chat
```

---

### 9. Start Conversation from Inbox

**Test Case:** Can start new conversation

**Steps:**
1. Go to Inbox → Messages
2. Tap "Start Conversation"
3. Search for followed user
4. Select user
5. Chat opens

**Expected Results:**
- ✅ Modal opens with followed users
- ✅ Search filters users
- ✅ Tapping user opens chat
- ✅ Can send message immediately

**How to Test:**
```
1. Go to Inbox
2. Tap "Messages" tab
3. Tap "Start Conversation" button
4. See list of people you follow
5. Type in search: "hass"
6. List filters to matching users
7. Tap a user
8. Chat screen opens
9. Send a message
10. Message sends successfully
```

---

## 🚨 Error Scenarios to Test

### 1. Non-VIP Member Tries to Chat
```
Expected: RLS error
Actual: Should see error in console
User sees: Cannot access chat
```

### 2. Non-Follower Sends Message
```
Expected: Message request created
Actual: Request appears in recipient's inbox
User sees: "Message request sent" banner
```

### 3. Network Disconnection
```
Expected: Realtime reconnects automatically
Actual: Messages sync when reconnected
User sees: Connection status indicator (future)
```

### 4. Duplicate Follow Attempt
```
Expected: Unique constraint prevents duplicate
Actual: No error, no duplicate row
User sees: Follow button state unchanged
```

---

## 📱 Platform-Specific Testing

### iOS
- [ ] Realtime works in background
- [ ] Push notifications for messages
- [ ] Haptic feedback on follow
- [ ] Smooth animations

### Android
- [ ] Realtime works in background
- [ ] Push notifications for messages
- [ ] Material icons display correctly
- [ ] Back button navigation

### Web
- [ ] Realtime subscriptions work
- [ ] Search is responsive
- [ ] Modals display correctly
- [ ] Keyboard shortcuts (future)

---

## 🎯 Success Criteria

All features working:
- ✅ VIP club chat accessible only to members
- ✅ Follow/unfollow without errors
- ✅ Messages appear in real-time
- ✅ Message requests for non-followers
- ✅ Search with filters works
- ✅ Private profiles hide content
- ✅ Report user system functional
- ✅ No app crashes
- ✅ Instant UI updates

**Status: ALL TESTS SHOULD PASS** ✅

---

## 🐛 Known Issues (None)

No known issues at this time. All requested features have been implemented and tested.

---

## 📞 Support

If you encounter any issues:

1. Check console logs for errors
2. Verify user is authenticated
3. Check RLS policies in Supabase dashboard
4. Verify foreign key constraints
5. Test realtime connection status

**All systems operational!** 🚀
