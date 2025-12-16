
# 🔄 Icon Migration Checklist

## Overview

This checklist tracks the migration of all components and screens to use the new `AppIcon` system with the central icon registry.

**Goal:** Replace ALL hardcoded icon strings with registry references to eliminate "?" placeholders forever.

---

## Migration Status

### ✅ Completed (2/100+)
- [x] TikTokTabBar.tsx
- [x] FloatingTabBar.tsx

### 🔄 In Progress (0/100+)

### ⏳ Pending (98/100+)

---

## Tab Bars & Navigation

- [x] `components/TikTokTabBar.tsx` - ✅ Migrated to AppIcon + ROAST_ICONS
- [x] `components/FloatingTabBar.tsx` - ✅ Migrated to AppIcon + SYSTEM_ICONS
- [ ] `app/(tabs)/_layout.tsx`
- [ ] `app/(tabs)/_layout.ios.tsx`

---

## Screens - Admin

- [ ] `app/screens/AdminDashboardScreen.tsx`
- [ ] `app/screens/HeadAdminDashboardScreen.tsx`
- [ ] `app/screens/AdminReportsScreen.tsx`
- [ ] `app/screens/AdminLiveStreamsScreen.tsx`
- [ ] `app/screens/AdminStrikesScreen.tsx`
- [ ] `app/screens/AdminSuspensionsScreen.tsx`
- [ ] `app/screens/AdminBanAppealsScreen.tsx`
- [ ] `app/screens/AdminMessagingScreen.tsx`
- [ ] `app/screens/AdminAnalyticsScreen.tsx`
- [ ] `app/screens/AdminAnnouncementsScreen.tsx`
- [ ] `app/screens/AdminAppealsReviewScreen.tsx`
- [ ] `app/screens/AdminEscalationQueueScreen.tsx`
- [ ] `app/screens/AdminPenaltiesScreen.tsx`
- [ ] `app/screens/AdminPayoutPanelScreen.tsx`
- [ ] `app/screens/AdminPushNotificationsScreen.tsx`
- [ ] `app/screens/AdminAIModerationScreen.tsx`
- [ ] `app/screens/ModeratorDashboardScreen.tsx`
- [ ] `app/screens/ModeratorReviewQueueScreen.tsx`
- [ ] `app/screens/RoleManagementScreen.tsx`
- [ ] `app/screens/SupportDashboardScreen.tsx`

---

## Screens - User

- [ ] `app/screens/ProfileScreen.tsx`
- [ ] `app/screens/EditProfileScreen.tsx`
- [ ] `app/screens/PublicProfileScreen.tsx`
- [ ] `app/screens/AccountSettingsScreen.tsx`
- [ ] `app/screens/AccountSecurityScreen.tsx`
- [ ] `app/screens/ChangePasswordScreen.tsx`
- [ ] `app/screens/NotificationSettingsScreen.tsx`
- [ ] `app/screens/AppearanceSettingsScreen.tsx`
- [ ] `app/screens/BlockedUsersScreen.tsx`
- [ ] `app/screens/PrivacyPolicyScreen.tsx`
- [ ] `app/screens/TermsOfServiceScreen.tsx`
- [ ] `app/screens/SafetyCommunityRulesScreen.tsx`

---

## Screens - Wallet & Premium

- [ ] `app/screens/WalletScreen.tsx`
- [ ] `app/screens/AddBalanceScreen.tsx`
- [ ] `app/screens/WithdrawScreen.tsx`
- [ ] `app/screens/TransactionHistoryScreen.tsx`
- [ ] `app/screens/PremiumMembershipScreen.tsx`
- [ ] `app/screens/ManageSubscriptionsScreen.tsx`
- [ ] `app/screens/GiftInformationScreen.tsx`

---

## Screens - Creator

