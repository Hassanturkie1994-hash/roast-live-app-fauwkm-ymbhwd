
# 🚀 Icon System Quick Reference

## TL;DR

**Use this ONE component for ALL icons:**
```typescript
import { AppIcon, ROAST_ICONS, SYSTEM_ICONS } from '@/components/Icons';

// Roast branded icons
<AppIcon name={ROAST_ICONS.HOME} type="roast" size={24} color={colors.text} />

// System icons
<AppIcon 
  type="system" 
  iosName={SYSTEM_ICONS.CHEVRON_LEFT.ios} 
  androidName={SYSTEM_ICONS.CHEVRON_LEFT.android}
  size={24}
  color={colors.text}
/>
```

---

## Common Icons

### Navigation
```typescript
// Home
<AppIcon name={ROAST_ICONS.HOME} type="roast" />

// Back button
<AppIcon 
  type="system" 
  iosName={SYSTEM_ICONS.CHEVRON_LEFT.ios} 
  androidName={SYSTEM_ICONS.CHEVRON_LEFT.android}
/>

// Close button
<AppIcon 
  type="system" 
  iosName={SYSTEM_ICONS.CLOSE.ios} 
  androidName={SYSTEM_ICONS.CLOSE.android}
/>
```

### Social
```typescript
// Profile
<AppIcon name={ROAST_ICONS.PROFILE} type="roast" />

// People
<AppIcon name={ROAST_ICONS.PEOPLE} type="roast" />

// Heart/Like
<AppIcon name={ROAST_ICONS.HEART} type="roast" />

// Comment
<AppIcon name={ROAST_ICONS.COMMENT} type="roast" />

// Share
<AppIcon name={ROAST_ICONS.SHARE} type="roast" />
```

### Settings
```typescript
// Settings
<AppIcon name={ROAST_ICONS.SETTINGS} type="roast" />

// Security
<AppIcon name={ROAST_ICONS.ACCOUNT_SECURITY} type="roast" />

// Shield
<AppIcon name={ROAST_ICONS.SHIELD} type="roast" />

// Appearance
<AppIcon name={ROAST_ICONS.APPEARANCE} type="roast" />
```

### Wallet & Premium
```typescript
// Wallet
<AppIcon name={ROAST_ICONS.WALLET} type="roast" />

// Gift
<AppIcon name={ROAST_ICONS.GIFT} type="roast" />

// Premium
<AppIcon name={ROAST_ICONS.PREMIUM} type="roast" />

// Crown
<AppIcon name={ROAST_ICONS.CROWN} type="roast" />
```

### Admin
```typescript
// Admin Dashboard
<AppIcon name={ROAST_ICONS.ADMIN_DASHBOARD} type="roast" />

// Warning
<AppIcon name={ROAST_ICONS.WARNING} type="roast" />

// Flag (Report)
<AppIcon 
  type="system" 
  iosName={SYSTEM_ICONS.FLAG.ios} 
  androidName={SYSTEM_ICONS.FLAG.android}
/>
```

---

## Icon Sizes

```typescript
// Tab bar icons
<AppIcon name={ROAST_ICONS.HOME} size={28} />

// Button icons
<AppIcon name={ROAST_ICONS.SETTINGS} size={24} />

// List item icons
<AppIcon name={ROAST_ICONS.WALLET} size={20} />

// Empty state icons
<AppIcon name={ROAST_ICONS.INBOX} size={64} />
```

---

## Theme Colors

```typescript
const { colors } = useTheme();

// Active/Primary
<AppIcon name={ROAST_ICONS.HOME} color={colors.brandPrimary} />

// Default
<AppIcon name={ROAST_ICONS.SETTINGS} color={colors.text} />

// Inactive/Secondary
<AppIcon name={ROAST_ICONS.PROFILE} color={colors.textSecondary} />

// Success
<AppIcon name={ROAST_ICONS.CHECK} color="#4CAF50" />

// Warning
<AppIcon name={ROAST_ICONS.WARNING} color="#FFA500" />

// Error
<AppIcon name={ROAST_ICONS.CLOSE} color="#DC143C" />
```

---

## Complete Icon Lists

### Roast Icons (70+)

#### Navigation & Core
- `HOME` - flame-home
- `EXPLORE` - roast-compass
- `CAMERA` - fire-camera
- `INBOX` - smoke-message
- `PROFILE` - roast-badge
- `LIVE` - live

#### Social
- `NOTIFICATIONS` - shockwave-bell
- `BELL` - bell
- `PEOPLE` - crowd-flame
- `PERSON` - spotlight-person
- `FOLLOW` - follow
- `HEART` - heart
- `LIKE` - like
- `COMMENT` - comment
- `SHARE` - share
- `SEND` - send

#### Media
- `VIDEO` - hot-circle
- `GRID` - burned-photo
- `BOOKMARK` - bookmark
- `HISTORY` - history
- `STREAM_HISTORY` - stream-history
- `SAVED_STREAMS` - saved-streams
- `ADD` - add
- `EDIT` - edit
- `SEARCH` - search

#### Wallet & Premium
- `WALLET` - lava-wallet
- `GIFT` - roast-gift-box
- `GIFTS` - gifts
- `PREMIUM` - premium-star-flame
- `CROWN` - crown-flame
- `VIP_DIAMOND` - vip-diamond-flame
- `SUBSCRIPTIONS` - subscriptions
- `WITHDRAW` - withdraw
- `TRANSACTIONS` - transactions

