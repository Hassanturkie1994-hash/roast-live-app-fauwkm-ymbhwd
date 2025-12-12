
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId: string | null) {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const registrationAttempted = useRef(false);

  useEffect(() => {
    if (!userId || registrationAttempted.current) return;

    registrationAttempted.current = true;

    // Register for push notifications
    registerForPushNotifications(userId).catch(error => {
      console.error('Failed to register for push notifications:', error);
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📲 Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle deep linking based on notification payload
      if (data.route) {
        handleDeepLink(data);
      }
    });

    return () => {
      // Use .remove() method instead of removeNotificationSubscription
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
      registrationAttempted.current = false;
    };
  }, [userId]);

  const registerForPushNotifications = async (userId: string) => {
    try {
      // Check if running in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo && Platform.OS === 'android') {
        console.log('⚠️ Push notifications are not supported in Expo Go on Android (SDK 53+)');
        console.log('Please use a development build for push notification testing');
        return;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get push token
      let token: string;
      
      try {
        // Get projectId from app.json extra.eas.projectId
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          console.warn('⚠️ No projectId found in app.json. Please add it under extra.eas.projectId');
          console.warn('You can find your project ID at https://expo.dev/');
          console.warn('Falling back to device push token...');
          
          // Fallback to device push token
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
        } else {
          // Use Expo push token with projectId
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          token = tokenData.data;
        }
      } catch (error) {
        console.error('Error getting Expo push token:', error);
        
        // Fallback to device push token if Expo token fails
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
          console.log('✅ Using device push token as fallback');
        } catch (deviceError) {
          console.error('Error getting device push token:', deviceError);
          return;
        }
      }

      // Determine platform
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      // Register token with backend
      const result = await pushNotificationService.registerDeviceToken(
        userId,
        token,
        platform
      );

      if (result.success) {
        console.log('✅ Push notification token registered successfully');
      } else {
        console.error('❌ Failed to register push notification token:', result.error);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleDeepLink = (data: any) => {
    // Handle deep linking based on route
    console.log('Handling deep link:', data);
    
    // This would typically use navigation to navigate to the appropriate screen
    // Example: navigation.navigate(data.route, { appealId: data.appealId });
  };
}
