
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs and .mjs extensions
config.resolver.sourceExts.push('cjs', 'mjs');

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
  'mjs',
];

// Ensure proper resolution of native modules
// Add 'module' to support ES modules from packages like @supabase/supabase-js
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

// Block native-only modules from being bundled on web
config.resolver.blockList = [
  // Block react-native-agora on web
  /node_modules\/react-native-agora\/.*/,
];

module.exports = config;
