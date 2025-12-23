
# 🚀 Build Commands Reference

Quick reference for building and running the Roast Live app.

---

## 📦 Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials
```

---

## 🏗️ EAS Build Commands

### Development Build (Dev Client)

**Android:**
```bash
npm run eas:dev:android
# or
eas build --profile development --platform android
```

**iOS:**
```bash
npm run eas:dev:ios
# or
eas build --profile development --platform ios
```

**Both Platforms:**
```bash
eas build --profile development --platform all
```

**With Cache Clear:**
```bash
eas build --profile development --platform android --clear-cache
```

---

### Preview Build

**Android:**
```bash
npm run eas:preview:android
# or
eas build --profile preview --platform android
```

**iOS:**
```bash
npm run eas:preview:ios
# or
eas build --profile preview --platform ios
```

---

### Production Build

**Android:**
```bash
npm run eas:prod:android
# or
eas build --profile production --platform android
```

**iOS:**
```bash
npm run eas:prod:ios
# or
eas build --profile production --platform ios
```

---

## 🏃 Run Commands

### Expo Go (Mock Streaming)

```bash
npm start
# or
expo start
```

Then scan QR code in Expo Go app.

---

### Dev Client (Real Streaming)

```bash
npm start --dev-client
# or
expo start --dev-client
```

Then scan QR code in dev client app.

---

### Platform Specific

**Android:**
```bash
npm run android
# or
expo start --android
```

**iOS:**
```bash
npm run ios
# or
expo start --ios
```

**Web:**
```bash
npm run web
# or
expo start --web
```

---

## 🔧 Development Commands

### Clear Cache

```bash
npm start --clear
# or
expo start --clear
```

### Tunnel Mode

```bash
npm run dev
# or
expo start --clear --tunnel
```

### Prebuild (Generate Native Projects)

**Android:**
```bash
npm run prebuild:android
# or
npx expo prebuild -p android --clean
```

**iOS:**
```bash
npm run prebuild:ios
# or
npx expo prebuild -p ios --clean
```

**Both:**
```bash
npm run prebuild
# or
npx expo prebuild --clean
```

---

## 🐛 Debugging Commands

### View Logs

**Metro Bundler:**
```bash
npm start
# Logs appear in terminal
```

**Android Device:**
```bash
adb logcat
# or filter for app
adb logcat | grep -i roast
```

**iOS Device:**
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "RoastLive"'
```

---

### Check Build Status

```bash
eas build:list
```

### View Build Details

```bash
eas build:view [BUILD_ID]
```

---

## 🧹 Cleanup Commands

### Clear Node Modules

```bash
rm -rf node_modules
npm install
```

### Clear Metro Cache

```bash
npm start -- --reset-cache
```

### Clear EAS Build Cache

```bash
eas build --profile development --platform android --clear-cache
```

### Clear All Caches

```bash
rm -rf node_modules
npm cache clean --force
npm install
npm start -- --reset-cache
```

---

## 📱 Device Management

### Register iOS Device

```bash
eas device:create
```

### List Registered Devices

```bash
eas device:list
```

---

## 🔐 Authentication

### Login to EAS

```bash
eas login
```

### Check Current User

```bash
eas whoami
```

### Logout

```bash
eas logout
```

---

## 📊 Project Info

### View Project Details

```bash
eas project:info
```

### View Build Configuration

```bash
cat eas.json
```

### View App Configuration

```bash
cat app.json
# or
cat app.config.js
```

---

## 🎯 Common Workflows

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env

# 3. Login to EAS
eas login

# 4. Build dev client
npm run eas:dev:android

# 5. Install on device
# Download from EAS

# 6. Start Metro
npm start --dev-client
```

---

### Daily Development

```bash
# Start Metro bundler
npm start --dev-client

# Make code changes
# Hot reload happens automatically

# If issues occur:
npm start --clear
```

---

### Testing in Expo Go

```bash
# Start Metro
npm start

# Scan QR in Expo Go
# Test UI and non-native features
```

---

### Rebuild After Native Changes

```bash
# If you add/remove native modules:
npm run eas:dev:android

# Install new build on device
# Start Metro
npm start --dev-client
```

---

## 🆘 Troubleshooting Commands

### Build Fails

```bash
# Clear cache and rebuild
eas build --profile development --platform android --clear-cache
```

### Metro Won't Start

```bash
# Clear Metro cache
npm start -- --reset-cache
```

### Dependencies Issues

```bash
# Reinstall dependencies
rm -rf node_modules
npm cache clean --force
npm install
```

### Expo Go Crashes

```bash
# Check if native modules are being imported
# Review logs for native module errors
# Verify Expo Go guards are in place
```

---

## 📚 Help Commands

### EAS Help

```bash
eas --help
eas build --help
eas device --help
```

### Expo Help

```bash
expo --help
expo start --help
```

---

**Last Updated:** 2024-01-20
**Version:** 1.0.0
