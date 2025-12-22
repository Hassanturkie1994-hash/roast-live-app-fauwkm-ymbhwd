
# Agora Quick Fix Guide

## "requireNativeComponent" Error on Web

### Problem
```
Uncaught Error
(0, _reactNativeWebDistIndex.requireNativeComponent) is not a function
```

### Root Cause
The web bundler is trying to import `react-native-agora`, which is a native-only module.

### Solution

#### 1. Use Platform-Specific Files

**Always create both versions:**
- `ComponentName.native.tsx` - For iOS/Android (uses Agora)
- `ComponentName.tsx` - For Web (fallback)

**Example:**
```typescript
// VideoGrid.native.tsx (iOS/Android)
import { RtcSurfaceView } from 'react-native-agora';

export function VideoGrid() {
  return <RtcSurfaceView ... />;
}

// VideoGrid.tsx (Web)
export function VideoGrid() {
  return <Text>Not supported on web</Text>;
}
```

#### 2. Update Metro Config

**File: `metro.config.js`**
```javascript
config.resolver.sourceExts = [
  'native.tsx',
  'native.ts',
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
];

config.resolver.blockList = [
  /node_modules\/react-native-agora\/.*/,
];
```

#### 3. Update Babel Config

**File: `babel.config.js`**
```javascript
extensions: [
  ".native.tsx",
  ".native.ts",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".json",
],
```

#### 4. Clear Cache and Rebuild

```bash
# Clear Metro cache
npx expo start --clear

# Or clear all caches
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

---

## Files That Need Platform-Specific Versions

### ✅ Already Fixed
- `hooks/useAgoraEngine.native.ts` / `hooks/useAgoraEngine.ts`
- `app/(tabs)/broadcast.native.tsx` / `app/(tabs)/broadcast.tsx`
- `components/VideoGrid.native.tsx` / `components/VideoGrid.tsx`

### ⚠️ Check These Files
If you see the error, check if these files import `react-native-agora`:
- Any component that uses `RtcSurfaceView`
- Any component that uses `createAgoraRtcEngine`
- Any hook that imports from `react-native-agora`

---

## Quick Checklist

- [ ] All files that import `react-native-agora` have `.native.tsx` extension
- [ ] All `.native.tsx` files have a `.tsx` fallback
- [ ] Metro config includes `blockList` for `react-native-agora`
- [ ] Babel config has correct extension order
- [ ] Cache cleared and app restarted

---

## Testing

### Test on Web
```bash
npx expo start --web
```

**Expected**: No `requireNativeComponent` errors

### Test on iOS
```bash
npx expo start --ios
```

**Expected**: Agora video streaming works

### Test on Android
```bash
npx expo start --android
```

**Expected**: Agora video streaming works

---

## Still Having Issues?

1. **Check Import Statements**
   ```typescript
   // ❌ Wrong - Direct import
   import { RtcSurfaceView } from 'react-native-agora';
   
   // ✅ Correct - Import from hook
   import { RtcSurfaceView } from '@/hooks/useAgoraEngine';
   ```

2. **Check File Extensions**
   ```
   ❌ Wrong:
   VideoGrid.tsx (imports react-native-agora)
   
   ✅ Correct:
   VideoGrid.native.tsx (imports react-native-agora)
   VideoGrid.tsx (fallback, no Agora imports)
   ```

3. **Check Metro Logs**
   ```bash
   # Look for these errors:
   - "Unable to resolve module react-native-agora"
   - "requireNativeComponent is not a function"
   ```

4. **Verify Platform Detection**
   ```typescript
   import { Platform } from 'react-native';
   
   console.log('Platform:', Platform.OS); // Should be 'web', 'ios', or 'android'
   ```

---

## Prevention

### When Creating New Components

1. **Ask**: Does this component use Agora?
2. **If YES**: Create `.native.tsx` and `.tsx` versions
3. **If NO**: Single `.tsx` file is fine

### When Importing Agora

```typescript
// ❌ Never do this in a .tsx file
import { RtcSurfaceView } from 'react-native-agora';

// ✅ Always use platform-specific files
// In .native.tsx:
import { RtcSurfaceView } from 'react-native-agora';

// In .tsx:
// Don't import Agora at all
```

---

## Summary

The key to avoiding this error is **platform-specific file extensions**:
- `.native.tsx` for iOS/Android (can import Agora)
- `.tsx` for Web (cannot import Agora)

Metro will automatically choose the correct file based on the platform.
