
# 🎨 Roast Live Icon Usage Guide

## Quick Start

### Import the Icon Component

```typescript
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
```

### Basic Usage

```typescript
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

## Icon Systems

### 1. UnifiedRoastIcon (Primary)

**Use for:** All Roast Live branded icons and custom designs

```typescript
<UnifiedRoastIcon
  name="flame-home"        // Icon name (type-safe)
  size={24}                // Size in pixels
  color={colors.text}      // Color (theme-aware)
  forceTheme="dark"        // Optional: force theme
  style={customStyle}      // Optional: additional styles
/>
```

**Available Icons:** 70+ custom SVG icons
- See `components/Icons/UnifiedRoastIcon.tsx` for complete list
- TypeScript autocomplete available
- All icons are theme-aware

### 2. IconSymbol (Secondary)

**Use for:** Platform-specific system icons only

```typescript
<IconSymbol
  ios_icon_name="chevron.left"           // SF Symbol name (iOS)
  android_material_icon_name="arrow_back" // Material Icon (Android)
  size={24}
  color={colors.text}
/>
```

**When to use:**
- System navigation icons (back, forward, close)
- Standard system actions (share, settings)
- Platform-specific UI elements

## Icon Categories

### Navigation & Core
```typescript
<UnifiedRoastIcon name="flame-home" />      // Home
<UnifiedRoastIcon name="roast-compass" />   // Explore
<UnifiedRoastIcon name="fire-camera" />     // Go Live
<UnifiedRoastIcon name="smoke-message" />   // Inbox
<UnifiedRoastIcon name="roast-badge" />     // Profile
```

### Social & Engagement
```typescript
<UnifiedRoastIcon name="shockwave-bell" />  // Notifications
<UnifiedRoastIcon name="crowd-flame" />     // People/Community
<UnifiedRoastIcon name="spotlight-person" /> // User
<UnifiedRoastIcon name="heart" />           // Like
<UnifiedRoastIcon name="comment" />         // Comment
<UnifiedRoastIcon name="share" />           // Share
```

### Wallet & Premium
```typescript
<UnifiedRoastIcon name="lava-wallet" />         // Wallet
<UnifiedRoastIcon name="roast-gift-box" />      // Gifts
<UnifiedRoastIcon name="premium-star-flame" />  // Premium
<UnifiedRoastIcon name="crown-flame" />         // VIP
<UnifiedRoastIcon name="vip-diamond-flame" />   // VIP Diamond
```

### Settings & Security
```typescript
<UnifiedRoastIcon name="heated-gear" />      // Settings
<UnifiedRoastIcon name="account-security" /> // Security
<UnifiedRoastIcon name="shield-flame" />     // Safety
<UnifiedRoastIcon name="password" />         // Password
<UnifiedRoastIcon name="blocked-users" />    // Blocked
```

### Admin & Moderation
```typescript
<UnifiedRoastIcon name="admin-dashboard" />  // Admin
<UnifiedRoastIcon name="stream-dashboard" /> // Streams
<UnifiedRoastIcon name="fire-info" />        // Info/Warning
<UnifiedRoastIcon name="warning" />          // Warning
<UnifiedRoastIcon name="achievements" />     // Achievements
```

### Media & Content
```typescript
<UnifiedRoastIcon name="video" />           // Video
<UnifiedRoastIcon name="hot-circle" />      // Video alt
<UnifiedRoastIcon name="burned-photo" />    // Photos
<UnifiedRoastIcon name="bookmark" />        // Saved
<UnifiedRoastIcon name="history" />         // History
```

### Controls & Actions
```typescript
<UnifiedRoastIcon name="play" />            // Play
<UnifiedRoastIcon name="pause" />           // Pause
<UnifiedRoastIcon name="stop" />            // Stop
<UnifiedRoastIcon name="mic" />             // Microphone
<UnifiedRoastIcon name="close" />           // Close
<UnifiedRoastIcon name="check" />           // Confirm
<UnifiedRoastIcon name="search" />          // Search
```

## Theme-Aware Colors

### Always use theme colors:

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
| Active/Selected | `colors.brandPrimary` | Active tab, selected item |
| Default | `colors.text` | Normal state |
| Inactive | `colors.textSecondary` | Inactive tabs, disabled |
| Success | `#4CAF50` | Success states |
| Warning | `#FFA500` | Warning states |
| Error | `#DC143C` | Error states |

