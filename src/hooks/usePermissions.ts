
import { useState, useEffect, useCallback } from 'react';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * usePermissions Hook
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Robust pattern for requesting camera and microphone permissions.
 * 
 * Features:
 * - Requests permissions once on focus
 * - Stores result in state to avoid infinite loops
 * - Handles 'denied' by providing openSettings function
 * - Platform-specific handling
 * 
 * Usage:
 * ```tsx
 * const { 
 *   hasCameraPermission, 
 *   hasMicrophonePermission, 
 *   isLoading,
 *   openSettings 
 * } = usePermissions();
 * 
 * if (isLoading) return <LoadingView />;
 * if (!hasCameraPermission || !hasMicrophonePermission) {
 *   return (
 *     <View>
 *       <Text>Permissions not granted</Text>
 *       <Button title="Open Settings" onPress={openSettings} />
 *     </View>
 *   );
 * }
 * ```
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function usePermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);

  /**
   * Open device settings
   * Allows user to manually grant permissions if they were denied
   */
  const openSettings = useCallback(() => {
    console.log('📱 [usePermissions] Opening device settings');
    Linking.openSettings();
  }, []);

  /**
   * Request permissions once on focus
   * Uses useFocusEffect to avoid infinite loops
   */
  useFocusEffect(
    useCallback(() => {
      const requestPermissions = async () => {
        // Skip if already requested
        if (hasRequestedOnce) {
          console.log('⏭️ [usePermissions] Permissions already requested, skipping');
          return;
        }

        console.log('🔐 [usePermissions] Requesting permissions...');
        setIsLoading(true);

        try {
          // Check current permission status
          const cameraGranted = cameraPermission?.granted ?? false;
          const micGranted = microphonePermission?.granted ?? false;

          console.log('📷 [usePermissions] Camera permission:', cameraGranted);
          console.log('🎤 [usePermissions] Microphone permission:', micGranted);

          // Request camera permission if not granted
          if (!cameraGranted) {
            console.log('📷 [usePermissions] Requesting camera permission...');
            const cameraResult = await requestCameraPermission();
            setHasCameraPermission(cameraResult.granted);
            console.log('📷 [usePermissions] Camera permission result:', cameraResult.granted);
          } else {
            setHasCameraPermission(true);
          }

          // Request microphone permission if not granted
          if (!micGranted) {
            console.log('🎤 [usePermissions] Requesting microphone permission...');
            const micResult = await requestMicrophonePermission();
            setHasMicrophonePermission(micResult.granted);
            console.log('🎤 [usePermissions] Microphone permission result:', micResult.granted);
          } else {
            setHasMicrophonePermission(true);
          }

          // Mark as requested
          setHasRequestedOnce(true);
        } catch (error) {
          console.error('❌ [usePermissions] Error requesting permissions:', error);
          setHasCameraPermission(false);
          setHasMicrophonePermission(false);
        } finally {
          setIsLoading(false);
        }
      };

      requestPermissions();
    }, [
      hasRequestedOnce,
      cameraPermission,
      microphonePermission,
      requestCameraPermission,
      requestMicrophonePermission,
    ])
  );

  /**
   * Update permission state when permission objects change
   */
  useEffect(() => {
    if (cameraPermission) {
      setHasCameraPermission(cameraPermission.granted);
    }
    if (microphonePermission) {
      setHasMicrophonePermission(microphonePermission.granted);
    }
  }, [cameraPermission, microphonePermission]);

  /**
   * Stop loading once we have permission information
   */
  useEffect(() => {
    if (hasCameraPermission !== null && hasMicrophonePermission !== null) {
      setIsLoading(false);
    }
  }, [hasCameraPermission, hasMicrophonePermission]);

  return {
    hasCameraPermission,
    hasMicrophonePermission,
    isLoading,
    openSettings,
    cameraPermission,
    microphonePermission,
    canDenied: cameraPermission?.canAskAgain === false || microphonePermission?.canAskAgain === false,
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Android Permissions Required
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Add these to app.json:
 * 
 * {
 *   "expo": {
 *     "android": {
 *       "permissions": [
 *         "CAMERA",
 *         "RECORD_AUDIO",
 *         "INTERNET",
 *         "android.permission.MODIFY_AUDIO_SETTINGS",
 *         "android.permission.ACCESS_NETWORK_STATE"
 *       ]
 *     },
 *     "plugins": [
 *       [
 *         "expo-camera",
 *         {
 *           "cameraPermission": "Roast Live needs access to your camera to let you stream and use AR filters.",
 *           "microphonePermission": "Roast Live needs access to your microphone so others can hear you during the roast.",
 *           "recordAudioAndroid": true
 *         }
 *       ]
 *     ]
 *   }
 * }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
