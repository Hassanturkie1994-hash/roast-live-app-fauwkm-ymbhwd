
# 🎨 Unified Roast Live Icon System

## Overview

The Unified Roast Live Icon System is a comprehensive, centralized icon solution that ensures:

- ✅ **Zero "?" icons** - All icons render properly across all platforms
- ✅ **Theme compatibility** - Perfect rendering in both light and dark modes
- ✅ **Brand consistency** - Unified Roast Live visual language
- ✅ **Premium quality** - Modern, livestream-focused design
- ✅ **Future-proof** - Centralized system for easy maintenance

## Key Features

### 1. Automatic Theme Adaptation
All icons automatically adapt to the current theme (light/dark) without any additional code:

```tsx
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';

// Automatically uses current theme
<UnifiedRoastIcon name="flame-home" size={24} />

// Force a specific theme if needed
<UnifiedRoastIcon name="flame-home" size={24} forceTheme="dark" />
```

### 2. Consistent Color System
Icons use theme-aware colors by default, but can be overridden:

```tsx
// Uses theme-aware color (recommended)
<UnifiedRoastIcon name="roast-compass" size={28} />

// Override with custom color
<UnifiedRoastIcon name="roast-compass" size={28} color="#FF0000" />
```

### 3. No Broken Icons
If an icon is missing, the system renders a subtle fallback (circle) instead of "?" characters.

## Icon Categories

### Navigation & Core
- `flame-home` / `home` - Home screen
- `roast-compass` / `explore` - Explore/Discovery
- `fire-camera` / `camera` - Camera/Live streaming
- `smoke-message` / `inbox` - Messages/Inbox
- `roast-badge` / `profile` - User profile
- `live` - Live indicator

### Notifications & Social
- `shockwave-bell` / `bell` / `notifications` - Notifications
- `crowd-flame` / `people` - Multiple users
- `spotlight-person` / `person` / `follow` - Single user/Follow
- `heart` - Favorite/Love
- `like` - Like action
- `comment` - Comments
- `share` - Share content
- `send` - Send message

### Media & Content
- `hot-circle` / `video` - Video content
- `burned-photo` / `grid` - Photo grid/Gallery
- `bookmark` - Saved content
- `history` / `stream-history` - History
- `saved-streams` - Saved streams
- `add` - Add new content
- `edit` - Edit content
- `search` - Search

### Wallet & Premium
- `lava-wallet` / `wallet` - Wallet/Balance
- `roast-gift-box` / `gift` / `gifts` - Gifts
- `premium-star-flame` / `premium` - Premium features
- `crown-flame` / `crown` - VIP/Crown
- `vip-diamond-flame` - VIP Diamond tier
- `subscriptions` - Subscriptions
- `withdraw` - Withdraw funds
- `transactions` - Transaction history

### Settings & Security
- `heated-gear` / `settings` - Settings
- `account-security` - Account security
- `password` - Password settings
- `shield-flame` / `shield` - Security/Protection
- `blocked-users` - Blocked users
- `appearance` - Appearance settings
- `privacy` - Privacy settings
- `terms` - Terms of service
- `rules` - Community rules
- `appeals` - Appeals
- `logout` - Logout

### Admin & Moderation
- `admin-dashboard` - Admin dashboard
- `stream-dashboard` - Stream dashboard
- `achievements` - Achievements
- `fire-info` / `warning` - Warnings/Info

### Controls & Actions
- `play` - Play
- `pause` - Pause
- `stop` - Stop
- `mic` - Microphone
- `close` - Close/Cancel
- `check` - Confirm/Check
- `chevron-right` - Navigate right
- `chevron-left` - Navigate left
- `more` - More options

## Usage Examples

### Basic Usage
```tsx
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';

function MyComponent() {
  return (
    <UnifiedRoastIcon 
      name="flame-home" 
      size={24} 
    />
  );
}
```

### With Theme Context
```tsx
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colors } = useTheme();
  
  return (
    <UnifiedRoastIcon 
      name="roast-compass" 
      size={28}
      color={colors.brandPrimary}
    />
  );
}
```

### In Buttons
```tsx
<TouchableOpacity onPress={handlePress}>
  <UnifiedRoastIcon 
    name="fire-camera" 
    size={24}
    color="#FFFFFF"
  />
  <Text>Go Live</Text>
</TouchableOpacity>
```

### With Badge/Notification
```tsx
<View style={styles.iconContainer}>
  <UnifiedRoastIcon 
    name="smoke-message" 
    size={28}
  />
  {unreadCount > 0 && (
    <View style={styles.badge}>
      <Text>{unreadCount}</Text>
    </View>
  )}
</View>
```

## Migration Guide

### From Old RoastIcon
The old `RoastIcon` component is now a wrapper around `UnifiedRoastIcon`, so existing code continues to work:

```tsx
// Old code (still works)
import RoastIcon from '@/components/Icons/RoastIcon';
<RoastIcon name="home" size={24} />

// New code (recommended)
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
<UnifiedRoastIcon name="flame-home" size={24} />
```

### From IconSymbol
Replace platform-specific `IconSymbol` with unified icons:

```tsx
// Old
<IconSymbol 
  ios_icon_name="house.fill"
  android_material_icon_name="home"
  size={24}
  color={colors.text}
/>

// New
<UnifiedRoastIcon 
  name="flame-home" 
  size={24}
/>
```

## Design Principles

### 1. Neutral Base Colors
Icons use neutral colors (black/white) that adapt to the theme, with Roast Live accent colors (red/orange) used sparingly for emphasis.

### 2. Consistent Stroke Width
All icons maintain a consistent stroke width of 1.5-2px for visual harmony.

### 3. Modern & Premium
Icons feature a modern, premium aesthetic suitable for a livestreaming platform.

### 4. Flame/Heat Motif
Many icons incorporate subtle flame or heat elements to reinforce the "Roast Live" brand.

## Performance

- **SVG-based**: Perfect scaling at any size
- **Lightweight**: Minimal bundle size impact
- **Cached**: Icons are rendered once and reused
- **No external dependencies**: All icons are self-contained

## Troubleshooting

### Icon Not Showing
1. Check the icon name is correct (see list above)
2. Verify the icon is imported in `UnifiedRoastIcon.tsx`
3. Check console for warnings

### Wrong Colors
1. Ensure you're using `useTheme()` for theme-aware colors
2. Check if `forceTheme` prop is needed
3. Verify color prop is valid

### Icon Too Small/Large
1. Adjust the `size` prop (default is 24)
2. Check parent container constraints
3. Verify no conflicting styles

## Future Enhancements

- [ ] Add animation support for interactive icons
- [ ] Create icon variants (outline, filled, etc.)
- [ ] Add more specialized icons as needed
- [ ] Implement icon search/preview tool

## Support

For issues or questions about the icon system:
1. Check this documentation
2. Review the `UnifiedRoastIcon.tsx` source code
3. Check console warnings for missing icons
4. Contact the development team

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
