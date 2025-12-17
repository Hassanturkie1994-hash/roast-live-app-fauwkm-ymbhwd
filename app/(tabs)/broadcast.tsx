
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStreamStateMachine } from '@/contexts/LiveStreamStateMachine';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import GiftSelector from '@/components/GiftSelector';
import LiveSettingsPanel from '@/components/LiveSettingsPanel';
import EndStreamModal from '@/components/EndStreamModal';
import SaveReplayModal from '@/components/SaveReplayModal';
import GuestSeatGrid from '@/components/GuestSeatGrid';
import GuestInvitationModal from '@/components/GuestInvitationModal';
import HostControlDashboard from '@/components/HostControlDashboard';
import { streamGuestService } from '@/app/services/streamGuestService';
import { supabase } from '@/app/integrations/supabase/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuestSeat {
  seatIndex: number;
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  isModerator: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  mutedByHost: boolean;
  cameraDisabledByHost: boolean;
}

export default function BroadcastScreen() {
  useKeepAwake();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📺 [BROADCAST] Component rendering...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { streamTitle, contentLabel } = useLocalSearchParams<{
    streamTitle?: string;
    contentLabel?: string;
  }>();
  
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // CRITICAL FIX: Wrap state machine hook in try-catch with detailed error handling
  let stateMachine;
  let stateMachineError: Error | null = null;
  
  try {
    console.log('🔍 [BROADCAST] Attempting to access state machine...');
    stateMachine = useLiveStreamStateMachine();
    console.log('✅ [BROADCAST] State machine accessed successfully');
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [BROADCAST] CRITICAL: Failed to access state machine');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    stateMachineError = error;
    
    // Return error UI if state machine is not available
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#000000' }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={64}
          color="#FF4444"
        />
        <Text style={[styles.errorText, { color: '#FFFFFF' }]}>Service Error</Text>
        <Text style={[styles.errorSubtext, { color: '#CCCCCC' }]}>
          Live streaming service is not available.
        </Text>
        <Text style={[styles.errorDetails, { color: '#999999' }]}>
          {error.message}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: '#FF4444' }]}
          onPress={() => {
            console.log('🔙 [BROADCAST] User pressed Go Back button');
            router.back();
          }}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { state, startStream, endStream, error: stateMachineErrorState } = stateMachine;
  
  console.log('📊 [BROADCAST] State machine state:', state);
  console.log('📊 [BROADCAST] State machine error:', stateMachineErrorState);
  
  // CRITICAL FIX: Import hooks directly from expo-camera
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [showChat, setShowChat] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSaveReplayModal, setShowSaveReplayModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Guest mode states
  const [activeGuests, setActiveGuests] = useState<GuestSeat[]>([]);
  const [showGuestInvitation, setShowGuestInvitation] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const viewerCountIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptedRef = useRef<boolean>(false);

  const loadActiveGuests = useCallback(async () => {
    if (!streamId) return;

    try {
      const guests = await streamGuestService.getActiveGuests(streamId);
      setActiveGuests(guests);
    } catch (error) {
      console.error('Error loading active guests:', error);
    }
  }, [streamId]);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('🔐 [BROADCAST] Checking permissions...');
      console.log('📷 Camera permission:', cameraPermission);
      console.log('🎤 Mic permission:', micPermission);
      
      if (!cameraPermission?.granted) {
        console.log('📷 Requesting camera permission...');
        const result = await requestCameraPermission();
        console.log('📷 Camera permission result:', result);
      }
      if (!micPermission?.granted) {
        console.log('🎤 Requesting mic permission...');
        const result = await requestMicPermission();
        console.log('🎤 Mic permission result:', result);
      }
    };

    checkPermissions();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initAttemptedRef.current) {
      console.log('⏭️ [BROADCAST] Init already attempted, skipping...');
      return;
    }

    if (!user || !streamTitle) {
      console.error('❌ [BROADCAST] Missing user or stream title');
      console.error('User:', user);
      console.error('Stream title:', streamTitle);
      setInitError('Missing stream information');
      return;
    }

    const initStream = async () => {
      initAttemptedRef.current = true;
      
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 [BROADCAST] Initializing stream...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Title:', streamTitle);
        console.log('🏷️ Content Label:', contentLabel);

        // CRITICAL FIX: Verify startStream is a function before calling
        console.log('🔍 [BROADCAST] Verifying startStream function...');
        console.log('Type of startStream:', typeof startStream);
        
        if (!startStream) {
          console.error('❌ [BROADCAST] startStream is undefined');
          setInitError('Stream service is not available');
          return;
        }
        
        if (typeof startStream !== 'function') {
          console.error('❌ [BROADCAST] startStream is not a function');
          console.error('Actual type:', typeof startStream);
          console.error('Value:', startStream);
          setInitError('Stream service is not properly configured');
          return;
        }

        console.log('✅ [BROADCAST] startStream is a valid function');
        console.log('🎬 [BROADCAST] Calling startStream...');

        const result = await startStream(streamTitle, contentLabel || 'family_friendly');
        
        console.log('📡 [BROADCAST] startStream result:', result);

        if (result.success && result.streamId) {
          console.log('✅ [BROADCAST] Stream started successfully:', result.streamId);
          setStreamId(result.streamId);
          setInitError(null);
        } else {
          console.error('❌ [BROADCAST] Failed to start stream:', result.error);
          setInitError(result.error || 'Failed to start stream');
        }
      } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ [BROADCAST] CRITICAL: Error in initStream');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setInitError(error.message || 'Failed to initialize stream');
      }
    };

    initStream();
  }, [user, streamTitle, contentLabel, startStream]);

  useEffect(() => {
    if (!streamId) return;

    const updateViewerCount = async () => {
      try {
        const { count } = await supabase
          .from('stream_viewers')
          .select('*', { count: 'exact', head: true })
          .eq('stream_id', streamId)
          .is('left_at', null);

        setViewerCount(count || 0);
      } catch (error) {
        console.error('Error fetching viewer count:', error);
      }
    };

    updateViewerCount();
    viewerCountIntervalRef.current = setInterval(updateViewerCount, 5000);

    return () => {
      if (viewerCountIntervalRef.current) {
        clearInterval(viewerCountIntervalRef.current);
      }
    };
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;

    loadActiveGuests();

    const interval = setInterval(() => {
      loadActiveGuests();
    }, 3000);

    return () => clearInterval(interval);
  }, [streamId, loadActiveGuests]);

  const handleEndStream = async (saveReplay: boolean) => {
    if (!streamId || isEnding) return;

    setIsEnding(true);

    try {
      console.log('🛑 [BROADCAST] Ending stream...');
      
      // CRITICAL FIX: Verify endStream is a function before calling
      if (!endStream) {
        console.error('❌ [BROADCAST] endStream is undefined');
        Alert.alert('Error', 'Stream service is not available');
        setIsEnding(false);
        return;
      }
      
      if (typeof endStream !== 'function') {
        console.error('❌ [BROADCAST] endStream is not a function');
        Alert.alert('Error', 'Stream service is not properly configured');
        setIsEnding(false);
        return;
      }

      const result = await endStream(streamId, saveReplay);
      
      if (result.success) {
        console.log('✅ [BROADCAST] Stream ended successfully');
        setShowEndModal(false);
        
        if (saveReplay) {
          setShowSaveReplayModal(true);
        } else {
          router.replace('/(tabs)/(home)');
        }
      } else {
        console.error('❌ [BROADCAST] Failed to end stream:', result.error);
        Alert.alert('Error', result.error || 'Failed to end stream');
      }
    } catch (error: any) {
      console.error('❌ [BROADCAST] Error ending stream:', error);
      Alert.alert('Error', error.message || 'Failed to end stream');
    } finally {
      setIsEnding(false);
    }
  };

  const handleSaveReplayComplete = () => {
    setShowSaveReplayModal(false);
    router.replace('/(tabs)/(home)');
  };

  // CRITICAL FIX: Handle initialization errors
  if (initError) {
    console.error('❌ [BROADCAST] Initialization error:', initError);
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={64}
          color={colors.brandPrimary}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to Start Stream</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          {initError}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: colors.brandPrimary }]}
          onPress={() => {
            console.log('🔙 [BROADCAST] User pressed Go Back button');
            router.back();
          }}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // CRITICAL FIX: Always return JSX - add early return with loading state
  if (!cameraPermission || !micPermission) {
    console.log('⏳ [BROADCAST] Permissions still loading...');
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    console.log('⚠️ [BROADCAST] Permissions not granted');
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="camera.fill"
          android_material_icon_name="camera"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera and microphone permissions are required
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.brandPrimary }]}
          onPress={async () => {
            console.log('🔐 [BROADCAST] Requesting permissions...');
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'IDLE' || state === 'CREATING_STREAM') {
    console.log('⏳ [BROADCAST] State:', state);
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {state === 'CREATING_STREAM' ? 'Starting stream...' : 'Initializing...'}
        </Text>
      </View>
    );
  }

  if (stateMachineErrorState) {
    console.error('❌ [BROADCAST] State machine error:', stateMachineErrorState);
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={64}
          color={colors.brandPrimary}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>Stream Error</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          {stateMachineErrorState}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: colors.brandPrimary }]}
          onPress={() => {
            console.log('🔙 [BROADCAST] User pressed Go Back button');
            router.back();
          }}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('✅ [BROADCAST] Rendering camera view');
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
      >
        {/* Guest Seats Grid */}
        {activeGuests.length > 0 && (
          <GuestSeatGrid
            guests={activeGuests}
            streamId={streamId || ''}
            isHost={true}
          />
        )}

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={[styles.viewerBadge, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowHostControls(!showHostControls)}
            >
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowSettings(!showSettings)}
            >
              <IconSymbol
                ios_icon_name="gearshape.fill"
                android_material_icon_name="settings"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(255, 0, 0, 0.8)' }]}
              onPress={() => setShowEndModal(true)}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Overlay */}
        {showChat && streamId && (
          <ChatOverlay
            streamId={streamId}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={() => setShowChat(!showChat)}
          >
            <IconSymbol
              ios_icon_name="bubble.left.fill"
              android_material_icon_name="chat"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={() => setShowGifts(!showGifts)}
          >
            <IconSymbol
              ios_icon_name="gift.fill"
              android_material_icon_name="card_giftcard"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={() => setShowGuestInvitation(true)}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person_add"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Gift Selector */}
        {showGifts && streamId && user && (
          <GiftSelector
            streamId={streamId}
            senderId={user.id}
            receiverId={user.id}
            onClose={() => setShowGifts(false)}
          />
        )}

        {/* Settings Panel */}
        {showSettings && streamId && (
          <LiveSettingsPanel
            streamId={streamId}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Guest Invitation Modal */}
        {showGuestInvitation && streamId && (
          <GuestInvitationModal
            streamId={streamId}
            onClose={() => setShowGuestInvitation(false)}
            onInviteSent={() => {
              setShowGuestInvitation(false);
              loadActiveGuests();
            }}
          />
        )}

        {/* Host Control Dashboard */}
        {showHostControls && streamId && (
          <HostControlDashboard
            streamId={streamId}
            guests={activeGuests}
            onClose={() => setShowHostControls(false)}
            onGuestsUpdate={loadActiveGuests}
          />
        )}
      </CameraView>

      {/* End Stream Modal */}
      <EndStreamModal
        visible={showEndModal}
        onConfirm={handleEndStream}
        onCancel={() => setShowEndModal(false)}
        isLoading={isEnding}
      />

      {/* Save Replay Modal */}
      <SaveReplayModal
        visible={showSaveReplayModal}
        streamId={streamId || ''}
        onComplete={handleSaveReplayComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorDetails: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