## Common Patterns

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
  <Text style={styles.emptyText}>No notifications yet</Text>
</View>
```

### List Item Icons

```typescript
<View style={styles.listItem}>
  <UnifiedRoastIcon
    name="lava-wallet"
    size={24}
    color={colors.brandPrimary}
  />
  <Text style={styles.listItemText}>Wallet</Text>
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
      <Text style={styles.badgeText}>{unreadCount}</Text>
    </View>
  )}
</View>
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

3. **Provide meaningful sizes**
   ```typescript
   // Tab bar: 28px
   // Buttons: 24px
   // List items: 20-24px
   // Empty states: 48-64px
   ```

4. **Use semantic icon names**
   ```typescript
   // ✅ Clear purpose
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

3. **Don't mix icon systems randomly**
   ```typescript
   // ❌ Bad - inconsistent
   <MaterialIcons name="home" />
   <FontAwesome name="user" />
   
   // ✅ Good - consistent
   <UnifiedRoastIcon name="flame-home" />
   <UnifiedRoastIcon name="roast-badge" />
   ```

4. **Don't use icons without proper sizing**
   ```typescript
   // ❌ Bad - no size specified
   <UnifiedRoastIcon name="home" />
   
   // ✅ Good - explicit size
   <UnifiedRoastIcon name="home" size={24} />
   ```

## Troubleshooting

### Icon not rendering?

1. **Check icon name spelling**
   ```typescript
   // ❌ Wrong
   <UnifiedRoastIcon name="home-flame" />
   
   // ✅ Correct
   <UnifiedRoastIcon name="flame-home" />
   ```

2. **Verify import**
   ```typescript
   import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
   ```

3. **Check console for warnings**
   ```
   ⚠️ UnifiedRoastIcon: Icon "invalid-name" not found in icon map
   ```

### Icon color not changing with theme?

```typescript
// ❌ Bad - static color
<UnifiedRoastIcon name="home" color="#000000" />

// ✅ Good - theme-aware
const { colors } = useTheme();
<UnifiedRoastIcon name="home" color={colors.text} />
```

### Icon too small/large?

```typescript
// Recommended sizes:
// - Tab bar: 28px
// - Buttons: 24px
// - List items: 20-24px
// - Headers: 32px
// - Empty states: 48-64px

<UnifiedRoastIcon name="home" size={24} />
```

## Testing Checklist

- [ ] Icon renders in light mode
- [ ] Icon renders in dark mode
- [ ] Icon color adapts to theme
- [ ] Icon size is appropriate
- [ ] No "?" placeholders visible
- [ ] Icon is semantically meaningful
- [ ] Icon works on iOS
- [ ] Icon works on Android
- [ ] Icon works on Web

## Icon Audit Tool

Use the IconAudit component to verify all icons:

```typescript
import IconAudit from '@/components/Icons/IconAudit';

// In your development screen
<IconAudit />
```

This displays all 70+ icons in a grid for visual verification.

## Adding New Icons

1. **Create SVG component** in `components/Icons/svg/`
2. **Export from index** in `components/Icons/svg/index.tsx`
3. **Add to UnifiedRoastIcon** icon map
4. **Add to type** `UnifiedIconName`
5. **Update documentation**

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

## Support

For icon-related issues:
1. Check this guide
2. Review `components/Icons/UnifiedRoastIcon.tsx`
3. Use IconAudit component for testing
4. Check console for warnings

## Summary

- **Use UnifiedRoastIcon** for all branded icons
- **Use IconSymbol** only for platform-specific system icons
- **Always use theme colors** from `useTheme()`
- **Never use "?" placeholders**
- **Test in both light and dark modes**
- **Follow semantic naming conventions**

The Roast Live icon system is production-ready, type-safe, and theme-aware. Follow these guidelines to maintain consistency and quality across the app.
