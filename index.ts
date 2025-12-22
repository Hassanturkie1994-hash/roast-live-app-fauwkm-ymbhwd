
// CRITICAL: Load polyfills FIRST before anything else
import 'react-native-url-polyfill/auto';

// Immediately after auto-import, add explicit guards to ensure polyfill is applied
import { URL as PolyfillURL, URLSearchParams as PolyfillURLSearchParams } from 'react-native-url-polyfill';

if (typeof global.URL === 'undefined') {
  global.URL = PolyfillURL;
}
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = PolyfillURLSearchParams;
}

// Log polyfill readiness BEFORE loading Expo Router
console.log('[Polyfill] URL ready:', !!global.URL, 'URLSearchParams ready:', !!global.URLSearchParams);

// Now load Expo Router entry
import 'expo-router/entry';

// Suppress WebRTC warning in Expo Go
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Defensive check: ensure args is an array and has elements
    if (!args || !Array.isArray(args) || args.length === 0) {
      console.log('Warning called with empty args');
      return;
    }
    
    // Safely check if first argument is a string
    const firstArg = args[0];
    
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
    try {
      originalWarn(...args);
    } catch (error) {
      // Fallback if originalWarn fails
      console.log('Warning:', args);
    }
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Defensive check: ensure args is an array and has elements
    if (!args || !Array.isArray(args) || args.length === 0) {
      console.log('Error called with empty args');
      return;
    }
    
    // Safely check if first argument is a string
    const firstArg = args[0];
    
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
    try {
      originalError(...args);
    } catch (error) {
      // Fallback if originalError fails
      console.log('Error:', args);
    }
  };
}

console.log('✅ App entry point loaded with polyfills');
