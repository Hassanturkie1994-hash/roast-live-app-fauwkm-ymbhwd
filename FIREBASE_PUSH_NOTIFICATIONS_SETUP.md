
# Firebase Push Notifications Setup Guide

## Problem
You're getting the error:
```
"Default FirebaseApp is not initialized ... Make sure to complete the guide ... fcm-credentials"
```

## Solution

### Step 1: Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Under "Your apps", select your Android app
5. Download `google-services.json`
6. Place it in the root of your project: `./google-services.json`

### Step 2: Update app.json

The `app.json` has already been updated with the following configuration:

```json
{
  "expo": {
    "android": {
      "package": "com.hasselite.roastlive",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

### Step 3: Rebuild Dev Client

**CRITICAL:** After adding `google-services.json`, you MUST rebuild your dev client:

```bash
# For Android
eas build --platform android --profile development

# For iOS (if needed)
eas build --platform ios --profile development
```

**Why rebuild is required:**
- Firebase SDK needs to be compiled with your `google-services.json`
- Native modules need to be linked
- FCM credentials need to be embedded in the app

### Step 4: Install and Run

After the build completes:

1. Download and install the new dev client APK/IPA
2. Run your development server:
   ```bash
   expo start --dev-client
   ```

### Step 5: Test Push Notifications

Use the `usePushNotifications` hook in your app:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { 
    expoPushToken, 
    permissionStatus, 
    error,
    requestPermissions,
    openSettings 
  } = usePushNotifications();

  if (permissionStatus === 'loading') {
    return <Text>Requesting permissions...</Text>;
  }

  if (permissionStatus === 'denied') {
    return (
      <View>
        <Text>Push notifications are disabled</Text>
        <Button title="Open Settings" onPress={openSettings} />
      </View>
    );
  }

  if (permissionStatus === 'granted') {
    return <Text>Push token: {expoPushToken}</Text>;
  }

  return null;
}
```

## iOS Setup (APNs)

For iOS push notifications, you also need to:

1. Create an APNs certificate in Apple Developer Portal
2. Upload the certificate to Firebase Console
3. Add the following to `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

## Testing Push Notifications

### Using Expo Push Notification Tool

1. Get your Expo push token from the app
2. Go to https://expo.dev/notifications
3. Enter your push token
4. Send a test notification

### Using Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and body
4. Select your app
5. Send test message

## Troubleshooting

### Error: "Default FirebaseApp is not initialized"
- **Solution:** Make sure `google-services.json` is in the project root
- **Solution:** Rebuild dev client with `eas build`

### Error: "FCM token not available"
- **Solution:** Check that Google Play Services is installed on the device
- **Solution:** Verify that the device has internet connection

### Permissions not granted
- **Solution:** Use the `openSettings()` function to guide users to enable permissions
- **Solution:** Check that permissions are declared in `app.json`

## Required Permissions (Android)

Already configured in `app.json`:
```json
{
  "android": {
    "permissions": [
      "INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  }
}
```

## Environment Variables

No environment variables are needed for basic push notifications. The Firebase configuration is read from `google-services.json`.

## Next Steps

1. Download `google-services.json` from Firebase Console
2. Place it in project root
3. Run `eas build --platform android --profile development`
4. Install the new dev client
5. Test push notifications with the `usePushNotifications` hook
