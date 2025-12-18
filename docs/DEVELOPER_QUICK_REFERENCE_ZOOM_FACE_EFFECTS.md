
# Developer Quick Reference: Zoom & Face Effects

## 🔍 Camera Zoom

### Usage in Components

```typescript
import CameraZoomControl, { ZoomLevel } from '@/components/CameraZoomControl';

// State
const [cameraZoom, setCameraZoom] = useState<ZoomLevel>(0.5);
const [deviceZoom, setDeviceZoom] = useState<number>(0);

// Calculate device zoom from UI zoom
const calculateDeviceZoom = (uiZoom: ZoomLevel): number => {
  const range = maxZoom - minZoom;
  const midpoint = minZoom + (range / 2);
  
  switch (uiZoom) {
    case 0.5: return minZoom;
    case 1: return midpoint;
    case 2: return Math.min(maxZoom, midpoint * 2);
  }
};

// Handle zoom change
const handleZoomChange = (zoom: ZoomLevel) => {
  setCameraZoom(zoom);
  const newDeviceZoom = calculateDeviceZoom(zoom);
  setDeviceZoom(newDeviceZoom);
};

// Render
<CameraView zoom={deviceZoom} />
<CameraZoomControl
  currentZoom={cameraZoom}
  onZoomChange={handleZoomChange}
  minZoom={0}
  maxZoom={1}
/>
```

### Key Points
- Always map UI zoom to device zoom
- Use `deviceZoom` for CameraView, not `cameraZoom`
- Default to 0.5x for natural wide-angle view
- Query device capabilities if available

---

## 🤖 AI Face Effects

### Usage in Components

```typescript
import AIFaceFilterSystem from '@/components/AIFaceFilterSystem';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';

// In component
const { activeEffect, effectIntensity, setActiveEffect } = useAIFaceEffects();

// Render
<CameraView>
  <AIFaceFilterSystem
    filter={activeEffect}
    intensity={effectIntensity}
    onFaceDetected={(count) => console.log('Faces:', count)}
  />
</CameraView>
```

### Available Effects

```typescript
import { AI_FACE_FILTERS } from '@/components/AIFaceEffectsPanel';

// Effect IDs
'big_eyes'      // 👁️ Enlarge eyes
'big_nose'      // 👃 Enlarge nose
'slim_face'     // 🎯 Narrow face
'smooth_skin'   // ✨ Soften skin
'funny_face'    // 🤪 Distort face
'beauty'        // 💄 Enhance features
```

### Context API

```typescript
// Get context
const {
  activeEffect,        // Current effect or null
  effectIntensity,     // 0 to 1
  setActiveEffect,     // Set effect
  setEffectIntensity,  // Set intensity
  clearEffect,         // Remove effect
  hasActiveEffect,     // Boolean check
} = useAIFaceEffects();

// Set effect
setActiveEffect(AI_FACE_FILTERS[0]); // Big Eyes

// Clear effect
clearEffect();

// Check if active
if (hasActiveEffect()) {
  // Effect is active
}
```

---

## 🎨 Face Detection

### Real-Time Face Detection

```typescript
import RealTimeFaceDetection, { DetectedFace } from '@/components/RealTimeFaceDetection';

// Handle detected faces
const handleFacesDetected = (faces: DetectedFace[]) => {
  faces.forEach(face => {
    console.log('Face bounds:', face.topLeft, face.bottomRight);
    console.log('Landmarks:', face.landmarks);
    console.log('Confidence:', face.probability);
  });
};

// Render
<RealTimeFaceDetection
  enabled={true}
  onFacesDetected={handleFacesDetected}
/>
```

### Face Data Structure

```typescript
interface DetectedFace {
  topLeft: [number, number];      // [x, y]
  bottomRight: [number, number];  // [x, y]
  landmarks: {
    leftEye: [number, number];
    rightEye: [number, number];
    nose: [number, number];
    mouth: [number, number];
    leftEar: [number, number];
    rightEar: [number, number];
  };
  probability: number;  // 0 to 1
}
```

---

## 🔧 Integration Checklist

### Adding Zoom to New Screen

- [ ] Import `CameraZoomControl` and `ZoomLevel`
- [ ] Add state for `cameraZoom` and `deviceZoom`
- [ ] Implement `calculateDeviceZoom` function
- [ ] Add `handleZoomChange` handler
- [ ] Pass `deviceZoom` to `CameraView`
- [ ] Render `CameraZoomControl` component
- [ ] Test all three zoom levels

### Adding Face Effects to New Screen

