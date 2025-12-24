
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for platform-specific extensions
config.resolver.sourceExts = [
  'native.tsx',
  'native.ts',
  'web.tsx',
  'web.ts',
  'ios.tsx',
  'ios.ts',
  'android.tsx',
  'android.ts',
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  'cjs',
];

// Ensure proper resolution of native modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
