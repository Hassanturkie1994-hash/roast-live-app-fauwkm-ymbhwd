
# 🎨 Roast Live Icon System

## Overview

The Roast Live icon system provides a unified, type-safe, and theme-aware solution for all icons throughout the app. With 70+ custom SVG icons and seamless platform integration, it ensures a consistent and professional user experience.

## Quick Start

```typescript
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colors } = useTheme();

  return (
    <UnifiedRoastIcon
      name="flame-home"
      size={24}
      color={colors.text}
    />
  );
}
```

## Features

✅ **70+ Custom Icons** - Roast Live branded SVG icons
✅ **Type-Safe** - Full TypeScript support with autocomplete
✅ **Theme-Aware** - Automatic adaptation to light/dark modes
✅ **Cross-Platform** - Works on iOS, Android, and Web
✅ **Safe Fallbacks** - No "?" placeholders, ever
✅ **Zero Dependencies** - Pure React Native SVG
✅ **Lightweight** - Minimal bundle size impact
✅ **Production-Ready** - Thoroughly tested and documented

## Components

### UnifiedRoastIcon (Primary)

The main icon component for all Roast Live branded icons.

```typescript
<UnifiedRoastIcon
  name="flame-home"        // Icon name (type-safe)
  size={24}                // Size in pixels
  color={colors.text}      // Color (theme-aware)
  forceTheme="dark"        // Optional: force theme
  style={customStyle}      // Optional: additional styles
/>
```

**Props:**
- `name` (required): Icon name from `UnifiedIconName` type
- `size` (optional): Icon size in pixels (default: 24)
- `color` (optional): Icon color (default: theme-aware)
- `forceTheme` (optional): Force 'light' or 'dark' theme
- `style` (optional): Additional styles

### IconSymbol (Secondary)

Platform-specific system icons (SF Symbols on iOS, Material Icons on Android).

```typescript
<IconSymbol
  ios_icon_name="chevron.left"
  android_material_icon_name="arrow_back"
  size={24}
  color={colors.text}
/>
```

**Use for:**
- System navigation icons
- Standard platform actions
- OS-specific UI elements

## Icon Categories

### Navigation & Core (11 icons)
```typescript
'flame-home'      // Home
'roast-compass'   // Explore
'fire-camera'     // Go Live
'smoke-message'   // Inbox
'roast-badge'     // Profile
'live'            // Live indicator
```

### Social & Engagement (13 icons)
```typescript
'shockwave-bell'  // Notifications
'crowd-flame'     // People
'spotlight-person' // User
'heart'           // Like
'comment'         // Comment
'share'           // Share
```

### Wallet & Premium (13 icons)
```typescript
'lava-wallet'         // Wallet
'roast-gift-box'      // Gifts
'premium-star-flame'  // Premium
'crown-flame'         // VIP
'vip-diamond-flame'   // VIP Diamond
```

### Settings & Security (13 icons)
```typescript
'heated-gear'      // Settings
'account-security' // Security
'shield-flame'     // Safety
'password'         // Password
'blocked-users'    // Blocked
```

### Admin & Moderation (5 icons)
```typescript
'admin-dashboard'  // Admin
'stream-dashboard' // Streams
'fire-info'        // Info
'warning'          // Warning
'achievements'     // Achievements
```

### Media & Content (11 icons)
```typescript
'video'           // Video
'hot-circle'      // Video alt
'burned-photo'    // Photos
'bookmark'        // Saved
'history'         // History
```

### Controls & Actions (14 icons)
```typescript
'play'            // Play
'pause'           // Pause
'stop'            // Stop
'mic'             // Microphone
'close'           // Close
'check'           // Confirm
'search'          // Search
```

## Usage Patterns

### Tab Bar Icons
```typescript
<UnifiedRoastIcon
  name="flame-home"
  size={28}
  color={isActive ? colors.brandPrimary : colors.textSecondary}
/>
```

### Button Icons
```typescript
<TouchableOpacity onPress={handlePress}>
  <UnifiedRoastIcon
    name="heated-gear"
    size={24}
    color={colors.text}
  />
</TouchableOpacity>
```

### Empty States
```typescript
<View style={styles.emptyState}>
  <UnifiedRoastIcon
    name="shockwave-bell"
    size={64}
    color={colors.textSecondary}
  />
  <Text>No notifications yet</Text>
</View>
```

### List Items
```typescript
<View style={styles.listItem}>
  <UnifiedRoastIcon
    name="lava-wallet"
    size={24}
    color={colors.brandPrimary}
  />
  <Text>Wallet</Text>
</View>
```

### Icon with Badge
```typescript
<View style={styles.iconContainer}>
  <UnifiedRoastIcon
    name="smoke-message"
    size={28}
    color={colors.text}
  />
  {unreadCount > 0 && (
    <View style={styles.badge}>
      <Text>{unreadCount}</Text>
    </View>
  )}
</View>
```

## Theme Integration

Always use theme colors for icons:

```typescript
const { colors } = useTheme();

// ✅ Good - Theme-aware
<UnifiedRoastIcon name="home" color={colors.text} />
<UnifiedRoastIcon name="settings" color={colors.textSecondary} />
<UnifiedRoastIcon name="live" color={colors.brandPrimary} />

// ❌ Bad - Hardcoded colors
<UnifiedRoastIcon name="home" color="#000000" />
<UnifiedRoastIcon name="settings" color="black" />
```

