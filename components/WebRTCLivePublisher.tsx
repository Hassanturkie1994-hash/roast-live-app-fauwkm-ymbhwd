
/**
 * ⚠️ DEPRECATED - WebRTC Live Publisher Removed
 * 
 * This component has been removed as part of the migration to Agora RTC SDK.
 * 
 * MIGRATION COMPLETE:
 * ✅ WebRTC publisher logic removed
 * ✅ Agora RTC SDK is now used for all video/audio streaming
 * ✅ Use `<RtcSurfaceView>` from `react-native-agora` for video rendering
 * 
 * REPLACEMENT:
 * - For broadcasting: Use `app/(tabs)/broadcast.tsx` or `broadcast.native.tsx`
 * - For video rendering: Use `<RtcSurfaceView>` from `react-native-agora`
 * - For Expo Go: Use `<VideoGrid>` component which handles mock mode
 * 
 * DO NOT USE THIS COMPONENT.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface WebRTCLivePublisherProps {
  streamId: string;
  onStreamReady?: () => void;
  onStreamError?: (error: Error) => void;
}

export default function WebRTCLivePublisher({
  streamId,
  onStreamReady,
  onStreamError,
}: WebRTCLivePublisherProps) {
  React.useEffect(() => {
    console.warn('⚠️ WebRTCLivePublisher is deprecated. Use Agora SDK instead.');
    onStreamError?.(new Error('WebRTCLivePublisher is deprecated. Use Agora SDK instead.'));
  }, [onStreamError]);

  return (
    <View style={styles.container}>
      <Text style={styles.warningText}>
        ⚠️ WebRTC Publisher Deprecated
      </Text>
      <Text style={styles.infoText}>
        Use Agora SDK for streaming
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gradientEnd,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