- [ ] `app/screens/CreatorEarningsScreen.tsx`
- [ ] `app/screens/StreamDashboardScreen.tsx`
- [ ] `app/screens/StreamRevenueScreen.tsx`
- [ ] `app/screens/PerformanceGrowthScreen.tsx`
- [ ] `app/screens/RetentionAnalyticsScreen.tsx`
- [ ] `app/screens/CreatorClubSetupScreen.tsx`
- [ ] `app/screens/FanClubManagementScreen.tsx`

---

## Screens - Streaming

- [ ] `app/screens/ViewerScreen.tsx`
- [ ] `app/screens/ArchivedStreamsScreen.tsx`
- [ ] `app/screens/SavedStreamsScreen.tsx`
- [ ] `app/screens/ReplaysTabScreen.tsx`
- [ ] `app/screens/ReplayPlayerScreen.tsx`

---

## Screens - Battle

- [ ] `app/screens/BattleFormatSelectionScreen.tsx`
- [ ] `app/screens/BattleLobbyScreen.tsx`
- [ ] `app/screens/BattlePreMatchLobbyScreen.tsx`
- [ ] `app/screens/BattleLiveMatchScreen.tsx`
- [ ] `app/screens/BattlePostMatchScreen.tsx`

---

## Screens - Social

- [ ] `app/screens/SearchScreen.tsx`
- [ ] `app/screens/LeaderboardScreen.tsx`
- [ ] `app/screens/AchievementsScreen.tsx`
- [ ] `app/screens/ChatScreen.tsx`
- [ ] `app/screens/CreatePostScreen.tsx`
- [ ] `app/screens/CreateStoryScreen.tsx`
- [ ] `app/screens/StoryViewerScreen.tsx`

---

## Screens - Misc

- [ ] `app/screens/AccessRestrictedScreen.tsx`
- [ ] `app/screens/DiagnosticScreen.tsx`
- [ ] `app/screens/ServiceHealthScreen.tsx`
- [ ] `app/screens/AppealsViolationsScreen.tsx`
- [ ] `app/screens/AppealsCenterScreen.tsx`

---

## Components - UI

- [ ] `components/ProfileHeader.tsx`
- [ ] `components/StreamPreviewCard.tsx`
- [ ] `components/ListItem.tsx`
- [ ] `components/HeaderButtons.tsx`
- [ ] `components/GradientButton.tsx`
- [ ] `components/FollowButton.tsx`

---

## Components - Streaming

- [ ] `components/LiveStreamControlPanel.tsx`
- [ ] `components/ChatOverlay.tsx`
- [ ] `components/EnhancedChatOverlay.tsx`
- [ ] `components/ModeratorChatOverlay.tsx`
- [ ] `components/GiftSelector.tsx`
- [ ] `components/EnhancedGiftOverlay.tsx`
- [ ] `components/GiftAnimationOverlay.tsx`
- [ ] `components/LiveSettingsPanel.tsx`
- [ ] `components/StreamHealthDashboard.tsx`
- [ ] `components/ConnectionStatusIndicator.tsx`
- [ ] `components/NetworkStabilityIndicator.tsx`

---

## Components - Modals

- [ ] `components/ReportModal.tsx`
- [ ] `components/EnhancedReportModal.tsx`
- [ ] `components/UserActionModal.tsx`
- [ ] `components/ViewerListModal.tsx`
- [ ] `components/ViewerProfileModal.tsx`
- [ ] `components/LeaderboardModal.tsx`
- [ ] `components/SaveReplayModal.tsx`
- [ ] `components/LivestreamExitModal.tsx`
- [ ] `components/ContentLabelModal.tsx`
- [ ] `components/CreatorRulesModal.tsx`
- [ ] `components/SafetyAcknowledgementModal.tsx`
- [ ] `components/ForcedReviewLockModal.tsx`
- [ ] `components/AgeVerificationModal.tsx`
- [ ] `components/BadgeEditorModal.tsx`
- [ ] `components/JoinClubModal.tsx`
- [ ] `components/JoinVIPClubModal.tsx`
- [ ] `components/FanClubJoinModal.tsx`
- [ ] `components/ModerationHistoryModal.tsx`

