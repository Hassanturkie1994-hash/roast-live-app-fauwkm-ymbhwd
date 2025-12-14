
# Migration Guide: Old Filters/Effects → New Implementation

## Overview

This guide helps you migrate from the old filter/effect implementation to the new Snapchat-style implementation with centralized state management.

---

## Breaking Changes

### 1. Filter/Effect Props Removed

**OLD** (passing as props):
```typescript
<CameraFilterOverlay 
  filter={selectedFilter} 
  intensity={filterIntensity} 
/>
```

**NEW** (using context):
```typescript
import { useCameraEffects } from '@/contexts/CameraEffectsContext';

const { activeFilter, filterIntensity } = useCameraEffects();

<ImprovedCameraFilterOverlay 
  filter={activeFilter} 
  intensity={filterIntensity} 
/>
```

### 2. Navigation Params Removed

**OLD** (passing as params):
```typescript
router.push({
  pathname: '/broadcast',
  params: {
    selectedFilter: 'warm',
    selectedEffect: 'fire',
    filterIntensity: '0.8',
  },
});
```

**NEW** (using context):
```typescript
// No need to pass filter/effect params
router.push({
  pathname: '/broadcast',
  params: {
    streamTitle,
    contentLabel,
    // ... other params
  },
});
```

### 3. Component Names Changed

| Old Component | New Component |
|---------------|---------------|
| `CameraFilterOverlay` | `ImprovedCameraFilterOverlay` |
| `VisualEffectsOverlay` | `ImprovedVisualEffectsOverlay` |
| `FiltersPanel` | `ImprovedFiltersPanel` |
| `EffectsPanel` | `ImprovedEffectsPanel` |

---

## Step-by-Step Migration

### Step 1: Update Imports

**OLD**:
```typescript
import CameraFilterOverlay from '@/components/CameraFilterOverlay';
import VisualEffectsOverlay from '@/components/VisualEffectsOverlay';
import EffectsPanel from '@/components/EffectsPanel';
import FiltersPanel from '@/components/FiltersPanel';
```

**NEW**:
```typescript
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
import ImprovedVisualEffectsOverlay from '@/components/ImprovedVisualEffectsOverlay';
import ImprovedEffectsPanel from '@/components/ImprovedEffectsPanel';
import ImprovedFiltersPanel from '@/components/ImprovedFiltersPanel';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
```

### Step 2: Remove Local State

**OLD**:
```typescript
const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
const [filterIntensity, setFilterIntensity] = useState(1.0);
```

**NEW**:
```typescript
// Remove local state, use context instead
const { activeFilter, activeEffect, filterIntensity } = useCameraEffects();
```

### Step 3: Update Component Usage

**OLD**:
```typescript
<EffectsPanel
  visible={showEffectsPanel}
  onClose={() => setShowEffectsPanel(false)}
  selectedEffect={selectedEffect}
  onSelectEffect={setSelectedEffect}
/>

<FiltersPanel
  visible={showFiltersPanel}
  onClose={() => setShowFiltersPanel(false)}
  selectedFilter={selectedFilter}
  onSelectFilter={setSelectedFilter}
  filterIntensity={filterIntensity}
  onIntensityChange={setFilterIntensity}
/>
```

**NEW**:
```typescript
<ImprovedEffectsPanel
  visible={showEffectsPanel}
  onClose={() => setShowEffectsPanel(false)}
/>

<ImprovedFiltersPanel
  visible={showFiltersPanel}
  onClose={() => setShowFiltersPanel(false)}
/>
```

### Step 4: Update Active Indicators

**OLD**:
```typescript
{selectedEffect && <View style={styles.activeDot} />}
{selectedFilter && <View style={styles.activeDot} />}
```

**NEW**:
```typescript
const { hasActiveEffect, hasActiveFilter } = useCameraEffects();

{hasActiveEffect() && <View style={styles.activeDot} />}
{hasActiveFilter() && <View style={styles.activeDot} />}
```

### Step 5: Update Icon Colors

**OLD**:
```typescript
<IconSymbol
  ios_icon_name="sparkles"
  android_material_icon_name="auto_awesome"
  size={28}
  color={selectedEffect ? colors.brandPrimary : '#FFFFFF'}
/>
```

**NEW**:
```typescript
const { hasActiveEffect } = useCameraEffects();

<IconSymbol
  ios_icon_name="sparkles"
  android_material_icon_name="auto_awesome"
  size={28}
  color={hasActiveEffect() ? colors.brandPrimary : '#FFFFFF'}
/>
```

### Step 6: Remove Params Parsing

**OLD**:
```typescript
const params = useLocalSearchParams<{
  streamTitle?: string;
  contentLabel?: ContentLabel;
  selectedEffect?: string;
  selectedFilter?: string;
  filterIntensity?: string;
}>();

const [selectedEffect, setSelectedEffect] = useState<string | null>(
  params.selectedEffect || null
);
const [selectedFilter, setSelectedFilter] = useState<string | null>(
  params.selectedFilter || null
);
const [filterIntensity, setFilterIntensity] = useState(
  parseFloat(params.filterIntensity || '1.0')
);
```

