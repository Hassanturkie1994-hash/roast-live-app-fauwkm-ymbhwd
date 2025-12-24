
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * usePushNotifications Hook
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Handles push notification setup for Expo + Firebase Cloud Messaging (FCM).
 * 
 * Features:
 * - Requests notification permissions
 * - Retrieves Expo push token
 * - Sets up notification channel for Android
 * - Handles notification listeners
 * 
 * Prerequisites:
 * 1. Firebase project created
 * 2. google-services.json downloaded and placed in project root
 * 3. app.json configured with googleServicesFile path
 * 4. Dev client rebuilt with: npx expo run:android
 * 
 * Usage:
 * ```tsx
 * const { expoPushToken, notification } = usePushNotifications();
 * 
 * useEffect(() => {
 *   if (expoPushToken) {
 *     // Send token to your server
 *     console.log('Push token:', expoPushToken);
 *   }
 * }, [expoPushToken]);
 * ```
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 * Returns Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.warn('⚠️ [Push Notifications] Must use physical device for push notifications');
    return undefined;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('📱 [Push Notifications] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Handle permission denial
    if (finalStatus !== 'granted') {
      console.error('❌ [Push Notifications] Permission not granted');
      return undefined;
    }

    // Get Expo push token
    console.log('📱 [Push Notifications] Getting Expo push token...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('❌ [Push Notifications] No project ID found in app config');
      return undefined;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log('✅ [Push Notifications] Token retrieved:', token);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#A40028',
        sound: 'notification.wav',
      });
      console.log('✅ [Push Notifications] Android channel configured');
    }

    return token;
  } catch (error) {
    console.error('❌ [Push Notifications] Error registering:', error);
    return undefined;
  }
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token))
      .catch((error) => console.error('❌ [Push Notifications] Registration error:', error));

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 [Push Notifications] Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification responses (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 [Push Notifications] Notification tapped:', response);
      // Handle notification tap here (e.g., navigate to specific screen)
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Firebase Setup Steps
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Firebase Console Setup:
 *    - Go to https://console.firebase.google.com/
 *    - Create project or select existing
 *    - Add Android app with package: com.hasselite.roastlive
 *    - Download google-services.json
 *    - Place in project root
 * 
 * 2. app.json Configuration:
 *    {
 *      "expo": {
 *        "android": {
 *          "package": "com.hasselite.roastlive",
 *          "googleServicesFile": "./google-services.json"
 *        },
 *        "plugins": [
 *          [
 *            "expo-notifications",
 *            {
 *              "icon": "./assets/notification-icon.png",
 *              "color": "#A40028",
 *              "sounds": ["./assets/sounds/notification.wav"]
 *            }
 *          ],
 *          "@react-native-firebase/app"
 *        ]
 *      }
 *    }
 * 
 * 3. Install Dependencies:
 *    npm install @react-native-firebase/app @react-native-firebase/messaging
 * 
 * 4. Rebuild Dev Client:
 *    npx expo run:android
 *    # OR
 *    eas build -p android --profile development
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
