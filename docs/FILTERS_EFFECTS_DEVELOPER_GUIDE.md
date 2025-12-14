
# Filters & Effects Developer Guide

## Quick Start

### Using Filters and Effects in Your Component

```typescript
import { useCameraEffects, FILTER_PRESETS, EFFECT_PRESETS } from '@/contexts/CameraEffectsContext';

function MyComponent() {
  const {
    activeFilter,
    activeEffect,
    filterIntensity,
    setActiveFilter,
    setActiveEffect,
    setFilterIntensity,
    clearFilter,
    clearEffect,
    hasActiveFilter,
    hasActiveEffect,
  } = useCameraEffects();

  // Select a filter
  const selectWarmFilter = () => {
    const warmFilter = FILTER_PRESETS.find(f => f.id === 'warm');
    setActiveFilter(warmFilter);
  };

  // Select an effect
  const selectFireEffect = () => {
    const fireEffect = EFFECT_PRESETS.find(e => e.id === 'fire');
    setActiveEffect(fireEffect);
  };

  // Clear all
  const clearAll = () => {
    clearFilter();
    clearEffect();
  };

  return (
    <View>
      <Text>Active Filter: {activeFilter?.name || 'None'}</Text>
      <Text>Active Effect: {activeEffect?.name || 'None'}</Text>
      <Button title="Warm Filter" onPress={selectWarmFilter} />
      <Button title="Fire Effect" onPress={selectFireEffect} />
      <Button title="Clear All" onPress={clearAll} />
    </View>
  );
}
```

---

## API Reference

### `useCameraEffects()` Hook

Returns an object with the following properties and methods:

#### State Properties:

- **`activeFilter: FilterConfig | null`**  
  Currently active filter, or `null` if none selected

- **`activeEffect: EffectConfig | null`**  
  Currently active effect, or `null` if none selected

- **`filterIntensity: number`**  
  Current filter intensity (0-1)

#### Filter Methods:

- **`setActiveFilter(filter: FilterConfig | null): void`**  
  Set the active filter

- **`setFilterIntensity(intensity: number): void`**  
  Set filter intensity (0-1)

- **`clearFilter(): void`**  
  Clear the active filter

#### Effect Methods:

- **`setActiveEffect(effect: EffectConfig | null): void`**  
  Set the active effect

- **`clearEffect(): void`**  
  Clear the active effect

#### Utility Methods:

- **`clearAll(): void`**  
  Clear both filter and effect

- **`restoreState(filter, effect, intensity): void`**  
  Restore a previous state

- **`hasActiveFilter(): boolean`**  
  Check if a filter is active

- **`hasActiveEffect(): boolean`**  
  Check if an effect is active

- **`hasAnyActive(): boolean`**  
  Check if any filter or effect is active

---

## Filter Configuration

### FilterConfig Interface:

```typescript
interface FilterConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  temperature?: number; // -1 to 1 (cool to warm)
  tint?: number; // -1 to 1 (green to magenta)
  contrast?: number; // 0.5 to 2 (low to high)
  saturation?: number; // 0 to 2 (grayscale to vivid)
  brightness?: number; // -1 to 1 (dark to bright)
  overlayColor?: string; // RGBA color
  overlayOpacity?: number; // 0 to 1
  blendMode?: 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'color';
}
```

### Available Filters:

| ID | Name | Description |
|----|------|-------------|
| `warm` | Warm | Warmer skin tones |
| `cool` | Cool | Cooler blue tones |
| `vintage` | Vintage | Sepia retro look |
| `bright` | Bright | Brighten image |
| `dramatic` | Dramatic | High contrast |
| `vivid` | Vivid | Boost saturation |
| `soft` | Soft | Soft and dreamy |
| `noir` | Noir | Black & white |

---

## Effect Configuration

### EffectConfig Interface:

```typescript
interface EffectConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  particleCount: number;
  duration: number;
  colors: string[];
  emoji?: string;
  direction: 'up' | 'down' | 'float';
  maxOpacity: number;
}
```

### Available Effects:

| ID | Name | Description |
|----|------|-------------|
| `fire` | Roast Flames | Animated flame particles |
| `sparkles` | Sparkles | Magical sparkles |
| `hearts` | Hearts | Floating hearts |
| `stars` | Stars | Twinkling stars |
| `confetti` | Confetti | Celebration burst |
| `snow` | Snow | Falling snowflakes |
| `lightning` | Lightning | Electric bolts |

---

## Creating Custom Filters

### Example: Create a "Sunset" Filter

```typescript
const sunsetFilter: FilterConfig = {
  id: 'sunset',
  name: 'Sunset',
  icon: '🌇',
  description: 'Warm sunset glow',
  temperature: 0.2,
  saturation: 1.15,
  brightness: 0.05,
  overlayColor: 'rgba(255, 100, 50, 0.08)',
  overlayOpacity: 0.08,
  blendMode: 'overlay',
};

// Add to FILTER_PRESETS array
export const FILTER_PRESETS: FilterConfig[] = [
  // ... existing filters
  sunsetFilter,
];
```

---

## Creating Custom Effects

### Example: Create a "Bubbles" Effect

