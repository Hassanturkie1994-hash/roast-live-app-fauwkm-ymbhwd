
# Native AR Filter Engine - Developer Guide

## Quick Start

### Prerequisites

1. **iOS Development:**
   - Xcode 14+
   - iOS 14+ deployment target
   - iPhone X or later for testing
   - CocoaPods installed

2. **Android Development:**
   - Android Studio
   - Android SDK 24+
   - Device with ML Kit support
   - Gradle 7+

### Installation

The native modules are already implemented in the `native/` directory. To use them:

1. **iOS:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Android:**
   - Native modules are automatically linked via `ARFilterEnginePackage`
   - No additional setup required

3. **Build Development Build:**
   ```bash
   # iOS
   npx expo run:ios

   # Android
   npx expo run:android
   ```

## Using the Filter Engine

### Basic Usage

```typescript
import { ARFilterEngine, FACE_FILTERS, CAMERA_FILTERS } from '@/modules/ar-filter-engine';

// In your component
useEffect(() => {
  const initFilterEngine = async () => {
    try {
      // Start the engine
      await ARFilterEngine.start();
      
      // Get available filters
      const filters = await ARFilterEngine.getAvailableFilters();
      console.log('Available filters:', filters);
      
      // Enable a face filter
      await ARFilterEngine.enableFilter(FACE_FILTERS.BIG_EYES);
      
      // Enable a camera filter
      await ARFilterEngine.enableFilter(CAMERA_FILTERS.WARM);
    } catch (error) {
      console.error('Error initializing filter engine:', error);
    }
  };

  initFilterEngine();

  return () => {
    // Cleanup
    ARFilterEngine.stop();
  };
}, []);
```

### Switching Filters

```typescript
const switchFilter = async (filterId: string) => {
  try {
    // Disable all active filters
    await ARFilterEngine.disableFilter(FACE_FILTERS.BIG_EYES);
    await ARFilterEngine.disableFilter(FACE_FILTERS.BIG_NOSE);
    
    // Enable new filter
    await ARFilterEngine.enableFilter(filterId);
  } catch (error) {
    console.error('Error switching filter:', error);
  }
};
```

### Adjusting Filter Parameters

```typescript
const adjustFilterIntensity = async (filterId: string, intensity: number) => {
  try {
    await ARFilterEngine.setFilterParameter(filterId, 'intensity', intensity);
  } catch (error) {
    console.error('Error adjusting filter:', error);
  }
};
```

### Event Handling

```typescript
useEffect(() => {
  // Listen for face detection
  const handleFaceDetected = (event: FilterEngineEvent) => {
    console.log('Face detected:', event.data);
  };

  const handleFaceLost = (event: FilterEngineEvent) => {
    console.log('Face lost');
  };

  ARFilterEngine.addEventListener('onFaceDetected', handleFaceDetected);
  ARFilterEngine.addEventListener('onFaceLost', handleFaceLost);

  return () => {
    ARFilterEngine.removeEventListener('onFaceDetected', handleFaceDetected);
    ARFilterEngine.removeEventListener('onFaceLost', handleFaceLost);
  };
}, []);
```

## Creating Custom Filters

### iOS Custom Filter

```swift
class CustomFilter: NSObject, FaceFilter {
    var id: String = "custom_filter"
    var name: String = "Custom Filter"
    var isActive: Bool = false
    
    // Custom properties
    private var intensity: Float = 1.0
    private var customNode: SCNNode?
    
    func preload() {
        // Load resources
        // Create geometry
        // Compile shaders
        print("✅ [CustomFilter] Preloaded")
    }
    
    func activate() {
        isActive = true
        customNode?.isHidden = false
    }
    
    func deactivate() {
        isActive = false
        customNode?.isHidden = true
    }
    
    func update(faceAnchor: ARFaceAnchor) {
        guard isActive else { return }
        
        // Update filter based on face data
        // Access blend shapes: faceAnchor.blendShapes
        // Access geometry: faceAnchor.geometry
        // Access transform: faceAnchor.transform
    }
}
```

### Android Custom Filter

```kotlin
class CustomFilter : FaceFilter {
    override val id = "custom_filter"
    override val name = "Custom Filter"
    override var isActive = false
    
    // Custom properties
    private var intensity = 1.0f
    
    override fun preload(context: Context) {
        // Load resources
        // Create geometry
        // Compile shaders
        Log.d("CustomFilter", "✅ Preloaded")
    }
    
    override fun activate() {
        isActive = true
    }
    
    override fun deactivate() {
        isActive = false
    }
    
    override fun update(face: Face) {
        if (!isActive) return
        
        // Update filter based on face data
        // Access landmarks: face.getLandmark(FaceLandmark.LEFT_EYE)
        // Access contours: face.getContour(FaceContour.FACE)
        // Access bounding box: face.boundingBox
    }
    
    override fun render(gl: GLES20) {
        if (!isActive) return
        
        // Render filter effect
        // Use OpenGL ES to draw
    }
}
```

