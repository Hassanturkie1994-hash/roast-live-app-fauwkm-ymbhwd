
// Web-specific entry point
// This bypasses the native runtime that causes issues on web

// Load polyfills first
import 'react-native-url-polyfill/auto';

// Import Expo Router for web without the native runtime
import 'expo-router/entry-classic';

console.log('✅ Web entry point loaded');
