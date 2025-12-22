
import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface WebRTCLivePublisherProps {
  streamId: string;
  onStreamReady?: () => void;
  onStreamError?: (error: Error) => void;
}

/**
 * WebRTCLivePublisher - DEPRECATED
 * 
 * ⚠️ THIS COMPONENT HAS BEEN REPLACED BY AGORA RTC ⚠️
 * 
 * The old WebRTC implementation has been completely removed.
 * All streaming functionality now uses Agora RTC SDK.
 * 
 * For streaming features, use:
 * - VideoGrid component for displaying streams
 * - useAgoraEngine hook for managing Agora connections
 * - AgoraView components for rendering video
 * 
 * This component is kept as a stub to prevent import errors during migration.
 */
export default function WebRTCLivePublisher({
  streamId,
  onStreamReady,
  onStreamError,
}: WebRTCLivePublisherProps) {
  React.useEffect(() => {
    console.warn('⚠️ [WebRTCLivePublisher] This component is deprecated. Use Agora components instead.');
    
    // Immediately call error callback to notify parent
    if (onStreamError) {
      onStreamError(new Error('WebRTCLivePublisher is deprecated. Use Agora RTC instead.'));
    }
  }, [onStreamError]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.warningText}>⚠️ WebRTC Deprecated</Text>
          <Text style={styles.infoText}>
            This component has been replaced by Agora RTC.
            {'\n\n'}
            Please use the new Agora-based streaming components.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Deprecated - no longer renders anything */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
});