#### Settings & Security
- `SETTINGS` - heated-gear
- `ACCOUNT_SECURITY` - account-security
- `PASSWORD` - password
- `SHIELD` - shield-flame
- `BLOCKED_USERS` - blocked-users
- `APPEARANCE` - appearance
- `PRIVACY` - privacy
- `TERMS` - terms
- `RULES` - rules
- `APPEALS` - appeals
- `LOGOUT` - logout

#### Admin & Moderation
- `ADMIN_DASHBOARD` - admin-dashboard
- `STREAM_DASHBOARD` - stream-dashboard
- `ACHIEVEMENTS` - achievements
- `WARNING` - fire-info

#### Controls & Actions
- `PLAY` - play
- `PAUSE` - pause
- `STOP` - stop
- `MIC` - mic
- `CLOSE` - close
- `CHECK` - check
- `CHEVRON_RIGHT` - chevron-right
- `CHEVRON_LEFT` - chevron-left
- `MORE` - more

### System Icons (50+)

#### Navigation
- `CHEVRON_LEFT` - chevron.left / chevron-back
- `CHEVRON_RIGHT` - chevron.right / chevron-forward
- `CHEVRON_UP` - chevron.up / chevron-up
- `CHEVRON_DOWN` - chevron.down / chevron-down
- `ARROW_BACK` - arrow.left / arrow-back

#### Actions
- `CLOSE` - xmark / close
- `CHECK` - checkmark / checkmark
- `ADD` - plus / add
- `REMOVE` - minus / remove
- `EDIT` - pencil / create
- `DELETE` - trash / trash

#### Social
- `PERSON` - person.fill / person
- `PEOPLE` - person.3.fill / people
- `PERSON_ADD` - person.badge.plus.fill / person-add
- `HEART` - heart.fill / heart
- `HEART_OUTLINE` - heart / heart-outline

#### Communication
- `MESSAGE` - message.fill / chatbubble
- `MAIL` - envelope.fill / mail
- `NOTIFICATIONS` - bell.fill / notifications
- `NOTIFICATIONS_OFF` - bell.slash.fill / notifications-off

#### Media
- `CAMERA` - camera.fill / camera
- `VIDEO` - video.fill / videocam
- `PHOTO` - photo.fill / image
- `PLAY` - play.fill / play-arrow
- `PAUSE` - pause.fill / pause
- `STOP` - stop.fill / stop

#### Settings & System
- `SETTINGS` - gear / settings
- `SEARCH` - magnifyingglass / search
- `FILTER` - line.3.horizontal.decrease.circle.fill / filter-list
- `MORE` - ellipsis / ellipsis-horizontal
- `INFO` - info.circle.fill / information-circle

#### Status & Indicators
- `WARNING` - exclamationmark.triangle.fill / warning
- `ERROR` - xmark.circle.fill / close-circle
- `SUCCESS` - checkmark.circle.fill / checkmark-circle
- `SHIELD` - shield.fill / shield
- `LOCK` - lock.fill / lock-closed
- `UNLOCK` - lock.open.fill / lock-open

#### Admin & Moderation
- `FLAG` - flag.fill / flag
- `BLOCK` - hand.raised.fill / hand-left
- `BAN` - nosign / ban

#### Time & Calendar
- `CLOCK` - clock.fill / time
- `CALENDAR` - calendar / calendar

#### Finance
- `WALLET` - creditcard.fill / wallet
- `GIFT` - gift.fill / gift
- `STAR` - star.fill / star

#### Documents
- `DOCUMENT` - doc.text.fill / document-text
- `FOLDER` - folder.fill / folder

#### Misc
- `HOME` - house.fill / home
- `BOOKMARK` - bookmark.fill / bookmark
- `SHARE` - square.and.arrow.up / share-social
- `DOWNLOAD` - arrow.down.circle.fill / download
- `UPLOAD` - arrow.up.circle.fill / cloud-upload

---

## Migration Examples

### Before → After

#### Tab Bar Icon
```typescript
// Before
<IconSymbol
  ios_icon_name="home"
  android_material_icon_name="home"
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

#### Back Button
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

#### Settings Icon
```typescript
// Before
<MaterialIcons name="settings" size={24} color={colors.text} />

// After
<AppIcon
  name={ROAST_ICONS.SETTINGS}
  type="roast"
  size={24}
  color={colors.text}
/>
```

---

## Troubleshooting

### Icon not showing?
1. Check spelling: `ROAST_ICONS.HOME` not `ROAST_ICONS.home`
2. Check type: `type="roast"` for branded icons
3. Check console for warnings

### Wrong icon?
1. Verify icon name in registry
2. Check `iconRegistry.ts` for correct mapping

### Color not working?
```typescript
// Use theme colors
const { colors } = useTheme();
<AppIcon name={ROAST_ICONS.HOME} color={colors.text} />
```

---

## Resources

- **Full Documentation:** `docs/ICON_SYSTEM_ROOT_CAUSE_FIX_COMPLETE.md`
- **Migration Checklist:** `docs/ICON_MIGRATION_CHECKLIST.md`
- **Icon Registry:** `components/Icons/iconRegistry.ts`
- **AppIcon Component:** `components/Icons/AppIcon.tsx`

---

**Last Updated:** 2025  
**Version:** 1.0.0
