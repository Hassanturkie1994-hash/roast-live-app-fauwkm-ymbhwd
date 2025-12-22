
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { webRTCService } from '@/app/services/webRTCService';
import { RTCView } from 'react-native-webrtc';

interface WebRTCLivePublisherProps {
  streamId: string;
  userId: string;
  isHost: boolean;
  guestUserIds?: string[];
  onStreamReady?: () => void;
  onStreamError?: (error: Error) => void;
  onGuestConnected?: (guestUserId: string) => void;
  onGuestDisconnected?: (guestUserId: string) => void;
}

/**
 * WebRTCLivePublisher
 * 
 * Manages WebRTC connections for co-hosting.
 * 
 * For Host:
 * - Captures local camera/mic
 * - Creates peer connections for each guest
 * - Receives guest video/audio streams
 * - Composites all streams locally
 * - Sends composite to Cloudflare Stream via RTMP
 * 
 * For Guest:
 * - Captures local camera/mic
 * - Creates peer connection to host
 * - Sends video/audio to host
 * - Receives host's composite stream
 */
export default function WebRTCLivePublisher({
  streamId,
  userId,
  isHost,
  guestUserIds = [],
  onStreamReady,
  onStreamError,
  onGuestConnected,
  onGuestDisconnected,
}: WebRTCLivePublisherProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStreamUrl, setLocalStreamUrl] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, string>>(new Map());
  const initAttemptedRef = useRef(false);

  const initializeWebRTC = useCallback(async () => {
    if (initAttemptedRef.current) {
      console.log('⚠️ [WebRTCPublisher] Already initialized, skipping');
      return;
    }

    initAttemptedRef.current = true;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [WebRTCPublisher] Initializing WebRTC');
    console.log('Stream ID:', streamId);
    console.log('User ID:', userId);
    console.log('Is Host:', isHost);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const success = await webRTCService.initialize(streamId, userId, isHost);

      if (!success) {
        throw new Error('Failed to initialize WebRTC service');
      }

      // Get local stream URL for rendering
      const localStream = webRTCService.getLocalStream();
      if (localStream) {
        setLocalStreamUrl(localStream.toURL());
      }

      setIsInitialized(true);
      onStreamReady?.();

      console.log('✅ [WebRTCPublisher] WebRTC initialized successfully');

      // If host, create peer connections for existing guests
      if (isHost && guestUserIds.length > 0) {
        console.log('🔗 [WebRTCPublisher] Creating peer connections for guests:', guestUserIds);
        
        for (const guestUserId of guestUserIds) {
          const created = await webRTCService.createPeerConnectionForGuest(guestUserId);
          if (created) {
            onGuestConnected?.(guestUserId);
          }
        }
      }

      // If guest, wait for host to send offer
      if (!isHost) {
        console.log('⏳ [WebRTCPublisher] Guest waiting for host offer...');
        // The offer will be handled by webRTCService via signaling channel
      }
    } catch (error: any) {
      console.error('❌ [WebRTCPublisher] Initialization error:', error);
      onStreamError?.(error);
    }
  }, [streamId, userId, isHost, guestUserIds, onStreamReady, onStreamError, onGuestConnected]);

  // Initialize on mount
  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializeWebRTC();
    }

    return () => {
      console.log('🧹 [WebRTCPublisher] Cleaning up WebRTC');
      webRTCService.destroy();
    };
  }, [initializeWebRTC]);

  // Monitor guest connections
  useEffect(() => {
    if (!isHost || !isInitialized) return;

    const interval = setInterval(() => {
      const remoteStreams = webRTCService.getRemoteStreams();
      const newRemoteStreamsMap = new Map<string, string>();

      remoteStreams.forEach((stream, index) => {
        const url = stream.toURL();
        newRemoteStreamsMap.set(`guest-${index}`, url);
      });

      setRemoteStreams(newRemoteStreamsMap);
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, isInitialized]);

  // Handle new guests joining
  useEffect(() => {
    if (!isHost || !isInitialized) return;

    const currentGuestIds = new Set(guestUserIds);
    const connectedGuestIds = new Set(
      Array.from(remoteStreams.keys()).map((key) => key.replace('guest-', ''))
    );

    // Find new guests
    const newGuests = guestUserIds.filter((id) => !connectedGuestIds.has(id));

    if (newGuests.length > 0) {
      console.log('🆕 [WebRTCPublisher] New guests detected:', newGuests);
      
      newGuests.forEach(async (guestUserId) => {
        const created = await webRTCService.createPeerConnectionForGuest(guestUserId);
        if (created) {
          onGuestConnected?.(guestUserId);
        }
      });
    }
  }, [isHost, isInitialized, guestUserIds, remoteStreams, onGuestConnected]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.webNotSupported}>
          WebRTC co-hosting is not supported on web.
          Please use the mobile app to join as a guest.
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.initializingText}>Initializing WebRTC...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Local stream (host or guest camera) */}
      {localStreamUrl && (
        <RTCView
          streamURL={localStreamUrl}
          style={styles.localStream}
          objectFit="cover"
          mirror={true}
        />
      )}

      {/* Remote streams (only for host - guest streams) */}
      {isHost && remoteStreams.size > 0 && (
        <View style={styles.remoteStreamsContainer}>
          {Array.from(remoteStreams.entries()).map(([key, streamUrl]) => (
            <RTCView
              key={key}
              streamURL={streamUrl}
              style={styles.remoteStream}
              objectFit="cover"
            />
          ))}
        </View>
      )}

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          {isHost ? '🎥 HOST' : '🎤 GUEST'} | {remoteStreams.size} remote streams
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  localStream: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteStreamsContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    gap: 8,
    zIndex: 50,
  },
  remoteStream: {
    width: 120,
    height: 160,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  webNotSupported: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    padding: 40,
  },
  initializingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  debugInfo: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 100,
  },
  debugText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
