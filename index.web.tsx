
// Web-specific entry point
// This file is used ONLY for web builds and must not import any native modules

// Load polyfills first
import 'react-native-url-polyfill/auto';

// For web, we need to manually register the app instead of using expo-router/entry
// which includes native-only modules
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Create a root component that uses expo-router's ExpoRoot
function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Register the root component
registerRootComponent(App);

console.log('✅ Web entry point loaded (native-free)');
