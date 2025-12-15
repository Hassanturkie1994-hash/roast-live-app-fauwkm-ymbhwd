
# 🚀 Icon System Quick Reference

## TL;DR

```tsx
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';

// That's it! Use it anywhere:
<UnifiedRoastIcon name="flame-home" size={24} />
```

## Common Patterns

### Navigation Tabs
```tsx
<UnifiedRoastIcon 
  name="flame-home" 
  size={28}
  color={isActive ? colors.brandPrimary : colors.tabIconColor}
/>
```

### Buttons
```tsx
<TouchableOpacity onPress={handlePress}>
  <UnifiedRoastIcon name="fire-camera" size={24} color="#FFF" />
  <Text>Go Live</Text>
</TouchableOpacity>
```

### List Items
```tsx
<View style={styles.listItem}>
  <UnifiedRoastIcon name="lava-wallet" size={20} />
  <Text>Wallet</Text>
  <UnifiedRoastIcon name="chevron-right" size={16} />
</View>
```

### With Badges
```tsx
<View>
  <UnifiedRoastIcon name="smoke-message" size={28} />
  {count > 0 && <Badge count={count} />}
</View>
```

## Most Used Icons

| Icon Name | Use Case |
|-----------|----------|
| `flame-home` | Home tab |
| `roast-compass` | Explore tab |
| `fire-camera` | Go Live button |
| `smoke-message` | Inbox/Messages |
| `roast-badge` | Profile |
| `shockwave-bell` | Notifications |
| `lava-wallet` | Wallet/Money |
| `roast-gift-box` | Gifts |
| `heated-gear` | Settings |
| `hot-circle` | Video content |

## Icon Sizes

- **Small**: 16-20px (list items, inline)
- **Medium**: 24-28px (tabs, buttons)
- **Large**: 32-48px (headers, empty states)

## Color Guidelines

### Do ✅
```tsx
// Let theme handle colors
<UnifiedRoastIcon name="home" size={24} />

// Use theme colors
<UnifiedRoastIcon name="home" size={24} color={colors.text} />

// Use brand color for active states
<UnifiedRoastIcon name="home" size={24} color={colors.brandPrimary} />
```

### Don't ❌
```tsx
// Don't hardcode colors that break in themes
<UnifiedRoastIcon name="home" size={24} color="#000000" />

// Don't use colors that disappear in dark mode
<UnifiedRoastIcon name="home" size={24} color="#FFFFFF" />
```

## Troubleshooting

### Icon not showing?
1. Check spelling: `flame-home` not `flame_home`
2. Check import: `UnifiedRoastIcon` not `RoastIcon`
3. Check console for warnings

### Wrong color?
1. Remove hardcoded colors
2. Use `colors.text` or `colors.brandPrimary`
3. Check theme context is available

### Icon too small/large?
1. Adjust `size` prop
2. Check parent container
3. Use standard sizes (16, 20, 24, 28, 32)

## Need a New Icon?

1. Check if similar icon exists
2. Request in team chat
3. Follow naming convention: `[adjective]-[noun]`
4. Ensure theme compatibility

---

**Pro Tip**: Use TypeScript autocomplete to discover available icons!
