
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VideoGridProps {
  localUid: number;
  remoteUids: number[];
  onUserTap?: (uid: number) => void;
  fullScreenUid?: number | null;
  speakingUids?: number[];
}

/**
 * VideoGrid Component (Web Fallback)
 * 
 * This is a fallback implementation for web platforms where react-native-agora is not supported.
 * Live streaming with video grid is only available on native platforms (iOS/Android).
 */
export function VideoGrid({
  localUid,
  remoteUids,
  onUserTap,
  fullScreenUid,
  speakingUids = [],
}: VideoGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          Video Grid is not supported on web.
        </Text>
        <Text style={styles.submessageText}>
          Please use the iOS or Android app for live streaming.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  submessageText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
  },
});
