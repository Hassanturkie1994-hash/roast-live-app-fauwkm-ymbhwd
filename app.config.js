
/**
 * Expo App Configuration
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * EAS DEV CLIENT BUILD STABILIZATION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This configuration file is used to:
 * 1. Disable React Native New Architecture for maximum compatibility
 * 2. Exclude legacy native modules from autolinking
 * 3. Configure Agora RTC for native builds
 * 
 * TODO: Re-enable New Architecture after verifying Agora compatibility
 * TODO: Test with newArchEnabled: true in a future release
 */

module.exports = ({ config }) => {
  return {
    ...config,
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CRITICAL: DISABLE NEW ARCHITECTURE FOR BUILD STABILITY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // The New Architecture is disabled to ensure maximum compatibility with
    // third-party native modules, especially react-native-agora.
    // 
    // This can be re-enabled in the future after thorough testing.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    newArchEnabled: false,
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AUTOLINKING EXCLUSIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Exclude legacy native modules that are no longer used or cause build issues
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ios: {
      ...config.ios,
      // Exclude legacy modules from iOS autolinking
      // These modules are either deprecated or replaced by Agora
      excludedPackages: [
        'react-native-nodemediaclient', // Legacy RTMP streaming (replaced by Agora)
        'react-native-webrtc',          // Legacy WebRTC (replaced by Agora)
      ],
    },
    
    android: {
      ...config.android,
      // Exclude legacy modules from Android autolinking
      excludedPackages: [
        'react-native-nodemediaclient', // Legacy RTMP streaming (replaced by Agora)
        'react-native-webrtc',          // Legacy WebRTC (replaced by Agora)
      ],
    },
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PLUGINS CONFIGURATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    plugins: [
      ...(config.plugins || []),
      
      // Expo Router
      'expo-router',
      
      // Camera permissions for Agora streaming
      [
        'expo-camera',
        {
          cameraPermission: 'Roast Live needs access to your camera to let you stream and use AR filters.',
          microphonePermission: 'Roast Live needs access to your microphone so others can hear you during the roast.',
          recordAudioAndroid: true,
        },
      ],
    ],
  };
};
