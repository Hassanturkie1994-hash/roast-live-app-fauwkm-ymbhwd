
import 'expo-router/entry';

// Suppress WebRTC warning in Expo Go
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Safely check if first argument is a string
    const firstArg = args && args.length > 0 ? args[0] : null;
    
    // Suppress specific warnings
    if (
      firstArg &&
      typeof firstArg === 'string' &&
      (firstArg.includes('WebRTC native module not found') ||
       firstArg.includes('Android Push notifications') ||
       firstArg.includes('expo-notifications was removed from Expo Go'))
    ) {
      return;
    }
    
    // Call original with safe arguments
    if (args && args.length > 0) {
      originalWarn(...args);
    }
  };

  const originalError = console.error;
  console.error = (...args) => {
    // Safely check if first argument is a string
    const firstArg = args && args.length > 0 ? args[0] : null;
    
    // Suppress specific errors
    if (
      firstArg &&
      typeof firstArg === 'string' &&
      (firstArg.includes('WebRTC native module not found') ||
       firstArg.includes('Android Push notifications') ||
       firstArg.includes('expo-notifications was removed from Expo Go'))
    ) {
      return;
    }
    
    // Call original with safe arguments
    if (args && args.length > 0) {
      originalError(...args);
    }
  };
}
