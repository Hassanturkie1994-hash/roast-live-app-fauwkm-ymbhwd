
import 'expo-router/entry';

// Suppress WebRTC warning in Expo Go
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Suppress specific warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('WebRTC native module not found') ||
       args[0].includes('Android Push notifications') ||
       args[0].includes('expo-notifications was removed from Expo Go'))
    ) {
      return;
    }
    originalWarn(...args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    // Suppress specific errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('WebRTC native module not found') ||
       args[0].includes('Android Push notifications') ||
       args[0].includes('expo-notifications was removed from Expo Go'))
    ) {
      return;
    }
    originalError(...args);
  };
}
