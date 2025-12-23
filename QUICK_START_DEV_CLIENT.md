
# 🚀 Quick Start: Dev Client Build

## One-Command Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Login to EAS
eas login

# 4. Build dev client
npm run eas:dev:android  # Android
npm run eas:dev:ios      # iOS

# 5. Install on device
# Download from EAS build page

# 6. Start Metro
npm start

# 7. Scan QR code in dev client app
```

---

## 🎯 Key Points

### ✅ What's Configured

- **Expo Dev Client:** Installed and ready
- **EAS Build:** Development profile configured
- **Agora RTC:** Native module support enabled
- **Permissions:** Camera + Microphone configured
- **New Architecture:** Disabled for compatibility
- **Legacy Modules:** Excluded from autolinking

### 🎭 Expo Go vs Dev Client

| Feature | Expo Go | Dev Client |
|---------|---------|------------|
| UI Testing | ✅ | ✅ |
| Navigation | ✅ | ✅ |
| Auth | ✅ | ✅ |
| Database | ✅ | ✅ |
| **Agora Streaming** | ❌ Mock | ✅ Real |
| **Camera Filters** | ❌ | ✅ |
| **AR Effects** | ❌ | ✅ |

### 🔧 Build Commands

```bash
# Android
npm run eas:dev:android
eas build -p android --profile development

# iOS
npm run eas:dev:ios
eas build -p ios --profile development

# Clear cache (if build fails)
eas build -p android --profile development --clear-cache
```

### 🐛 Common Issues

**"Agora SDK not available"**
→ You're in Expo Go. Use dev client.

**Build fails with legacy module error**
→ Run with `--clear-cache` flag

**White screen on launch**
→ Check Metro logs and `.env` file

---

## 📱 Testing Checklist

After building dev client:

- [ ] App boots without crashes
- [ ] Can navigate to all screens
- [ ] Can login/register
- [ ] Can start a livestream
- [ ] Video preview appears
- [ ] Audio works
- [ ] Can invite guest (1v1 battle)
- [ ] Split-screen works
- [ ] Can end stream
- [ ] Recording saved to S3

---

## 🆘 Need Help?

1. Check `EAS_DEV_CLIENT_SETUP_GUIDE.md`
2. Review Metro bundler logs
3. Check EAS build logs
4. Search GitHub issues

---

**Build Status:** Ready ✅
**Last Updated:** 2024-01-20
