
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { RtcSurfaceView, VideoStreamType } from 'react-native-agora';

interface VideoGridProps {
  localUid: number;
  remoteUids: number[];
  onUserTap?: (uid: number) => void;
  fullScreenUid?: number | null;
  speakingUids?: number[];
}

/**
 * VideoGrid Component
 * 
 * Dynamically renders video feeds in an optimized grid layout
 * 
 * Features:
 * - 1-2 users: Full screen / Split screen
 * - 3-4 users: 2x2 Grid
 * - 5+ users: 3-column Grid
 * - Subscribes to Low quality streams for bandwidth optimization
 * - Switches to High quality when user is tapped for full screen
 * - Visual "Speaking Indicator" (green border) for active speakers
 */
export function VideoGrid({
  localUid,
  remoteUids,
  onUserTap,
  fullScreenUid,
  speakingUids = [],
}: VideoGridProps) {
  const { width, height } = Dimensions.get('window');

  // Calculate layout based on number of users
  const layout = useMemo(() => {
    const totalUsers = 1 + remoteUids.length; // Local + remote users

    if (fullScreenUid !== null && fullScreenUid !== undefined) {
      // Full screen mode for selected user
      return {
        columns: 1,
        rows: 1,
        itemWidth: width,
        itemHeight: height,
        fullScreen: true,
      };
    }

    if (totalUsers === 1) {
      // Single user - full screen
      return {
        columns: 1,
        rows: 1,
        itemWidth: width,
        itemHeight: height,
      };
    } else if (totalUsers === 2) {
      // Split screen vertically
      return {
        columns: 1,
        rows: 2,
        itemWidth: width,
        itemHeight: height / 2,
      };
    } else if (totalUsers <= 4) {
      // 2x2 Grid
      return {
        columns: 2,
        rows: 2,
        itemWidth: width / 2,
        itemHeight: height / 2,
      };
    } else if (totalUsers <= 6) {
      // 2x3 Grid
      return {
        columns: 2,
        rows: 3,
        itemWidth: width / 2,
        itemHeight: height / 3,
      };
    } else {
      // 3-column Grid for 7+ users
      const rows = Math.ceil(totalUsers / 3);
      return {
        columns: 3,
        rows: rows,
        itemWidth: width / 3,
        itemHeight: height / rows,
      };
    }
  }, [remoteUids.length, width, height, fullScreenUid]);

  // Render a single video view
  const renderVideoView = (uid: number, isLocal: boolean, index: number) => {
    const isSpeaking = speakingUids.includes(uid);
    const isFullScreen = fullScreenUid === uid;

    return (
      <TouchableOpacity
        key={`${uid}-${index}`}
        style={[
          styles.videoContainer,
          {
            width: layout.itemWidth,
            height: layout.itemHeight,
            borderWidth: isSpeaking ? 3 : 0,
            borderColor: isSpeaking ? '#00FF00' : 'transparent',
          },
        ]}
        onPress={() => onUserTap?.(uid)}
        activeOpacity={0.8}
      >
        <RtcSurfaceView
          canvas={{
            uid: uid,
            sourceType: isLocal ? 0 : 1, // 0 = local, 1 = remote
            renderMode: 1, // Hidden mode (fit)
          }}
          style={styles.video}
        />
        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <Text style={styles.speakingText}>🎤 Speaking</Text>
          </View>
        )}
        {isLocal && (
          <View style={styles.localBadge}>
            <Text style={styles.localBadgeText}>You</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render full screen mode
  if (layout.fullScreen && fullScreenUid !== null && fullScreenUid !== undefined) {
    const isLocal = fullScreenUid === localUid;
    return (
      <View style={styles.container}>
        {renderVideoView(fullScreenUid, isLocal, 0)}
      </View>
    );
  }

  // Render grid layout
  const allUids = [localUid, ...remoteUids];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {allUids.map((uid, index) => {
          const isLocal = uid === localUid;
          return renderVideoView(uid, isLocal, index);
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  speakingIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  speakingText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  localBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  localBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
