
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for react-native-webrtc
config.resolver.sourceExts.push('cjs');

// Ensure proper resolution of platform-specific files
// Priority: .native.tsx > .tsx > .native.ts > .ts
config.resolver.sourceExts = [
  'native.tsx',
  'native.ts',
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  'cjs',
];

// Ensure proper resolution of native modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Block native-only modules from being bundled on web
config.resolver.blockList = [
  // Block react-native-agora on web
  /node_modules\/react-native-agora\/.*/,
];

module.exports = config;