- [ ] Import `AIFaceFilterSystem`
- [ ] Import `useAIFaceEffects` hook
- [ ] Get context values
- [ ] Render `AIFaceFilterSystem` inside `CameraView`
- [ ] Add `AIFaceEffectsPanel` for effect selection
- [ ] Test each effect
- [ ] Verify face tracking works

---

## 🐛 Common Issues

### Zoom Not Working
```typescript
// ❌ Wrong - using UI zoom directly
<CameraView zoom={cameraZoom} />

// ✅ Correct - using device zoom
<CameraView zoom={deviceZoom} />
```

### Face Effects Not Appearing
```typescript
// ❌ Wrong - not inside CameraView
<CameraView />
<AIFaceFilterSystem filter={activeEffect} />

// ✅ Correct - inside CameraView
<CameraView>
  <AIFaceFilterSystem filter={activeEffect} />
</CameraView>
```

### Context Not Available
```typescript
// ❌ Wrong - using outside provider
const { activeEffect } = useAIFaceEffects(); // Error!

// ✅ Correct - wrap in provider
<AIFaceEffectsProvider>
  <YourComponent />
</AIFaceEffectsProvider>
```

---

## 📊 Performance Tips

### Zoom
- Use native camera zoom (no performance impact)
- Avoid frequent zoom changes (can cause jitter)
- Cache device zoom calculations

### Face Effects
- Limit to one effect at a time
- Disable when not needed (`enabled={false}`)
- Use GPU acceleration (automatic with WebGL)
- Monitor FPS in development mode

---

## 🧪 Testing

### Manual Testing

```typescript
// Test zoom
console.log('UI Zoom:', cameraZoom);
console.log('Device Zoom:', deviceZoom);

// Test face detection
const handleFacesDetected = (faces: DetectedFace[]) => {
  console.log('Detected faces:', faces.length);
  if (faces.length > 0) {
    console.log('First face:', faces[0]);
  }
};

// Test effect application
useEffect(() => {
  console.log('Active effect:', activeEffect?.name || 'None');
  console.log('Effect intensity:', effectIntensity);
}, [activeEffect, effectIntensity]);
```

### Debug Mode

```typescript
// Enable debug overlays
{__DEV__ && (
  <View style={styles.debugOverlay}>
    <Text>Zoom: {cameraZoom}x (Device: {deviceZoom.toFixed(2)})</Text>
    <Text>Effect: {activeEffect?.name || 'None'}</Text>
    <Text>Faces: {faceCount}</Text>
  </View>
)}
```

---

## 📚 API Reference

### CameraZoomControl Props

```typescript
interface CameraZoomControlProps {
  currentZoom: ZoomLevel;           // Current UI zoom level
  onZoomChange: (zoom: ZoomLevel) => void;  // Zoom change handler
  position?: 'top' | 'bottom';      // Position on screen
  minZoom?: number;                 // Device min zoom
  maxZoom?: number;                 // Device max zoom
}
```

### AIFaceFilterSystem Props

```typescript
interface AIFaceFilterSystemProps {
  filter: AIFaceFilter | null;      // Active filter
  intensity: number;                 // 0 to 1
  onFaceDetected?: (count: number) => void;  // Face count callback
}
```

### RealTimeFaceDetection Props

```typescript
interface RealTimeFaceDetectionProps {
  onFacesDetected: (faces: DetectedFace[]) => void;  // Detection callback
  enabled: boolean;                  // Enable/disable detection
}
```

---

## 🎯 Best Practices

### Zoom
1. Always default to 0.5x (wide angle)
2. Map UI zoom to device zoom
3. Cache device zoom calculations
4. Provide visual feedback for zoom changes

### Face Effects
1. Load TensorFlow.js once at app start
2. Disable detection when not needed
3. Handle face detection errors gracefully
4. Provide loading states for model initialization
5. Test on multiple devices (iOS and Android)

### Performance
1. Monitor FPS in development
2. Use GPU acceleration (WebGL)
3. Limit concurrent effects
4. Profile battery usage
5. Optimize for mobile devices

---

## 🔗 Related Files

### Components
- `components/CameraZoomControl.tsx`
- `components/AIFaceFilterSystem.tsx`
- `components/RealTimeFaceDetection.tsx`
- `components/AIFaceEffectsPanel.tsx`

### Contexts
- `contexts/AIFaceEffectsContext.tsx`
- `contexts/CameraEffectsContext.tsx`

### Screens
- `app/(tabs)/pre-live-setup.tsx`
- `app/(tabs)/broadcast.tsx`

### Documentation
- `docs/ZOOM_AND_FACE_EFFECTS_FIX_COMPLETE.md`
- `docs/CAMERA_ZOOM_AND_FACE_EFFECTS_USER_GUIDE.md`

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained By:** Natively AI Assistant
