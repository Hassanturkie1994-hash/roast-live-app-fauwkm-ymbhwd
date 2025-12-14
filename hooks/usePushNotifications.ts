
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { pushNotificationService } from '@/app/services/pushNotificationService';

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
    let mounted = true;

    if (!userId || registrationAttempted.current) return;

    registrationAttempted.current = true;

    registerForPushNotifications(userId).catch(error => {
      console.error('Failed to register for push notifications:', error);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (mounted) {
        console.log('📲 Notification received:', notification);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (mounted) {
        console.log('📲 Notification response:', response);
        
        const data = response.notification.request.content.data;
        
        if (data.route) {
          handleDeepLink(data);
        }
      }
    });

    return () => {
      mounted = false;
      
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          console.log('Error removing notification listener:', error);
        }
        notificationListener.current = null;
      }
      
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          console.log('Error removing response listener:', error);
        }
        responseListener.current = null;
      }
      
      registrationAttempted.current = false;
    };
  }, [userId]);

  const registerForPushNotifications = async (userId: string) => {
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo && Platform.OS === 'android') {
        console.log('⚠️ Push notifications are not supported in Expo Go on Android (SDK 53+)');
        console.log('Please use a development build for push notification testing');
        return;
      }

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

      let token: string;
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          console.warn('⚠️ No projectId found in app.json. Please add it under extra.eas.projectId');
          console.warn('You can find your project ID at https://expo.dev/');
          console.warn('Falling back to device push token...');
          
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
        } else {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          token = tokenData.data;
        }
      } catch (error) {
        console.error('Error getting Expo push token:', error);
        
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
          console.log('✅ Using device push token as fallback');
        } catch (deviceError) {
          console.error('Error getting device push token:', deviceError);
          return;
        }
      }

      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

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
    console.log('Handling deep link:', data);
  };
}
