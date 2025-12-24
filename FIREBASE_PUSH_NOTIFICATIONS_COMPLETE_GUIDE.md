
# Firebase Push Notifications - Complete Setup Guide

## Overview
This guide provides exact steps to set up Firebase Cloud Messaging (FCM) for push notifications in your Expo app with package name `com.hasselite.roastlive`.

---

## Prerequisites
- Expo project with `expo-notifications` installed (✅ Already installed)
- Android package name: `com.hasselite.roastlive`
- Expo dev client setup

---

## Part 1: Firebase Console Setup

### Step 1: Create/Select Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### Step 2: Add Android App
1. In Firebase Console, click "Add app" → Android icon
2. Enter package name: `com.hasselite.roastlive`
3. (Optional) Enter app nickname: "Roast Live"
4. (Optional) Enter SHA-1 certificate (not required for FCM)
5. Click "Register app"

### Step 3: Download google-services.json
1. Download the `google-services.json` file
2. Place it in your project root directory (same level as `package.json`)
3. Verify the file contains your package name

**File structure should look like:**
```
/your-project/
  ├── google-services.json  ← Place here
  ├── package.json
  ├── app.json
  └── ...
```

---

## Part 2: App Configuration

### Step 1: Update app.json

Add/update the following in your `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.hasselite.roastlive",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Roast Live needs access to your camera to let you stream and use AR filters.",
          "microphonePermission": "Roast Live needs access to your microphone so others can hear you during the roast.",
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#A40028",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

### Step 2: Install Required Dependencies

The following dependencies are already installed:
- ✅ `expo-notifications@^0.32.14`
- ✅ `expo-device@^8.0.10`
- ✅ `expo-constants@~18.0.8`

**No additional npm install needed!**

---

## Part 3: Implementation

### Step 1: Use the Push Notifications Hook

The `usePushNotifications` hook is already created at `src/hooks/usePushNotifications.ts`.

**Example usage:**

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useEffect } from 'react';

function App() {
  const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      console.log('📱 Push token:', expoPushToken);
      // TODO: Send token to your server
      // await sendTokenToServer(expoPushToken);
    }
  }, [expoPushToken]);

  useEffect(() => {
    if (notification) {
      console.log('📬 Notification received:', notification);
      // Handle notification here
    }
  }, [notification]);

  return (
    // Your app content
  );
}
```

### Step 2: Send Token to Your Server

Once you have the `expoPushToken`, send it to your backend:

```typescript
async function sendTokenToServer(token: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return;

  await supabase
    .from('user_push_tokens')
    .upsert({
      user_id: session.user.id,
      push_token: token,
      platform: 'android',
    }, {
      onConflict: 'user_id',
    });
}
```

---

## Part 4: Rebuild Dev Client

**CRITICAL:** You MUST rebuild your dev client after adding Firebase configuration.

### Option 1: Local Build (Recommended for Testing)

```bash
# Clean previous builds
npx expo prebuild --clean

# Run Android dev client
npx expo run:android
```

### Option 2: EAS Build (For Distribution)

```bash
# Build development client
eas build -p android --profile development

# After build completes, install on device
# Download and install the APK from EAS
```

---

## Part 5: Testing

### Test 1: Verify Token Generation

1. Run your app on a physical Android device
2. Check console logs for:
   ```
   ✅ [Push Notifications] Token retrieved: ExponentPushToken[...]
   ✅ [Push Notifications] Android channel configured
   ```
3. If you see these logs, setup is successful!

### Test 2: Send Test Notification

Use Expo's push notification tool:

1. Go to https://expo.dev/notifications
2. Enter your `ExponentPushToken[...]`
3. Enter a title and message
4. Click "Send a Notification"
5. Verify notification appears on device

### Test 3: Verify Firebase Integration

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select your app
5. Send notification
6. Verify it appears on device

---

## Part 6: Troubleshooting

### Error: "Default FirebaseApp is not initialized"

**Cause:** `google-services.json` not found or not configured correctly.

**Solution:**
1. Verify `google-services.json` is in project root
2. Verify `googleServicesFile` path in `app.json` is correct
3. Rebuild dev client: `npx expo run:android`

### Error: "Failed to get push token"

**Cause:** Running on emulator or permissions not granted.

**Solution:**
1. Use a physical Android device (emulators don't support push notifications)
2. Grant notification permissions when prompted
3. Check that `POST_NOTIFICATIONS` permission is in `app.json`

### Error: "No project ID found"

**Cause:** Missing EAS project ID in `app.json`.

**Solution:**
Add to `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### Notifications Not Appearing

**Checklist:**
- [ ] Running on physical device (not emulator)
- [ ] Notification permissions granted
- [ ] `google-services.json` in project root
- [ ] Dev client rebuilt after adding Firebase
- [ ] Token successfully retrieved (check logs)
- [ ] Android notification channel configured

---

## Part 7: Production Deployment

### Step 1: Update EAS Build Profile

In `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### Step 2: Build Production APK

```bash
eas build -p android --profile production
```

### Step 3: Test Production Build

1. Download APK from EAS
2. Install on device
3. Verify push notifications work
4. Test all notification types

---

## Part 8: Server-Side Integration

### Sending Notifications from Your Server

Use Expo's Push Notification API:

```typescript
// Example: Send notification from Supabase Edge Function
import { serve } from 'std/server';

serve(async (req) => {
  const { expoPushToken, title, body } = await req.json();

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Summary

✅ **Completed Steps:**
1. Created `usePushNotifications` hook
2. Documented Firebase Console setup
3. Provided exact `app.json` configuration
4. Documented rebuild commands
5. Created testing guide
6. Provided troubleshooting steps

🔄 **Next Steps:**
1. Complete Firebase Console setup
2. Download and place `google-services.json`
3. Update `app.json` with configuration
4. Rebuild dev client: `npx expo run:android`
5. Test notification permissions and token generation
6. Send test notification
7. Integrate with your backend

---

## Support Resources

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

## Quick Reference Commands

```bash
# Clean and rebuild dev client
npx expo prebuild --clean && npx expo run:android

# Build development client with EAS
eas build -p android --profile development

# Build production APK
eas build -p android --profile production

# Start dev server
npm start

# Clear cache and start
npm start -- --clear
```
