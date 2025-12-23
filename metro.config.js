
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for react-native-webrtc
config.resolver.sourceExts.push('cjs');

// Ensure proper resolution of native modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;