```typescript
const bubblesEffect: EffectConfig = {
  id: 'bubbles',
  name: 'Bubbles',
  icon: '🫧',
  description: 'Floating bubbles',
  particleCount: 15,
  duration: 3500,
  colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1'],
  emoji: '🫧',
  direction: 'up',
  maxOpacity: 0.6,
};

// Add to EFFECT_PRESETS array
export const EFFECT_PRESETS: EffectConfig[] = [
  // ... existing effects
  bubblesEffect,
];
```

---

## Rendering Filters and Effects

### In Your Camera Screen:

```typescript
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
import ImprovedVisualEffectsOverlay from '@/components/ImprovedVisualEffectsOverlay';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';

function CameraScreen() {
  const { activeFilter, activeEffect, filterIntensity } = useCameraEffects();

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Camera View */}
      <CameraView style={StyleSheet.absoluteFill} />

      {/* Filter Overlay */}
      <ImprovedCameraFilterOverlay 
        filter={activeFilter} 
        intensity={filterIntensity} 
      />

      {/* Effects Overlay */}
      <ImprovedVisualEffectsOverlay 
        effect={activeEffect} 
      />

      {/* Your UI */}
      <YourUI />
    </View>
  );
}
```

---

## Best Practices

### ✅ DO:

- Use `useCameraEffects()` hook to access filter/effect state
- Let the context manage persistence
- Use `ImprovedCameraFilterOverlay` and `ImprovedVisualEffectsOverlay` components
- Keep filter opacity low (0.04-0.10) for subtle effects
- Use blend modes to preserve camera detail
- Test on real devices for performance

### ❌ DON'T:

- Pass filters/effects as navigation params (use context instead)
- Manage filter/effect state locally in components
- Use high opacity overlays that hide the camera
- Block the camera view with effects
- Forget to render overlays in correct order (filter → effects → UI)

---

## Performance Tips

### GPU Optimization:

```typescript
// Always use native driver for animations
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ GPU-accelerated
}).start();
```

### Particle Count:

```typescript
// Keep particle count reasonable
particleCount: 20, // ✅ Good for mobile
particleCount: 100, // ❌ Too many, will lag
```

### Animation Duration:

```typescript
// Longer durations = fewer particles needed
duration: 3000, // ✅ Smooth, efficient
duration: 500, // ❌ Too fast, needs more particles
```

---

## Debugging

### Enable Debug Mode:

```typescript
// In pre-live-setup.tsx or broadcast.tsx
{__DEV__ && (
  <View style={styles.debugContainer}>
    <Text style={styles.debugText}>Filter: {activeFilter?.name || 'NONE'}</Text>
    <Text style={styles.debugText}>Effect: {activeEffect?.name || 'NONE'}</Text>
    <Text style={styles.debugText}>Intensity: {Math.round(filterIntensity * 100)}%</Text>
  </View>
)}
```

### Console Logging:

The context automatically logs all state changes:

```
🎨 [CameraEffects] Setting active filter: Warm
🎚️ [CameraEffects] Setting filter intensity: 0.75
✨ [CameraEffects] Setting active effect: Fire
🧹 [CameraEffects] Clearing filter
```

---

## Troubleshooting

### Filter Not Showing:

1. Check if `ImprovedCameraFilterOverlay` is rendered
2. Verify `activeFilter` is not `null`
3. Check filter intensity is > 0
4. Ensure overlay is rendered AFTER camera view

### Effect Not Animating:

1. Check if `ImprovedVisualEffectsOverlay` is rendered
2. Verify `activeEffect` is not `null`
3. Check console for animation errors
4. Ensure `useNativeDriver: true` is set

### State Not Persisting:

1. Verify `CameraEffectsProvider` is in `_layout.tsx`
2. Check provider is above all screens in hierarchy
3. Ensure you're using `useCameraEffects()` hook, not local state
4. Check for any `clearAll()` calls that might reset state

---

## Testing Checklist

### Unit Tests:

- [ ] Context provides correct initial state
- [ ] `setActiveFilter()` updates state
- [ ] `setActiveEffect()` updates state
- [ ] `clearFilter()` clears filter
- [ ] `clearEffect()` clears effect
- [ ] `hasActiveFilter()` returns correct boolean
- [ ] `hasActiveEffect()` returns correct boolean

### Integration Tests:

- [ ] Filter persists from pre-live to broadcaster
- [ ] Effect persists from pre-live to broadcaster
- [ ] Filter can be changed during live
- [ ] Effect can be changed during live
- [ ] State restores when re-entering broadcaster
- [ ] Practice mode preserves filters/effects

### UI Tests:

- [ ] Filter applies instantly when selected
- [ ] Effect starts animating immediately
- [ ] Intensity slider updates filter in real-time
- [ ] Camera feed remains visible with filter
- [ ] Effects don't block camera view
- [ ] Smooth transitions between filters

---

## Support

For questions or issues:

1. Check this guide first
2. Review `SNAPCHAT_STYLE_FILTERS_EFFECTS_COMPLETE.md`
3. Check console logs for errors
4. Test on real device (not simulator)
5. Verify all dependencies are installed

---

**Happy coding! 🎨✨**