### Color Guidelines

| State | Color | Usage |
|-------|-------|-------|
| Active | `colors.brandPrimary` | Active tab, selected item |
| Default | `colors.text` | Normal state |
| Inactive | `colors.textSecondary` | Inactive tabs, disabled |
| Success | `#4CAF50` | Success states |
| Warning | `#FFA500` | Warning states |
| Error | `#DC143C` | Error states |

## Size Guidelines

| Context | Size | Usage |
|---------|------|-------|
| Tab Bar | 28px | Bottom navigation tabs |
| Buttons | 24px | Action buttons |
| List Items | 20-24px | List item icons |
| Headers | 32px | Screen headers |
| Empty States | 48-64px | Empty state illustrations |

## Development Tools

### IconAudit Component
Visual verification of all icons:
```typescript
import IconAudit from '@/components/Icons/IconAudit';
<IconAudit />
```

### IconSystemValidator Component
Automated validation of icon system:
```typescript
import IconSystemValidator from '@/components/Icons/IconSystemValidator';
<IconSystemValidator />
```

## Best Practices

### DO ✅

1. **Use UnifiedRoastIcon for branded icons**
   ```typescript
   <UnifiedRoastIcon name="flame-home" size={24} color={colors.text} />
   ```

2. **Use theme colors**
   ```typescript
   const { colors } = useTheme();
   <UnifiedRoastIcon name="settings" color={colors.text} />
   ```

3. **Provide explicit sizes**
   ```typescript
   <UnifiedRoastIcon name="home" size={24} />
   ```

4. **Use semantic icon names**
   ```typescript
   <UnifiedRoastIcon name="lava-wallet" />
   <UnifiedRoastIcon name="roast-gift-box" />
   ```

### DON'T ❌

1. **Don't use text placeholders**
   ```typescript
   // ❌ Never do this
   <Text>?</Text>
   <Text>Icon</Text>
   ```

2. **Don't hardcode colors**
   ```typescript
   // ❌ Bad
   <UnifiedRoastIcon name="home" color="#FF0000" />
   
   // ✅ Good
   <UnifiedRoastIcon name="home" color={colors.brandPrimary} />
   ```

3. **Don't mix icon systems**
   ```typescript
   // ❌ Bad - inconsistent
   <MaterialIcons name="home" />
   <FontAwesome name="user" />
   
   // ✅ Good - consistent
   <UnifiedRoastIcon name="flame-home" />
   <UnifiedRoastIcon name="roast-badge" />
   ```

## Adding New Icons

1. **Create SVG component** in `svg/` directory
2. **Export from index** in `svg/index.tsx`
3. **Add to UnifiedRoastIcon** icon map
4. **Add to type** `UnifiedIconName`
5. **Update documentation**
6. **Test in both themes**
7. **Verify on all platforms**

Example:
```typescript
// 1. Create NewIcon.tsx
export default function NewIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* SVG paths */}
    </Svg>
  );
}

// 2. Add to UnifiedRoastIcon.tsx
import NewIcon from './svg/NewIcon';

const iconMap = {
  // ...
  'new-icon': NewIcon,
};

export type UnifiedIconName =
  // ...
  | 'new-icon';
```

## Troubleshooting

### Icon not rendering?
1. Check icon name spelling
2. Verify import statement
3. Check console for warnings

### Icon color not changing with theme?
```typescript
// ❌ Bad - static color
<UnifiedRoastIcon name="home" color="#000000" />

// ✅ Good - theme-aware
const { colors } = useTheme();
<UnifiedRoastIcon name="home" color={colors.text} />
```

### Icon too small/large?
Use appropriate size for context:
- Tab bar: 28px
- Buttons: 24px
- List items: 20-24px
- Empty states: 48-64px

## Testing

### Visual Testing
1. Navigate through all screens
2. Check for "?" placeholders
3. Verify icon clarity
4. Test in both themes

### Functional Testing
1. Tap icon buttons
2. Verify navigation
3. Check empty states
4. Test admin screens

### Platform Testing
1. iOS device/simulator
2. Android device/emulator
3. Web browser

## Documentation

- **Usage Guide:** `docs/ICON_USAGE_GUIDE.md`
- **Verification Checklist:** `docs/ICON_VERIFICATION_CHECKLIST.md`
- **System Summary:** `docs/ICON_SYSTEM_SUMMARY.md`
- **Audit Report:** `docs/GLOBAL_ICON_AUDIT_AND_FIX_COMPLETE.md`

## Support

For icon-related issues:
1. Check this README
2. Review usage guide
3. Use IconAudit component
4. Check console warnings
5. Verify theme colors

## Summary

The Roast Live icon system provides:
- **70+ custom icons** with brand identity
- **Type-safe usage** with autocomplete
- **Theme-aware rendering** in light/dark modes
- **Cross-platform support** on iOS, Android, Web
- **Safe fallbacks** with no placeholders
- **Production-ready** quality and performance

Use `UnifiedRoastIcon` for all branded icons and `IconSymbol` for platform-specific system icons. Always use theme colors and follow the established patterns for consistency.

---

**Version:** 1.0.0
**Icons:** 70+
**Status:** ✅ Production Ready
