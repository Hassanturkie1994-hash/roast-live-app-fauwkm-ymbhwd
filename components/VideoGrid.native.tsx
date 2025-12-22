
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import { RtcSurfaceView, VideoSourceType } from '@/hooks/useAgoraEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoGridProps {
  localUid: number;
  remoteUids: number[];
  isMocked?: boolean;
}

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * VideoGrid Component (Native)
 * 
 * Displays video feeds in a grid layout for multi-guest streaming.
 * 
 * EXPO GO SUPPORT:
 * - Shows placeholder views in Expo Go
 * - Full video rendering in dev client or standalone builds
 */
export default function VideoGrid({ localUid, remoteUids, isMocked = false }: VideoGridProps) {
  // If in Expo Go or mocked, show placeholder
  if (isExpoGo || isMocked) {
    return (
      <View style={styles.container}>
        <View style={styles.mockContainer}>
          <View style={styles.mockVideoBox}>
            <Text style={styles.mockText}>⚠️ AGORA VIDEO PREVIEW</Text>
            <Text style={styles.mockSubtext}>
              (Not available in Expo Go.{'\n'}Build Dev Client to test.)
            </Text>
          </View>
          {remoteUids.map((uid, index) => (
            <View key={uid} style={styles.mockVideoBox}>
              <Text style={styles.mockText}>Remote User {index + 1}</Text>
              <Text style={styles.mockSubtext}>UID: {uid}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Real Agora video rendering
  const totalUsers = 1 + remoteUids.length;
  const gridSize = Math.ceil(Math.sqrt(totalUsers));
  const videoWidth = SCREEN_WIDTH / gridSize;
  const videoHeight = videoWidth * (4 / 3); // 4:3 aspect ratio

  return (
    <View style={styles.container}>
      {/* Local User */}
      <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{
            uid: localUid,
            sourceType: VideoSourceType.VideoSourceCamera,
          }}
        />
        <View style={styles.userLabel}>
          <Text style={styles.userLabelText}>You</Text>
        </View>
      </View>

      {/* Remote Users */}
      {remoteUids.map((uid) => (
        <View key={uid} style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{
              uid,
              sourceType: VideoSourceType.VideoSourceRemote,
            }}
          />
          <View style={styles.userLabel}>
            <Text style={styles.userLabelText}>User {uid}</Text>
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
  },
  userLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  mockVideoBox: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 4 / 3,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  mockSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
});