**NEW**:
```typescript
const params = useLocalSearchParams<{
  streamTitle?: string;
  contentLabel?: ContentLabel;
  // Remove filter/effect params
}>();

// Use context instead
const { activeFilter, activeEffect, filterIntensity } = useCameraEffects();
```

### Step 7: Update Debug Logging

**OLD**:
```typescript
console.log('🎨 Filter selected:', filterId);
console.log('✨ Effect selected:', effectId);
```

**NEW**:
```typescript
// Context automatically logs all changes
// No need for manual logging
```

---

## Component-Specific Migrations

### Pre-Live Setup Screen

**Changes**:
1. Import `useCameraEffects` hook
2. Remove local filter/effect state
3. Update panel components
4. Remove filter/effect from navigation params
5. Update active indicators

**Before**:
```typescript
const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
const [filterIntensity, setFilterIntensity] = useState(1.0);

// ... later

router.push({
  pathname: '/(tabs)/broadcast',
  params: {
    streamTitle,
    contentLabel,
    selectedEffect: selectedEffect || '',
    selectedFilter: selectedFilter || '',
    filterIntensity: filterIntensity.toString(),
  },
});
```

**After**:
```typescript
const { activeFilter, activeEffect, filterIntensity, hasActiveFilter, hasActiveEffect } = useCameraEffects();

// ... later

router.push({
  pathname: '/(tabs)/broadcast',
  params: {
    streamTitle,
    contentLabel,
    // No filter/effect params needed
  },
});
```

### Broadcaster Screen

**Changes**:
1. Import `useCameraEffects` hook
2. Remove local filter/effect state
3. Remove params parsing for filters/effects
4. Update overlay components
5. Update panel components

**Before**:
```typescript
const params = useLocalSearchParams<{
  streamTitle?: string;
  contentLabel?: ContentLabel;
  selectedEffect?: string;
  selectedFilter?: string;
  filterIntensity?: string;
}>();

const [selectedEffect, setSelectedEffect] = useState<string | null>(
  params.selectedEffect || null
);
const [selectedFilter, setSelectedFilter] = useState<string | null>(
  params.selectedFilter || null
);
const [filterIntensity, setFilterIntensity] = useState(
  parseFloat(params.filterIntensity || '1.0')
);
```

**After**:
```typescript
const params = useLocalSearchParams<{
  streamTitle?: string;
  contentLabel?: ContentLabel;
  // Remove filter/effect params
}>();

const { activeFilter, activeEffect, filterIntensity, hasActiveFilter, hasActiveEffect } = useCameraEffects();
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Add Provider

**Problem**: Context is undefined

**Solution**: Add `CameraEffectsProvider` to `_layout.tsx`:

```typescript
<CameraEffectsProvider>
  <WidgetProvider>
    {/* ... */}
  </WidgetProvider>
</CameraEffectsProvider>
```

### ❌ Pitfall 2: Using Old Component Names

**Problem**: Components not found

**Solution**: Update all imports to use `Improved` prefix:

```typescript
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
```

### ❌ Pitfall 3: Passing Filter/Effect as Params

**Problem**: State not persisting correctly

**Solution**: Remove filter/effect from navigation params, use context instead

### ❌ Pitfall 4: Managing State Locally

**Problem**: State resets when navigating

**Solution**: Use `useCameraEffects()` hook instead of local state

---

## Verification Checklist

After migration, verify:

- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Filters apply correctly in pre-live setup
- [ ] Effects apply correctly in pre-live setup
- [ ] Filters persist to broadcaster screen
- [ ] Effects persist to broadcaster screen
- [ ] Can change filters during live
- [ ] Can change effects during live
- [ ] Active indicators show correctly
- [ ] Icon colors update correctly
- [ ] Debug logging works
- [ ] Performance is smooth (60 FPS)

---

## Rollback Plan

If you need to rollback:

1. **Revert layout files**:
   - Remove `CameraEffectsProvider` from `_layout.tsx` and `_layout.ios.tsx`

2. **Revert screen files**:
   - Restore old imports
   - Restore local state
   - Restore old component usage
   - Restore params passing

3. **Keep old components**:
   - Old components are still in the codebase
   - Just change imports back to old names

---

## Support

If you encounter issues during migration:

1. Check console for errors
2. Verify provider is added to layout
3. Verify imports are correct
4. Check component names have `Improved` prefix
5. Test on real device (not simulator)

---

## Timeline

Recommended migration timeline:

- **Day 1**: Update layout files, add provider
- **Day 2**: Migrate pre-live setup screen
- **Day 3**: Migrate broadcaster screen
- **Day 4**: Testing and verification
- **Day 5**: Production deployment

---

**Migration Status**: Ready to begin

**Estimated Time**: 1-2 days

**Risk Level**: Low (old components still available for rollback)

---

**Good luck with the migration! 🚀**
