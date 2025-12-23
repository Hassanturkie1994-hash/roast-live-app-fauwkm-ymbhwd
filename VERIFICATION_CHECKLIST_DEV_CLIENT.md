
# ✅ Dev Client Build Verification Checklist

Use this checklist to verify your dev client setup is correct before building.

---

## 📋 Pre-Build Verification

### 1. Dependencies

- [ ] `expo-dev-client` is in `package.json`
- [ ] `react-native-agora` is in `package.json`
- [ ] `react-native-nodemediaclient` is NOT in `package.json`
- [ ] `react-native-webrtc` is NOT in `package.json`
- [ ] All dependencies installed (`node_modules` exists)

**Check:**
```bash
grep "expo-dev-client" package.json
grep "react-native-agora" package.json
grep "react-native-nodemediaclient" package.json  # Should return nothing
```

### 2. Configuration Files

- [ ] `app.config.js` exists
- [ ] `newArchEnabled: false` is set
- [ ] `excludedPackages` includes legacy modules
- [ ] `eas.json` has development profile
- [ ] `developmentClient: true` in eas.json

**Check:**
```bash
cat app.config.js | grep "newArchEnabled"
cat eas.json | grep "developmentClient"
```

### 3. Environment Variables

- [ ] `.env.example` exists
- [ ] `.env` file created (not committed)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `AGORA_APP_ID` set (for edge functions)
- [ ] `AGORA_APP_CERTIFICATE` set (for edge functions)

**Check:**
```bash
test -f .env && echo "✅ .env exists" || echo "❌ .env missing"
grep "EXPO_PUBLIC_SUPABASE_URL" .env
```

### 4. Permissions

- [ ] iOS camera permission in `app.json`
- [ ] iOS microphone permission in `app.json`
- [ ] Android CAMERA permission in `app.json`
- [ ] Android RECORD_AUDIO permission in `app.json`

**Check:**
```bash
cat app.json | grep "NSCameraUsageDescription"
cat app.json | grep "NSMicrophoneUsageDescription"
cat app.json | grep "CAMERA"
cat app.json | grep "RECORD_AUDIO"
```

### 5. Expo Go Guards

- [ ] `hooks/useAgoraEngine.native.ts` has Expo Go detection
- [ ] `components/SafeAgoraView.tsx` has Expo Go guards
- [ ] Mock engine created for Expo Go
- [ ] Placeholder views for Expo Go

**Check:**
```bash
grep "isExpoGo" hooks/useAgoraEngine.native.ts
grep "isExpoGo" components/SafeAgoraView.tsx
```

---

## 🏗️ Build Verification

### 1. EAS Login

- [ ] Logged into EAS CLI
- [ ] Correct Expo account

**Check:**
```bash
eas whoami
```

### 2. Build Configuration

- [ ] Project ID in `app.json` matches EAS
- [ ] Bundle identifier set for iOS
- [ ] Package name set for Android

**Check:**
```bash
cat app.json | grep "projectId"
cat app.json | grep "bundleIdentifier"
cat app.json | grep "package"
```

### 3. Build Command

**Android:**
```bash
eas build --profile development --platform android
```

**Expected output:**
- ✅ Dependencies installed
- ✅ Native modules linked
- ✅ Gradle build succeeds
- ✅ APK generated

**iOS:**
```bash
eas build --profile development --platform ios
```

**Expected output:**
- ✅ Dependencies installed
- ✅ Pods installed
- ✅ Xcode build succeeds
- ✅ IPA generated

---

## 📱 Runtime Verification

### 1. Expo Go (Mock Mode)

- [ ] App boots without crashes
- [ ] No white screen
- [ ] Navigation works
- [ ] Mock streaming UI appears
- [ ] Message: "Build a dev client to see real video"
- [ ] No native module errors in logs

**Test:**
```bash
npm start
# Scan QR code in Expo Go
# Navigate to livestream screen
# Verify mock UI appears
```

### 2. Dev Client (Real Mode)

- [ ] App boots without crashes
- [ ] No white screen
- [ ] Navigation works
- [ ] Can start livestream
- [ ] Real video preview appears
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Agora SDK initialized
- [ ] Channel joined successfully

**Test:**
```bash
npm start --dev-client
# Scan QR code in dev client app
# Navigate to livestream screen
# Start streaming
# Verify real video appears
```

---

## 🔍 Log Verification

### Metro Bundler Logs

**Expected in Expo Go:**
```
🎭 [useAgoraEngine] EXPO GO DETECTED
🎭 [useAgoraEngine] Initializing mock engine
🎭 [SafeAgoraView] EXPO GO DETECTED - Rendering placeholder
```

**Expected in Dev Client:**
```
🚀 [useAgoraEngine] Dev Client/Standalone detected
🚀 [useAgoraEngine] Initializing REAL Agora engine...
✅ [useAgoraEngine] Engine initialized
✅ [useAgoraEngine] Joined channel successfully
```

### Device Logs

**Android:**
```bash
adb logcat | grep -i agora
```

**iOS:**
```bash
xcrun simctl spawn booted log stream | grep -i agora
```

---

## 🎯 Acceptance Criteria

Your setup is verified when:

### Build Phase
- [x] `eas build --profile development` succeeds
- [x] No errors about legacy modules
- [x] APK/IPA generated successfully
- [x] Build completes in < 30 minutes

### Runtime Phase (Expo Go)
- [x] App boots without crashes
- [x] Mock streaming UI appears
- [x] Clear message about dev client requirement
- [x] No native module errors

### Runtime Phase (Dev Client)
- [x] App boots without crashes
- [x] Real video preview appears
- [x] Agora SDK initializes
- [x] Can join channel
- [x] Can stream video/audio
- [x] Can invite guest (1v1)
- [x] Split-screen works

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "react-native-nodemediaclient not found"
**Fix:** Remove from `package.json`, build with `--clear-cache`

**Error:** "New Architecture not supported"
**Fix:** Verify `newArchEnabled: false` in `app.config.js`

**Error:** "Gradle build failed"
**Fix:** Check Android SDK version, clear cache

### Runtime Crashes

**Error:** "White screen on launch"
**Fix:** Check Metro logs, verify `.env` file

**Error:** "Agora SDK not available"
**Fix:** Ensure running in dev client, not Expo Go

**Error:** "Permission denied"
**Fix:** Grant camera/microphone permissions in device settings

---

## 📊 Verification Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Dependencies | ⬜ | Check package.json |
| Configuration | ⬜ | Check app.config.js |
| Environment | ⬜ | Check .env |
| Permissions | ⬜ | Check app.json |
| Expo Go Guards | ⬜ | Check hooks/components |
| EAS Build | ⬜ | Run build command |
| Expo Go Runtime | ⬜ | Test in Expo Go |
| Dev Client Runtime | ⬜ | Test in dev client |

**Legend:**
- ⬜ Not checked
- ✅ Verified
- ❌ Failed

---

**Last Updated:** 2024-01-20
**Version:** 1.0.0
