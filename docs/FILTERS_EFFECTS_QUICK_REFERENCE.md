
# Filters & Effects Quick Reference

## 🎨 Color Filters

### How They Work
- **Subtle color overlays** with very low opacity (0.06-0.15)
- **Blend modes** for proper color grading
- **Always visible** camera feed

### Adding a New Filter

```typescript
// In components/FiltersPanel.tsx
const FILTERS = [
  // Add your filter here
  { 
    id: 'sunset', 
    name: 'Sunset', 
    icon: '🌇', 
    color: '#FF6B35', 
    description: 'Warm sunset glow' 
  },
];

// In components/CameraFilterOverlay.tsx
case 'sunset':
  return {
    backgroundColor: 'rgba(255, 107, 53, 0.08)', // Very low opacity!
    mixBlendMode: 'overlay' as const,
  };
```

### Blend Modes Reference

| Blend Mode | Effect | Use Case |
|------------|--------|----------|
| `overlay` | Preserves highlights/shadows | General color grading |
| `soft-light` | Gentle color shift | Vintage/sepia effects |
| `screen` | Brightens image | Bright/lighten filters |
| `color` | Desaturates | Black & white effects |
| `multiply` | Darkens image | Dramatic/noir filters |

---

## ✨ Visual Effects

### How They Work
- **Particle systems** with multiple animated elements
- **GPU-accelerated** animations
- **Layered on top** of camera feed

### Adding a New Effect

```typescript
// In components/EffectsPanel.tsx
const EFFECTS = [
  // Add your effect here
  { 
    id: 'snow', 
    name: 'Snow', 
    icon: '❄️', 
    description: 'Falling snowflakes' 
  },
];

// In components/VisualEffectsOverlay.tsx
const getParticleCount = () => {
  switch (effect) {
    case 'snow':
      return 30; // Number of particles
    // ...
  }
};

const getParticleColor = () => {
  switch (effect) {
    case 'snow':
      return ['#FFFFFF', '#E0F7FF', '#B0E0E6']; // Particle colors
    // ...
  }
};

const getParticleShape = () => {
  switch (effect) {
    case 'snow':
      return '❄️'; // Emoji or use particleCircle for shapes
    // ...
  }
};
```

---

## 🔧 Configuration

### Filter Intensity
- **Range**: 0.0 to 1.0
- **Default**: 1.0
- **Adjustable**: Via slider in FiltersPanel

### Particle Count
- **Fire**: 20 particles
- **Sparkles**: 25 particles
- **Hearts**: 15 particles
- **Confetti**: 30 particles
- **Lightning**: 8 particles

### Animation Duration
- **Fire**: 2500ms
- **Sparkles**: 3000ms
- **Hearts**: 3500ms
- **Confetti**: 2000ms
- **Lightning**: 800ms

---

## 🎯 Best Practices

### Filters
✅ Use opacity between 0.05 and 0.15
✅ Test on both light and dark backgrounds
✅ Ensure face remains visible
✅ Use appropriate blend modes

❌ Don't use opacity > 0.2
❌ Don't use solid colors
❌ Don't block the camera feed

### Effects
✅ Use GPU-accelerated animations
✅ Spawn particles continuously
✅ Layer on top of camera
✅ Keep particle count reasonable (< 50)

❌ Don't block the camera view
❌ Don't use static overlays
❌ Don't impact UI thread

---

## 🐛 Debugging

### Filter Not Visible
- Check opacity value (should be 0.05-0.15)
- Verify blend mode is set correctly
- Ensure filter is not 'none'

### Effect Not Animating
- Check `animationLoopRef.current` is true
- Verify `useNativeDriver: true` is set
- Ensure particles are created correctly

### Performance Issues
- Reduce particle count
- Increase animation duration
- Check for memory leaks in cleanup

---

## 📱 Platform Differences

### iOS
- Blend modes work consistently
- Smooth animations at 60 FPS
- Face tracking available (future)

### Android
- Some blend modes may differ slightly
- Test on multiple devices
- Performance varies by device

### Web
- Limited blend mode support
- May need fallbacks
- Test in multiple browsers

---

## 🚀 Quick Commands

### Test Filter
```typescript
// In pre-live-setup.tsx or broadcast.tsx
setSelectedFilter('warm');
setFilterIntensity(0.8);
```

### Test Effect
```typescript
// In pre-live-setup.tsx or broadcast.tsx
setSelectedEffect('fire');
```

### Clear All
```typescript
setSelectedFilter(null);
setSelectedEffect(null);
```

---

## 📊 Performance Metrics

### Target FPS
- **Filters**: No impact (overlay only)
- **Effects**: 60 FPS with < 30 particles
- **Combined**: 60 FPS with optimizations

### Memory Usage
- **Filters**: < 1 MB
- **Effects**: < 5 MB (depends on particle count)
- **Combined**: < 6 MB

---

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Subtle color grading filters
- ✅ Particle-based effects
- ✅ Real-time adjustments

### Phase 2 (Planned)
- ⏳ LUT-based color grading
- ⏳ Custom filter creation
- ⏳ Advanced particle systems

### Phase 3 (Future)
- 🔮 Face tracking AR filters
- 🔮 3D effects
- 🔮 Real-time frame processing

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review `FILTERS_AND_EFFECTS_IMPLEMENTATION.md`
3. Test on physical device (not simulator)
4. Check console logs for errors

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
