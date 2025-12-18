
# Native AR Filter Engine Implementation

## Overview

This document describes the implementation of the native AR filter engine for the React Native live streaming app. The filter engine runs entirely on-device and processes camera frames BEFORE they are sent to the streaming encoder.

## Architecture

### iOS Implementation

**Technology Stack:**
- ARKit Face Tracking (ARFaceTrackingConfiguration)
- SceneKit for 3D rendering
- Metal for shader-based effects
- CVPixelBuffer output for streaming

**Key Components:**
1. `ARFilterEngine.swift` - Main filter engine
2. `ARFilterEngineModule.swift` - React Native bridge
3. `ARFilterEngineModule.m` - Objective-C bridge header

**Features:**
- Real-time face tracking with ARKit
- Face mesh, blend shapes, and head pose tracking
- 3D object rendering with SceneKit
- Shader-based effects with Metal
- Single face anchor/root node architecture
- Preloaded filters (no runtime allocation)
- Toggle filters via visibility/uniforms

### Android Implementation

**Technology Stack:**
- CameraX for camera input
- ML Kit Face Mesh for face tracking
- OpenGL ES for rendering
- Surface output for MediaCodec/WebRTC

**Key Components:**
1. `ARFilterEngine.kt` - Main filter engine
2. `ARFilterEngineModule.kt` - React Native bridge
3. `ARFilterEnginePackage.kt` - Package registration

**Features:**
- Real-time face detection with ML Kit
- Face landmarks and contours
- OpenGL ES rendering pipeline
- Surface output for streaming
- Single face anchor/root node architecture
- Preloaded filters (no runtime allocation)
- Toggle filters via visibility/uniforms

## Filter System

### Filter Interface

All filters implement a common interface:

**iOS (Swift):**
```swift
protocol FaceFilter {
    var id: String { get }
    var name: String { get }
    var isActive: Bool { get set }
    
    func activate()
    func deactivate()
    func update(faceAnchor: ARFaceAnchor)
    func preload()
}
```

**Android (Kotlin):**
```kotlin
interface FaceFilter {
    val id: String
    val name: String
    var isActive: Boolean
    
    fun activate()
    fun deactivate()
    fun update(face: Face)
    fun preload(context: Context)
    fun render(gl: GLES20)
}
```

### Available Filters

#### Face Effects
1. **Big Eyes** - Enlarges eyes based on blink detection
2. **Big Nose** - Enlarges nose
3. **Glasses** - 3D glasses attached to nose bridge
4. **Mask** - Face mask following face contours
5. **Skin Smoothing** - Bilateral filter for skin smoothing

#### Camera Filters
1. **Color Grading** - LUT-based color grading
2. **Glow** - Glow effect
3. **Warm Filter** - Warm color adjustment
4. **Cool Filter** - Cool color adjustment

### Filter Lifecycle

1. **Preload** - Called once at engine initialization
   - Load 3D models
   - Compile shaders
   - Allocate buffers
   - No runtime allocation

2. **Activate** - Called when filter is enabled
   - Show filter nodes
   - Enable shaders
   - No memory allocation

3. **Update** - Called every frame with face data
   - Update filter parameters
   - Adjust geometry
   - No blocking operations

4. **Deactivate** - Called when filter is disabled
   - Hide filter nodes
   - Disable shaders
   - No memory deallocation

5. **Render** - Called every frame (Android only)
   - Render filter effects
   - Apply shaders
   - No blocking operations

## React Native Integration

### TypeScript API

```typescript
import { ARFilterEngine } from '@/modules/ar-filter-engine';

// Start the engine
await ARFilterEngine.start();

// Enable a filter
await ARFilterEngine.enableFilter('big_eyes');

// Disable a filter
await ARFilterEngine.disableFilter('big_eyes');

// Set filter parameter
await ARFilterEngine.setFilterParameter('big_eyes', 'intensity', 1.5);

// Get available filters
const filters = await ARFilterEngine.getAvailableFilters();

// Stop the engine
await ARFilterEngine.stop();
```

### Event Listeners

```typescript
ARFilterEngine.addEventListener('onFilterEngineReady', (event) => {
  console.log('Filter engine ready');
});

ARFilterEngine.addEventListener('onFaceDetected', (event) => {
  console.log('Face detected');
});

ARFilterEngine.addEventListener('onFaceLost', (event) => {
  console.log('Face lost');
});
```

## Performance Considerations

### iOS
- ARKit runs at 60 FPS
- Face tracking on dedicated hardware
- Metal shaders run on GPU
- No blocking on render thread
- Preloaded filters minimize latency

### Android
- CameraX runs at 30-60 FPS
- ML Kit face detection on GPU/NPU
- OpenGL ES shaders run on GPU
- No blocking on render thread
- Preloaded filters minimize latency

## Integration with Streaming

The filter engine outputs processed frames that replace the raw camera feed:

**iOS:**
- Output: `CVPixelBuffer`
- Passed to: AVFoundation encoder → WebRTC → Cloudflare Stream

**Android:**
- Output: `Surface`
- Passed to: MediaCodec encoder → WebRTC → Cloudflare Stream

**Key Points:**
- Filters are applied BEFORE streaming
- No changes to streaming APIs
- No changes to Cloudflare Stream integration
- No server-side processing

## Limitations

1. **Device Support:**
   - iOS: Requires iPhone X or later (TrueDepth camera)
   - Android: Requires device with ML Kit support

2. **Performance:**
   - Multiple active filters may impact frame rate
   - Complex 3D models may cause lag
   - Shader-based effects are GPU-intensive

3. **Face Tracking:**
   - Requires good lighting
   - Single face tracking only
   - May lose tracking with extreme angles

## Future Enhancements

1. **Additional Filters:**
   - Makeup effects
   - Hair color
   - Background blur
   - Background replacement

2. **Advanced Features:**
   - Multi-face tracking
   - Body tracking
   - Hand tracking
   - Object tracking

3. **Performance:**
   - Adaptive quality based on device
   - Frame rate optimization
   - Battery optimization

## Testing

### iOS Testing
1. Build development build with native modules
2. Test on iPhone X or later
3. Verify face tracking accuracy
4. Test filter switching performance
5. Monitor frame rate and battery usage

### Android Testing
1. Build development build with native modules
2. Test on device with ML Kit support
3. Verify face detection accuracy
4. Test filter switching performance
5. Monitor frame rate and battery usage

## Troubleshooting

### iOS
- **Face tracking not working:** Check device support (iPhone X+)
- **Filters not rendering:** Check Metal support
- **Low frame rate:** Reduce active filters or complexity

### Android
- **Face detection not working:** Check ML Kit installation
- **Filters not rendering:** Check OpenGL ES support
- **Low frame rate:** Reduce active filters or complexity

## Conclusion

The native AR filter engine provides a robust, performant solution for real-time face effects and camera filters in the live streaming app. It runs entirely on-device, requires no server-side processing, and integrates seamlessly with the existing streaming infrastructure.

The modular filter system allows for easy addition of new filters, and the preloading architecture ensures smooth performance without frame drops during live streaming.
