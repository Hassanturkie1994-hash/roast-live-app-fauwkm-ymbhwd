
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<any>();

  useEffect(() => {
    // Register for push notifications
    console.log('Registering for push notifications');
  }, []);

  return {
    expoPushToken,
    notification
  };
}
