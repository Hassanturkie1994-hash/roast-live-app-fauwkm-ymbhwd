
# Remaining Implementation Tasks

## 🔴 CRITICAL (Must be done immediately)

### 1. Enforce Verification for Payouts

**Files to Update:**
- `app/services/payoutService.ts`
- `app/screens/WithdrawScreen.tsx`
- `app/screens/CreatorEarningsScreen.tsx`

**Changes:**
```typescript
// In payoutService.ts
async requestPayout(userId: string, amount: number, method: string) {
  // Check verification first
  const canReceive = await identityVerificationService.canReceivePayouts(userId);
  if (!canReceive.canReceive) {
    return { success: false, error: canReceive.reason };
  }
  
  // Continue with payout logic...
}
```

### 2. Replace Image Components with CDNImageFixed

**Files to Update:**
- All screens that display images
- All components that display images

**Search and replace:**
```typescript
// OLD:
<Image source={{ uri: imageUrl }} style={styles.image} />

// NEW:
<CDNImageFixed source={{ uri: imageUrl }} style={styles.image} />
```

**Priority Files:**
- `app/screens/StoryViewerScreen.tsx`
- `app/screens/PublicProfileScreen.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/(home)/index.tsx`
- `components/StoriesBar.tsx`

### 3. Add Admin Actions to User Profiles

**File to Update:**
- `app/screens/PublicProfileScreen.tsx`

**Add:**
```typescript
// Only show if viewer is head_admin or admin
{(userRole === 'HEAD_ADMIN' || userRole === 'ADMIN') && (
  <TouchableOpacity
    style={styles.adminActionsButton}
    onPress={() => setShowAdminActionsModal(true)}
  >
    <IconSymbol name="shield.fill" size={20} color={colors.brandPrimary} />
    <Text>Admin Actions</Text>
  </TouchableOpacity>
)}
```

**Create Modal:**
- Ban user
- Issue warning
- Timeout user
- Remove verification
- Revoke roles

---

## 🟡 HIGH PRIORITY (Should be done soon)

### 4. Simplify Battle System

**Files to Update:**
- `components/BattleSetupBottomSheet.tsx`
- `app/services/battleService.ts`
- `app/screens/BattleLobbyScreen.tsx`

**Changes:**
- Remove "Casual" vs "Ranked" toggle
- Make ALL battles ranked
- Update UI to reflect this
- Update database queries

### 5. Simplify Stream Settings

**Files to Update:**
- `components/StreamSettingsBottomSheet.tsx`
- `app/(tabs)/pre-live-setup.tsx`

**Remove Toggles:**
- Enable rankings (always on)
- Enable season tracking (always on)
- Enable VIP club features (always on)
- Enable moderation tools (always on)
- Enable gifts (always on)
- Enable chat (always on)

**Keep Toggles:**
- Chat pause (for creators during stream)
- Safety hints
- Auto-moderate spam
- Stream delay
- Practice mode
- Who can watch

### 6. Fix Moderator Panel Centering

**File to Update:**
- `components/ModeratorPanelBottomSheet.tsx`

**Changes:**
- Center the modal on screen
- Ensure all details are visible
- Improve layout and spacing
- Make it easier to read

### 7. Improve VIP Club Pre-Live Interface

**File to Update:**
- `components/VIPClubBottomSheet.tsx`

**Add:**
- VIP Club members list
- Member levels display
- Gifting stats
- Make it interactive and clickable

---

## 🟢 MEDIUM PRIORITY (Can be done later)

### 8. Saved Stream Persistence Verification

**Files to Check:**
- `app/services/savedStreamService.ts`
- `app/services/replayService.ts`
- `app/screens/SavedStreamsScreen.tsx`
- `app/screens/ArchivedStreamsScreen.tsx`
- `app/screens/ReplayPlayerScreen.tsx`

**Verify:**
- Saved streams appear in all required locations
- Streams are playable on-demand
- Replay URLs are valid
- Thumbnails load correctly

### 9. Story/Post Persistence Verification

**Files to Check:**
- `app/screens/CreateStoryScreen.tsx`
- `app/screens/CreatePostScreen.tsx`
- `app/screens/StoryViewerScreen.tsx`

**Verify:**
- Stories persist beyond session
- Posts persist beyond session
- Media is retrievable on all devices
- No white screens when viewing

### 10. Profile Image/Banner Persistence

**Files to Update:**
- `app/screens/EditProfileScreen.tsx`

**Changes:**
- Store `avatar_cdn_url` and `avatar_storage_path` when uploading
- Store `banner_cdn_url` and `banner_storage_path` when uploading
- Use CDNImageFixed for display

---

## 🔵 LOW PRIORITY (Nice to have)

### 11. Enhanced Error Messages

**Files to Update:**
- All service files

**Add:**
- More descriptive error messages
- User-friendly error explanations
- Suggestions for fixing errors

### 12. Loading State Improvements

**Files to Update:**
- All screens with loading states

**Add:**
- Skeleton loaders instead of spinners
- Progressive loading for lists
- Optimistic UI updates

### 13. Accessibility Improvements

**Files to Update:**
- All components

**Add:**
- Accessibility labels
- Screen reader support
- Keyboard navigation

---

## 🛠️ IMPLEMENTATION GUIDE

### For Each Task:

1. **Read the current implementation**
   ```bash
   # Read the file
   read_files(['path/to/file.tsx'])
   ```

2. **Make the changes**
   ```typescript
   // Use str_replace to update specific sections
   // Or create new files with <write file="...">
   ```

3. **Test the changes**
   - Run the app
   - Test the feature
   - Check for errors
   - Verify functionality

4. **Update documentation**
   - Mark task as complete
   - Add notes if needed
   - Update testing checklist

---

## 📊 PROGRESS TRACKING

### Phase 1: Identity Verification & Role System ✅
- [x] Database migrations
- [x] Service layer
- [x] UI components
- [x] Enforcement logic
- [x] Audit logging

### Phase 2: Media Storage & UI Fixes 🚧
- [x] Database improvements
- [x] Service updates
- [x] CDNImageFixed component
- [ ] Replace all Image components
- [ ] Test media persistence

### Phase 3: Battle & Settings Simplification ⏳
- [ ] Remove casual/ranked distinction
- [ ] Simplify stream settings
- [ ] Update UI components
- [ ] Test battle flow

### Phase 4: Polish & Testing ⏳
- [ ] Fix moderator panel
- [ ] Improve VIP club interface
- [ ] Add admin actions to profiles
- [ ] Comprehensive testing
- [ ] Bug fixes

---

## 🎯 DEFINITION OF DONE

A feature is considered "done" when:

1. ✅ Code is implemented
2. ✅ Database migrations applied
3. ✅ RLS policies created
4. ✅ Service layer complete
5. ✅ UI components created
6. ✅ Error handling implemented
7. ✅ Audit logging added (if applicable)
8. ✅ Testing completed
9. ✅ Documentation updated
10. ✅ No console errors

---

**Last Updated:** $(date)
**Overall Progress:** 60% Complete
