
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import SafeAgoraView from './SafeAgoraView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoGridProps {
  localUid: number;
  remoteUids: number[];
  isMocked?: boolean;
}

// Check if we're in Expo Go using executionEnvironment (recommended) or appOwnership (deprecated fallback)
const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

/**
 * VideoGrid Component (Native)
 * 
 * Displays video feeds in a grid layout for multi-guest streaming.
 * 
 * EXPO GO SUPPORT:
 * - Uses SafeAgoraView component for safe rendering
 * - Shows placeholder views in Expo Go
 * - Full video rendering in dev client or standalone builds
 * 
 * CRITICAL: Uses SafeAgoraView to prevent white screen crashes
 */
export default function VideoGrid({ localUid, remoteUids, isMocked = false }: VideoGridProps) {
  console.log('📺 [VideoGrid] Rendering with:', {
    localUid,
    remoteUids,
    isMocked,
    isExpoGo,
  });

  // Calculate grid layout
  const totalUsers = 1 + remoteUids.length;
  const gridSize = Math.ceil(Math.sqrt(totalUsers));
  const videoWidth = SCREEN_WIDTH / gridSize;
  const videoHeight = videoWidth * (4 / 3);

  return (
    <View style={styles.container}>
      {/* Local User */}
      <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
        <SafeAgoraView
          uid={localUid}
          sourceType="camera"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.userLabel}>
          <Text style={styles.userLabelText}>You</Text>
          {(isExpoGo || isMocked) && (
            <Text style={styles.mockIndicator}>MOCK</Text>
          )}
        </View>
      </View>

      {/* Remote Users */}
      {remoteUids.map((uid) => (
        <View key={uid} style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
          <SafeAgoraView
            uid={uid}
            sourceType="remote"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.userLabel}>
            <Text style={styles.userLabelText}>User {uid}</Text>
            {(isExpoGo || isMocked) && (
              <Text style={styles.mockIndicator}>MOCK</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#000000',
  },
  videoContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333333',
  },
  userLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mockIndicator: {
    color: '#FFA500',
    fontSize: 9,
    fontWeight: '700',
  },
});