## Performance Optimization

### Best Practices

1. **Preload Everything:**
   - Load all resources in `preload()`
   - Never allocate memory in `update()` or `render()`
   - Use object pools for temporary objects

2. **Minimize Active Filters:**
   - Only enable filters that are visible
   - Disable filters when not in use
   - Limit simultaneous active filters

3. **Optimize Shaders:**
   - Use simple shaders for real-time effects
   - Avoid complex calculations in fragment shaders
   - Use texture lookups instead of calculations

4. **Face Tracking:**
   - Use appropriate face detection mode
   - Reduce face detection frequency if needed
   - Cache face data when possible

### Performance Monitoring

```typescript
// Monitor frame rate
let frameCount = 0;
let lastTime = Date.now();

const monitorPerformance = () => {
  frameCount++;
  const now = Date.now();
  const elapsed = now - lastTime;
  
  if (elapsed >= 1000) {
    const fps = (frameCount / elapsed) * 1000;
    console.log(`FPS: ${fps.toFixed(2)}`);
    frameCount = 0;
    lastTime = now;
  }
};
```

## Debugging

### iOS Debugging

1. **Enable Metal Frame Capture:**
   - Xcode → Debug → Capture GPU Frame
   - Analyze shader performance
   - Check texture usage

2. **ARKit Debugging:**
   - Enable ARKit debug options
   - Visualize face mesh
   - Check tracking quality

3. **Logging:**
   ```swift
   print("🎨 [Filter] Debug message")
   ```

### Android Debugging

1. **Enable OpenGL ES Debugging:**
   - Android Studio → GPU Debugger
   - Capture frames
   - Analyze draw calls

2. **ML Kit Debugging:**
   - Enable ML Kit logging
   - Visualize face landmarks
   - Check detection confidence

3. **Logging:**
   ```kotlin
   Log.d("Filter", "🎨 Debug message")
   ```

## Common Issues

### iOS

**Issue:** Face tracking not working
- **Solution:** Check device support (iPhone X+), verify ARKit permissions

**Issue:** Filters not rendering
- **Solution:** Check Metal support, verify shader compilation

**Issue:** Low frame rate
- **Solution:** Reduce active filters, optimize shaders, check device temperature

### Android

**Issue:** Face detection not working
- **Solution:** Check ML Kit installation, verify camera permissions

**Issue:** Filters not rendering
- **Solution:** Check OpenGL ES support, verify shader compilation

**Issue:** Low frame rate
- **Solution:** Reduce active filters, optimize shaders, check device performance

## Testing

### Unit Tests

```typescript
describe('ARFilterEngine', () => {
  it('should start successfully', async () => {
    await ARFilterEngine.start();
    expect(ARFilterEngine.isEngineStarted()).toBe(true);
  });

  it('should enable filter', async () => {
    await ARFilterEngine.enableFilter(FACE_FILTERS.BIG_EYES);
    // Verify filter is active
  });

  it('should disable filter', async () => {
    await ARFilterEngine.disableFilter(FACE_FILTERS.BIG_EYES);
    // Verify filter is inactive
  });
});
```

### Integration Tests

1. **Test Filter Switching:**
   - Enable multiple filters
   - Switch between filters
   - Verify no frame drops

2. **Test Parameter Adjustment:**
   - Adjust filter parameters
   - Verify visual changes
   - Check performance impact

3. **Test Face Tracking:**
   - Test with different lighting
   - Test with different angles
   - Test with occlusions

## Deployment

### iOS Deployment

1. **Update Info.plist:**
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Camera access is required for AR filters</string>
   <key>NSFaceIDUsageDescription</key>
   <string>Face tracking is required for AR filters</string>
   ```

2. **Build for Production:**
   ```bash
   npx expo build:ios --release-channel production
   ```

### Android Deployment

1. **Update AndroidManifest.xml:**
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera" />
   <uses-feature android:name="android.hardware.camera.autofocus" />
   ```

2. **Build for Production:**
   ```bash
   npx expo build:android --release-channel production
   ```

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review the implementation documentation
3. Check device compatibility
4. Verify native module linking

## Conclusion

The native AR filter engine provides a powerful, performant solution for real-time face effects and camera filters. Follow this guide to integrate, customize, and optimize the filter engine for your live streaming app.
