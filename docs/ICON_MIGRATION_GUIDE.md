
# 🔄 Icon Migration Guide

## Quick Migration Steps

### Step 1: Update Imports

**Before:**
```tsx
import { IconSymbol } from '@/components/IconSymbol';
import RoastIcon from '@/components/Icons/RoastIcon';
```

**After:**
```tsx
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
```

### Step 2: Replace IconSymbol

**Before:**
```tsx
<IconSymbol
  ios_icon_name="house.fill"
  android_material_icon_name="home"
  size={24}
  color={colors.text}
/>
```

**After:**
```tsx
<UnifiedRoastIcon 
  name="flame-home" 
  size={24}
/>
```

### Step 3: Update RoastIcon (Optional)

**Before:**
```tsx
<RoastIcon name="home" size={24} color={colors.text} />
```

**After:**
```tsx
<UnifiedRoastIcon name="flame-home" size={24} />
```

## Icon Name Mapping

### Navigation Icons
| Old Name | New Name | Notes |
|----------|----------|-------|
| `home` | `flame-home` | Roast-themed home |
| `explore` | `roast-compass` | Roast-themed explore |
| `camera` | `fire-camera` | Roast-themed camera |
| `inbox` | `smoke-message` | Roast-themed inbox |
| `profile` | `roast-badge` | Roast-themed profile |

### Social Icons
| Old Name | New Name | Notes |
|----------|----------|-------|
| `bell` / `notifications` | `shockwave-bell` | Roast-themed notifications |
| `people` | `crowd-flame` | Roast-themed people |
| `person` / `follow` | `spotlight-person` | Roast-themed person |
| `heart` | `heart` | Keep as is |
| `like` | `like` | Keep as is |
| `comment` | `comment` | Keep as is |

### Media Icons
| Old Name | New Name | Notes |
|----------|----------|-------|
| `video` | `hot-circle` | Roast-themed video |
| `grid` | `burned-photo` | Roast-themed grid |
| `bookmark` | `bookmark` | Keep as is |
| `history` | `history` | Keep as is |

### Wallet Icons
| Old Name | New Name | Notes |
|----------|----------|-------|
| `wallet` | `lava-wallet` | Roast-themed wallet |
| `gift` / `gifts` | `roast-gift-box` | Roast-themed gift |
| `premium` | `premium-star-flame` | Roast-themed premium |
| `crown` | `crown-flame` | Roast-themed crown |

### Settings Icons
| Old Name | New Name | Notes |
|----------|----------|-------|
| `settings` | `heated-gear` | Roast-themed settings |
| `shield` | `shield-flame` | Roast-themed shield |
| `warning` | `fire-info` | Roast-themed warning |

## Common Patterns

### Pattern 1: Tab Bar Icons
```tsx
// Before
<IconSymbol
  ios_icon_name="house.fill"
  android_material_icon_name="home"
  size={28}
  color={isActive ? colors.brandPrimary : colors.text}
/>

// After
<UnifiedRoastIcon 
  name="flame-home" 
  size={28}
  color={isActive ? colors.brandPrimary : colors.tabIconColor}
/>
```

### Pattern 2: Button Icons
```tsx
// Before
<TouchableOpacity>
  <IconSymbol
    ios_icon_name="camera.fill"
    android_material_icon_name="camera"
    size={24}
    color="#FFFFFF"
  />
</TouchableOpacity>

// After
<TouchableOpacity>
  <UnifiedRoastIcon 
    name="fire-camera" 
    size={24}
    color="#FFFFFF"
  />
</TouchableOpacity>
```

### Pattern 3: List Item Icons
```tsx
// Before
<View style={styles.listItem}>
  <IconSymbol
    ios_icon_name="wallet.fill"
    android_material_icon_name="account_balance_wallet"
    size={20}
    color={colors.text}
  />
  <Text>Wallet</Text>
</View>

// After
<View style={styles.listItem}>
  <UnifiedRoastIcon name="lava-wallet" size={20} />
  <Text>Wallet</Text>
</View>
```

### Pattern 4: Empty States
```tsx
// Before
<View style={styles.emptyState}>
  <IconSymbol
    ios_icon_name="video.slash"
    android_material_icon_name="videocam_off"
    size={48}
    color={colors.textSecondary}
  />
  <Text>No videos yet</Text>
</View>

// After
<View style={styles.emptyState}>
  <UnifiedRoastIcon 
    name="hot-circle" 
    size={48}
    color={colors.textSecondary}
  />
  <Text>No videos yet</Text>
</View>
```

## Screen-by-Screen Migration

### Priority 1: Navigation & Core (✅ Complete)
- [x] TikTokTabBar
- [x] FloatingTabBar (if used)
- [x] Main navigation

### Priority 2: High-Traffic Screens
- [ ] Home screen
- [ ] Explore screen
- [ ] Profile screen
- [ ] Inbox screen
- [ ] Live stream controls

### Priority 3: Settings & Admin
- [ ] Account settings
- [ ] Wallet screens
- [ ] Admin dashboard
- [ ] Moderation tools

### Priority 4: Secondary Screens
- [ ] Empty states
- [ ] Error screens
- [ ] Onboarding
- [ ] Modals

## Testing Checklist

After migrating each screen:

- [ ] Icons render correctly in light theme
- [ ] Icons render correctly in dark theme
- [ ] Icons scale properly at different sizes
- [ ] No console warnings
- [ ] No "?" characters
- [ ] Colors have proper contrast
- [ ] Touch targets work correctly
- [ ] Animations work (if any)

## Common Issues & Solutions

### Issue: Icon not showing
**Solution**: Check icon name spelling and ensure it exists in `UnifiedRoastIcon`

### Issue: Wrong color in dark mode
**Solution**: Remove hardcoded colors, use theme colors instead

### Issue: Icon too small/large
**Solution**: Adjust `size` prop, check parent container constraints

### Issue: TypeScript error
**Solution**: Ensure icon name is in `UnifiedIconName` type

## Best Practices

### Do ✅
- Use theme-aware colors (let the system handle it)
- Use standard sizes (16, 20, 24, 28, 32, 48)
- Use Roast-themed icons for main navigation
- Test in both light and dark themes

### Don't ❌
- Don't hardcode colors that break in themes
- Don't use platform-specific icons (IconSymbol)
- Don't create one-off icon components
- Don't skip testing in both themes

## Automated Migration (Future)

Consider creating a codemod to automate migration:

```bash
# Example codemod command (not implemented yet)
npx jscodeshift -t icon-migration.js src/
```

## Support

Need help with migration?
1. Check this guide
2. Review `docs/UNIFIED_ICON_SYSTEM.md`
3. Check `docs/ICON_QUICK_REFERENCE.md`
4. Ask in team chat

---

**Pro Tip**: Migrate one screen at a time and test thoroughly before moving to the next!
