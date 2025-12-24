
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useLiveStreamStateMachine } from '@/contexts/LiveStreamStateMachine';
import { streamService } from '@/app/services/streamService';
import { agoraService } from '@/app/services/agoraService';
import { useAgoraEngine } from '@/hooks/useAgoraEngine.native';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';
import { useStreamConnection } from '@/hooks/useStreamConnection';

// Components
import SafeAgoraView from '@/components/SafeAgoraView';
import ChatOverlay from '@/components/ChatOverlay';
import LiveStreamControlPanel from '@/components/LiveStreamControlPanel';
import StreamStartingOverlay from '@/components/StreamStartingOverlay';
import EndStreamModal from '@/components/EndStreamModal';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';
import StreamHealthDashboard from '@/components/StreamHealthDashboard';
import GuestControlPanel from '@/components/GuestControlPanel';
import HostControlDashboard from '@/components/HostControlDashboard';
import LiveSeasonIntegration from '@/components/LiveSeasonIntegration';
import RoastGiftAnimationOverlay from '@/components/RoastGiftAnimationOverlay';
import CameraZoomControl from '@/components/CameraZoomControl';
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BROADCAST SCREEN (NATIVE - iOS/Android)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is the NATIVE implementation of the broadcast screen using Agora RTC.
 * 
 * PLATFORM SUPPORT:
 * - iOS: ✅ Full Agora support
 * - Android: ✅ Full Agora support
 * - Web: ❌ Use broadcast.web.tsx instead
 * 
 * CRITICAL FEATURES:
 * - Real-time video/audio streaming via Agora
 * - Co-hosting with up to 8 guests
 * - Live chat with moderation
 * - Gift animations and season tracking
 * - Camera filters and face effects
 * - Connection monitoring and auto-reconnect
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export default function BroadcastScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  
  const { setIsStreaming } = useStreaming();
  const liveStreamState = useLiveStreamStateMachine();
  
  // Agora engine
  const {
    engine,
    isAgoraAvailable,
    initializeEngine,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    isCameraOn,
    isMicrophoneOn,
    localUid,
    remoteUsers,
  } = useAgoraEngine();

  // Camera effects
  const { activeFilter, activeEffect } = useCameraEffects();
  const { activeEffect: activeFaceEffect } = useAIFaceEffects();

  // Stream state
  const [streamId, setStreamId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);

  // Connection monitoring
  const {
    connectionStatus,
    reconnectAttempt,
    isReconnecting,
    startReconnect,
    stopReconnect,
  } = useStreamConnection({
    isStreaming: isLive,
    onReconnectSuccess: () => {
      console.log('✅ Reconnection successful');
    },
    onReconnectFailed: () => {
      console.log('❌ Reconnection failed - ending stream');
      handleEndStream();
    },
  });

  const isMountedRef = useRef(true);

  // CRITICAL: Hide bottom tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🎬 [BROADCAST] Screen focused - hiding bottom tab bar');
      
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        console.log('🎬 [BROADCAST] Screen blurred - restoring bottom tab bar');
        const parent = navigation.getParent();
        if (parent) {
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }
      };
    }, [navigation])
  );

  // Initialize stream
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!isAgoraAvailable) {
      Alert.alert(
        'Agora Not Available',
        'Streaming is not available in Expo Go. Please use a development build.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    const initStream = async () => {
      try {
        console.log('🚀 [BROADCAST] Initializing stream...');
        setIsInitializing(true);

        // Extract params
        const streamTitle = params.streamTitle as string || 'Untitled Stream';
        const contentLabel = params.contentLabel as string || 'family_friendly';
        const practiceMode = params.practiceMode === 'true';

        console.log('📝 [BROADCAST] Stream params:', { streamTitle, contentLabel, practiceMode });

        // Initialize Agora engine
        await initializeEngine();

        // Create stream in database
        const { stream, error: streamError } = await streamService.createStream({
          user_id: user.id,
          title: streamTitle,
          content_label: contentLabel,
          practice_mode: practiceMode,
        });

        if (streamError || !stream) {
          throw new Error(streamError || 'Failed to create stream');
        }

        console.log('✅ [BROADCAST] Stream created:', stream.id);
        setStreamId(stream.id);

        // Get Agora token
        const { token, channelName: channel, error: tokenError } = await agoraService.getAgoraToken(
          stream.id,
          user.id,
          'host'
        );

        if (tokenError || !token || !channel) {
          throw new Error(tokenError || 'Failed to get Agora token');
        }

        console.log('✅ [BROADCAST] Agora token received');
        setChannelName(channel);
        setAgoraToken(token);

        // Join Agora channel
        await joinChannel(channel, token, 0);

        console.log('✅ [BROADCAST] Joined Agora channel');

        // Mark stream as live
        await streamService.startStream(stream.id);
        setIsLive(true);
        setIsStreaming(true);

        console.log('✅ [BROADCAST] Stream is now LIVE');
      } catch (error) {
        console.error('❌ [BROADCAST] Error initializing stream:', error);
        Alert.alert(
          'Stream Error',
          'Failed to start stream. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } finally {
        if (isMountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    initStream();

    return () => {
      isMountedRef.current = false;
    };
  }, [user, params, isAgoraAvailable, initializeEngine, joinChannel, setIsStreaming]);

  // Handle end stream
  const handleEndStream = useCallback(async () => {
    try {
      console.log('🛑 [BROADCAST] Ending stream...');

      if (streamId) {
        await streamService.endStream(streamId);
      }

      await leaveChannel();
      setIsLive(false);
      setIsStreaming(false);

      console.log('✅ [BROADCAST] Stream ended successfully');

      // Restore tab bar before navigation
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: undefined,
        });
      }

      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('❌ [BROADCAST] Error ending stream:', error);
      Alert.alert('Error', 'Failed to end stream properly. Please try again.');
    }
  }, [streamId, leaveChannel, setIsStreaming, navigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLive) {
        handleEndStream();
      }
    };
  }, [isLive, handleEndStream]);

  if (isInitializing) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={styles.loadingText}>Starting stream...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        {/* AGORA VIDEO VIEW */}
        <SafeAgoraView
          style={StyleSheet.absoluteFill}
          channelId={channelName || ''}
          renderMode={1}
          zOrderMediaOverlay={false}
        />

        {/* CAMERA FILTERS & EFFECTS OVERLAY */}
        {(activeFilter || activeEffect || activeFaceEffect) && (
          <ImprovedCameraFilterOverlay
            activeFilter={activeFilter}
            activeEffect={activeEffect}
            activeFaceEffect={activeFaceEffect}
          />
        )}

        {/* CONNECTION STATUS INDICATOR */}
        <ConnectionStatusIndicator
          status={connectionStatus}
          reconnectAttempt={reconnectAttempt}
          isReconnecting={isReconnecting}
        />

        {/* STREAM HEALTH DASHBOARD */}
        <StreamHealthDashboard
          viewerCount={viewerCount}
          giftCount={giftCount}
          connectionStatus={connectionStatus}
        />

        {/* LIVE SEASON INTEGRATION */}
        {streamId && (
          <LiveSeasonIntegration
            streamId={streamId}
            userId={user?.id || ''}
          />
        )}

        {/* CHAT OVERLAY */}
        {streamId && (
          <ChatOverlay
            streamId={streamId}
            userId={user?.id || ''}
          />
        )}

        {/* GIFT ANIMATION OVERLAY */}
        {streamId && (
          <RoastGiftAnimationOverlay
            streamId={streamId}
          />
        )}

        {/* CAMERA ZOOM CONTROL */}
        <CameraZoomControl />

        {/* HOST CONTROL DASHBOARD */}
        {streamId && (
          <HostControlDashboard
            streamId={streamId}
            onEndStream={() => setShowEndStreamModal(true)}
            isCameraOn={isCameraOn}
            isMicrophoneOn={isMicrophoneOn}
            onToggleCamera={toggleCamera}
            onToggleMicrophone={toggleMicrophone}
            onSwitchCamera={switchCamera}
          />
        )}

        {/* GUEST CONTROL PANEL */}
        {streamId && remoteUsers.length > 0 && (
          <GuestControlPanel
            streamId={streamId}
            remoteUsers={remoteUsers}
          />
        )}

        {/* END STREAM MODAL */}
        <EndStreamModal
          visible={showEndStreamModal}
          onConfirm={handleEndStream}
          onCancel={() => setShowEndStreamModal(false)}
          streamId={streamId}
        />

        {/* STREAM STARTING OVERLAY */}
        {!isLive && (
          <StreamStartingOverlay />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
