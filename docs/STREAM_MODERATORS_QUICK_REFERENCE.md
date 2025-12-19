
# Stream Moderators - Quick Reference Guide

## 🎯 What are Stream Moderators?

Stream Moderators are users assigned by **creators** to help moderate their specific streams. They have **limited permissions** scoped only to the creator's streams.

### Key Differences

| Feature | Platform MODERATOR | Stream Moderator |
|---------|-------------------|------------------|
| **Assigned By** | HEAD_ADMIN | Creator |
| **Scope** | All streams on platform | Specific creator's streams only |
| **Dashboard Access** | ✅ Moderator Dashboard | ❌ No dashboards |
| **Can Stop Streams** | ✅ Any stream | ❌ Cannot stop streams |
| **Can Ban Platform-Wide** | ❌ No | ❌ No |
| **Can Ban from Stream** | ✅ Yes | ✅ Yes (assigned streams only) |
| **Access User Data** | ❌ No | ❌ No |
| **Access Financial Data** | ❌ No | ❌ No |

---

## 👤 For Creators

### How to Add Stream Moderators

1. Open **Stream Dashboard** from Account Settings
2. Scroll to **"Stream Moderators"** section
3. Click **"Manage Stream Moderators"**
4. Search for user by username
5. Click the **+** icon to add them
6. They will receive moderation permissions immediately

### How to Remove Stream Moderators

1. Open **"Manage Stream Moderators"** modal
2. Find the moderator in the list
3. Click the **trash icon** next to their name
4. Confirm removal
5. Their permissions are revoked immediately

### What Stream Moderators Can Do

✅ **Allowed:**
- Mute users in your streams
- Timeout users temporarily
- Remove inappropriate messages
- Pin important messages
- Help maintain chat quality

❌ **NOT Allowed:**
- Access your earnings or analytics
- Change your stream settings
- Access your VIP Club settings
- Moderate other creators' streams
- Access any dashboards
- View user financial data

---

## 🛡️ For Stream Moderators

### Your Permissions

You can moderate **ONLY** the streams of creators who assigned you.

**What you can do:**
- Mute disruptive users
- Timeout users (temporary ban from chat)
- Remove inappropriate messages
- Pin important announcements
- Help enforce stream rules

**What you CANNOT do:**
- Access any dashboards
- View creator earnings
- Change stream settings
- Moderate other creators' streams
- Ban users platform-wide
- Access user personal data

### How to View Your Assignments

1. Open **Account Settings**
2. You will NOT see any dashboards (this is normal)
3. Your moderation powers activate when you join assigned creator's stream
4. You'll see moderator controls in the stream chat

### How to Remove Yourself

1. Contact the creator who assigned you
2. Ask them to remove you from stream moderators
3. Or wait for them to remove you

---

## 🔧 For Developers

### Check if User is Stream Moderator

```typescript
import { moderationService } from '@/app/services/moderationService';

// Check if user is stream moderator for a creator
const isMod = await moderationService.isStreamModerator(creatorId, userId);

if (isMod) {
  // Show moderator controls
}
```

### Get All Stream Moderators for Creator

```typescript
const moderators = await moderationService.getStreamModerators(creatorId);

moderators.forEach(mod => {
  console.log(`${mod.profiles.username} is a stream moderator`);
});
```

### Get All Creators a User Moderates For

```typescript
const creators = await moderationService.getModeratedCreators(userId);

creators.forEach(creator => {
  console.log(`User moderates for ${creator.profiles.username}`);
});
```

### Add Stream Moderator

```typescript
const result = await moderationService.addStreamModerator(creatorId, userId);

if (result.success) {
  Alert.alert('Success', 'Stream moderator added');
} else {
  Alert.alert('Error', result.error);
}
```

### Remove Stream Moderator

```typescript
const result = await moderationService.removeStreamModerator(creatorId, userId);

if (result.success) {
  Alert.alert('Success', 'Stream moderator removed');
} else {
  Alert.alert('Error', result.error);
}
```

---

## 🗄️ Database Schema

### moderators Table

```sql
CREATE TABLE moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES profiles(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(streamer_id, user_id)
);
```

**Purpose:** Store creator-assigned stream moderators

**RLS Policies:**
- Creators can view/add/remove their own stream moderators
- Stream moderators can view their assignments
- Platform staff can view all

---

## 🚨 Common Issues

### Issue: "Manage Roles" still appears
**Solution:** This was a security bug. It has been removed. Only HEAD_ADMIN can manage global roles.

### Issue: Stream moderator can't access dashboard
**Solution:** This is correct behavior. Stream moderators have NO dashboard access. They only have moderation powers in assigned streams.

### Issue: Can't add stream moderator
**Possible Causes:**
1. User is already a stream moderator
2. Trying to add yourself (not allowed)
3. Network error

**Solution:** Check console logs for specific error message.

### Issue: Stream moderator has no permissions
**Solution:** Permissions activate when they join the assigned creator's stream. They won't see moderator controls in other streams.

---

## 📞 Support

### For Creators
If you need help managing stream moderators:
1. Check this guide first
2. Contact support if issue persists

### For Stream Moderators
If you have questions about your permissions:
1. Contact the creator who assigned you
2. Review the "Your Permissions" section above

### For Platform Staff
If you need to manage global roles:
1. Only HEAD_ADMIN can assign platform roles
2. Use RoleManagementScreen (HEAD_ADMIN only)
3. Stream moderators are managed by creators, not staff

---

## 🎓 Best Practices

### For Creators
- Only assign trusted users as stream moderators
- Clearly communicate expectations to moderators
- Remove moderators who abuse permissions
- Review moderation history regularly

### For Stream Moderators
- Only use moderation powers when necessary
- Be fair and consistent
- Follow the creator's stream rules
- Report serious issues to the creator

### For Platform Staff
- Do NOT interfere with creator-assigned stream moderators
- Only intervene if platform rules are violated
- Use platform moderation tools for serious violations

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** ✅ Active