---

## Components - Battle

- [ ] `components/BattleInvitationPopup.tsx`
- [ ] `components/GuestInvitationModal.tsx`
- [ ] `components/GuestInvitationReceivedModal.tsx`
- [ ] `components/GuestActionMenuModal.tsx`
- [ ] `components/GuestControlPanel.tsx`
- [ ] `components/GuestSeatGrid.tsx`
- [ ] `components/GuestSelfControls.tsx`
- [ ] `components/HostControlButton.tsx`
- [ ] `components/HostControlDashboard.tsx`
- [ ] `components/ModeratorControlPanel.tsx`

---

## Components - Misc

- [ ] `components/StoriesBar.tsx`
- [ ] `components/GlobalLeaderboard.tsx`
- [ ] `components/GlobalLeaderboardTabs.tsx`
- [ ] `components/AchievementBadge.tsx`
- [ ] `components/PremiumBadge.tsx`
- [ ] `components/ClubBadge.tsx`
- [ ] `components/VIPClubBadge.tsx`
- [ ] `components/VIPClubPanel.tsx`
- [ ] `components/ContentLabelBadge.tsx`
- [ ] `components/LiveBadge.tsx`
- [ ] `components/SafetyHintTooltip.tsx`

---

## Migration Steps (Per File)

### 1. Import AppIcon and Registry
```typescript
import { AppIcon, ROAST_ICONS, SYSTEM_ICONS } from '@/components/Icons';
```

### 2. Replace IconSymbol with AppIcon
```typescript
// Before
<IconSymbol
  ios_icon_name="chevron.left"
  android_material_icon_name="arrow_back"
  size={24}
  color={colors.text}
/>

// After
<AppIcon
  type="system"
  iosName={SYSTEM_ICONS.CHEVRON_LEFT.ios}
  androidName={SYSTEM_ICONS.CHEVRON_LEFT.android}
  size={24}
  color={colors.text}
/>
```

### 3. Replace UnifiedRoastIcon with AppIcon
```typescript
// Before
<UnifiedRoastIcon
  name="flame-home"
  size={28}
  color={colors.text}
/>

// After
<AppIcon
  name={ROAST_ICONS.HOME}
  type="roast"
  size={28}
  color={colors.text}
/>
```

### 4. Replace MaterialIcons/Ionicons with AppIcon
```typescript
// Before
<MaterialIcons name="home" size={24} color={colors.text} />

// After
<AppIcon
  type="system"
  iosName={SYSTEM_ICONS.HOME.ios}
  androidName={SYSTEM_ICONS.HOME.android}
  size={24}
  color={colors.text}
/>
```

### 5. Remove Old Imports
```typescript
// Remove these
import { IconSymbol } from '@/components/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
```

### 6. Test
- Visual verification
- Light/dark theme
- iOS/Android/Web
- All user roles

---

## Verification Commands

```bash
# Search for IconSymbol usage
grep -r "IconSymbol" app/ components/ --include="*.tsx" --include="*.ts"

# Search for MaterialIcons usage
grep -r "MaterialIcons" app/ components/ --include="*.tsx" --include="*.ts"

# Search for Ionicons usage
grep -r "Ionicons" app/ components/ --include="*.tsx" --include="*.ts"

# Search for hardcoded icon names
grep -r "ios_icon_name=" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "android_material_icon_name=" app/ components/ --include="*.tsx" --include="*.ts"
```

---

## Progress Tracking

- **Total Files:** ~100+
- **Completed:** 2
- **In Progress:** 0
- **Remaining:** 98+
- **Completion:** 2%

---

## Notes

- Prioritize high-traffic screens first (Home, Profile, Settings)
- Test each screen after migration
- Verify no "?" characters appear
- Check console for warnings
- Update this checklist as you go

---

**Last Updated:** 2025  
**Status:** 🔄 In Progress
