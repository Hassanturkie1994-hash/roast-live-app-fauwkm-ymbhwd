
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of platform-specific files
// Priority order for web: .web.tsx > .web.ts > .tsx > .ts
// Priority order for native: .native.tsx > .native.ts > .ios.tsx > .android.tsx > .tsx > .ts
config.resolver.sourceExts = [
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
  'native.tsx',
  'native.ts',
  'ios.tsx',
  'android.tsx',
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

// Platform-specific configuration
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Transformer configuration
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Enable package exports for better module resolution
config.resolver.unstable_enablePackageExports = true;

// Ensure consistent module IDs across builds
config.serializer.createModuleIdFactory = () => {
  let nextId = 0;
  const map = {};
  return (modulePath) => {
    if (map[modulePath]) {
      return map[modulePath];
    }
    const id = nextId++;
    map[modulePath] = id;
    return id;
  };
};

// Web-specific configuration to avoid native-only modules
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // For web platform, block native-only modules
  if (platform === 'web') {
    // Block react-native internal modules
    if (
      moduleName.includes('react-native/Libraries/ReactPrivate') ||
      moduleName.includes('ReactNativePrivateInitializeCore')
    ) {
      return {
        type: 'empty',
      };
    }
    
    // Block @expo/metro-runtime native imports
    if (moduleName.includes('@expo/metro-runtime') && moduleName.includes('.native')) {
      return {
        type: 'empty',
      };
    }

    // Block react-native/Libraries/Core/InitializeCore on web
    if (moduleName.includes('react-native/Libraries/Core/InitializeCore')) {
      return {
        type: 'empty',
      };
    }

    // Block react-native internal renderer modules
    if (
      moduleName.includes('react-native/Libraries/Renderer') ||
      moduleName.includes('ReactNativeRenderer')
    ) {
      return {
        type: 'empty',
      };
    }
  }
  
  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
