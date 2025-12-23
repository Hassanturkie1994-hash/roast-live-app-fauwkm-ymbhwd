
# EAS Dev Client Setup Guide

## 🎯 Overview

This guide walks you through building and running the Roast Live app with EAS Dev Client, which includes native modules like Agora RTC for livestreaming.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **EAS CLI** (`npm install -g eas-cli`)
- **Expo account** (sign up at https://expo.dev)
- **Physical device** (iOS or Android) for testing

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- Supabase URL and Anon Key
- Agora App ID and Certificate
- AWS S3 credentials (for recording storage)
- Stripe keys (for payments)
- Cloudflare R2 credentials (for media storage)

### 3. Login to EAS

```bash
eas login
```

### 4. Build Dev Client

**For Android:**
```bash
npm run eas:dev:android
# or
eas build --profile development --platform android
```

**For iOS:**
```bash
npm run eas:dev:ios
# or
eas build --profile development --platform ios
```

**Note:** iOS builds require an Apple Developer account ($99/year).

### 5. Install the Dev Client

Once the build completes:

**Android:**
- Download the APK from the EAS build page
- Install it on your device
- Or scan the QR code with your camera

**iOS:**
- Register your device UDID with Apple
- Download the IPA from the EAS build page
- Install via TestFlight or direct installation

### 6. Start Metro Bundler

```bash
npm start
# or
expo start --dev-client
```

### 7. Connect to Dev Client

- Open the dev client app on your device
- Scan the QR code from Metro bundler
- The app will load with full native module support

---

## 🎭 Expo Go vs Dev Client

### Expo Go (Limited Functionality)

**What works:**
- ✅ UI navigation
- ✅ Basic screens
- ✅ Authentication
- ✅ Database queries
- ✅ Mock livestreaming UI

**What doesn't work:**
- ❌ Real Agora streaming
- ❌ Native camera filters
- ❌ AR effects
- ❌ Native modules

**When to use:**
- Quick UI testing
- Layout verification
- Non-streaming features

### Dev Client (Full Functionality)

**What works:**
- ✅ Everything in Expo Go
- ✅ Real Agora streaming
- ✅ Native camera access
- ✅ AR effects
- ✅ All native modules

**When to use:**
- Testing livestreaming
- Full feature testing
- Production-like environment

---

## 🔧 Configuration Details

### New Architecture

The React Native New Architecture is **disabled** for maximum compatibility with third-party native modules:

```javascript
// app.config.js
newArchEnabled: false
```

**TODO:** Re-enable after verifying Agora compatibility in a future release.

### Autolinking Exclusions

Legacy modules are excluded from autolinking to prevent build conflicts:

```javascript
// app.config.js
excludedPackages: [
  'react-native-nodemediaclient', // Legacy RTMP (replaced by Agora)
  'react-native-webrtc',          // Legacy WebRTC (replaced by Agora)
]
```

### Permissions

The following permissions are configured for iOS and Android:

**iOS (Info.plist):**
- `NSCameraUsageDescription`: Camera access for streaming
- `NSMicrophoneUsageDescription`: Microphone access for audio
- `NSPhotoLibraryUsageDescription`: Photo library access

**Android (Manifest):**
- `CAMERA`: Camera access
- `RECORD_AUDIO`: Microphone access
- `INTERNET`: Network access
- `MODIFY_AUDIO_SETTINGS`: Audio configuration
- `ACCESS_NETWORK_STATE`: Network state monitoring

---

## 🐛 Troubleshooting

### Build Fails with "react-native-nodemediaclient not found"

**Solution:**
1. Ensure `react-native-nodemediaclient` is NOT in `package.json`
2. Clear EAS build cache:
   ```bash
   eas build --profile development --platform android --clear-cache
   ```

### "Agora SDK not available" Error

**Cause:** Running in Expo Go instead of Dev Client

**Solution:**
1. Build and install the dev client (see Quick Start)
2. Run the app in the dev client, not Expo Go

### White Screen on Launch

**Possible causes:**
1. Native module initialization error
2. Missing environment variables
3. Supabase connection issue

**Solution:**
1. Check Metro bundler logs for errors
2. Verify `.env` file exists and has correct values
3. Check Supabase connection:
   ```bash
   curl https://your-project.supabase.co/rest/v1/
   ```

### Build Stuck at "Installing dependencies"

**Solution:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Try building again

### iOS Build Fails with Code Signing Error

**Solution:**
1. Ensure you have an active Apple Developer account
2. Register your device UDID in Apple Developer Portal
3. Configure provisioning profile in EAS:
   ```bash
   eas device:create
   ```

### Android Build Fails with Gradle Error

**Solution:**
1. Check `eas.json` configuration
2. Ensure Android SDK is up to date
3. Try building with `--clear-cache` flag

---

## 📱 Testing Livestreaming

### In Dev Client (Real Streaming)

1. Build and install dev client
2. Launch app in dev client
3. Navigate to "Go Live" screen
4. Grant camera and microphone permissions
5. Start streaming
6. Verify video preview appears
7. Test with another device as viewer

### In Expo Go (Mock Streaming)

1. Launch app in Expo Go
2. Navigate to "Go Live" screen
3. See mock UI with placeholder video
4. Message displays: "Build a dev client to see real video"
5. All other features work normally

---

## 🔄 Development Workflow

### Recommended Workflow

1. **UI Development:** Use Expo Go for fast iteration
2. **Feature Testing:** Use Dev Client for full functionality
3. **Production Testing:** Use Preview/Production builds

### Hot Reload

Dev Client supports hot reload just like Expo Go:
- Save files to see changes instantly
- No need to rebuild for code changes
- Rebuild only when adding new native modules

### Debugging

**Metro Bundler Logs:**
```bash
npm start
```

**Device Logs:**

**Android:**
```bash
adb logcat
```

**iOS:**
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "RoastLive"'
```

---

## 📚 Additional Resources

- [Expo Dev Client Documentation](https://docs.expo.dev/development/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Agora RTC Documentation](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review Metro bundler logs
3. Check EAS build logs
4. Search existing issues on GitHub
5. Ask in Expo Discord: https://chat.expo.dev

---

## ✅ Acceptance Criteria

Your setup is complete when:

1. ✅ `eas build --profile development` succeeds
2. ✅ Dev client installs on your device
3. ✅ App boots in dev client without crashes
4. ✅ Livestreaming works with real video
5. ✅ Expo Go boots without crashes (with mock streaming)
6. ✅ Clear message shown in Expo Go about dev client requirement

---

## 🎉 Next Steps

After successful setup:

1. **Test Agora Streaming:** Start a live stream and verify video/audio
2. **Test 1v1 Battles:** Invite a guest and test split-screen
3. **Test Cloud Recording:** Verify recordings are saved to S3
4. **Test on Multiple Devices:** Ensure cross-device compatibility
5. **Performance Testing:** Monitor CPU, memory, and network usage

---

**Last Updated:** 2024-01-20
**Version:** 1.0.0
