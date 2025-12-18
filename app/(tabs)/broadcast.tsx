
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStreamStateMachine } from '@/contexts/LiveStreamStateMachine';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import RoastGiftSelector from '@/components/RoastGiftSelector';
import RoastGiftAnimationOverlay from '@/components/RoastGiftAnimationOverlay';
import EndStreamModal from '@/components/EndStreamModal';
import { SaveReplayModal } from '@/components/SaveReplayModal';
import GuestSeatGrid from '@/components/GuestSeatGrid';
import GuestInvitationModal from '@/components/GuestInvitationModal';
import HostControlDashboard from '@/components/HostControlDashboard';
import ModeratorControlPanel from '@/components/ModeratorControlPanel';
import LiveSettingsPanel from '@/components/LiveSettingsPanel';
import PinnedMessageBanner from '@/components/PinnedMessageBanner';
import ManagePinnedMessagesModal from '@/components/ManagePinnedMessagesModal';
import NetworkStabilityIndicator from '@/components/NetworkStabilityIndicator';
import VIPClubPanel from '@/components/VIPClubPanel';
import StreamHealthDashboard from '@/components/StreamHealthDashboard';
import { streamGuestService, StreamGuestSeat } from '@/app/services/streamGuestService';
import { supabase } from '@/app/integrations/supabase/client';
import { savedStreamService } from '@/app/services/savedStreamService';
import { roastGiftService } from '@/app/services/roastGiftService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoastGiftAnimationData {
  id: string;
  giftId: string;
  displayName: string;
  emoji: string;
  senderName: string;
  priceSEK: number;
  tier: 'LOW' | 'MID' | 'HIGH' | 'ULTRA';
}

/**
 * BroadcastScreen - Complete Feature Set with Roast Gift System
 * 
 * FEATURES:
 * 1. Moderator Panel - Manage moderators and banned users
 * 2. Settings Panel - Stream settings, practice mode, who can watch
 * 3. Pinned Messages - Pin and manage important chat messages
 * 4. Host Add Guests - Invite viewers to join as guests
 * 5. FPS Display - Real-time FPS monitoring
 * 6. Connection Quality - Good/Mid/Bad connection indicator
 * 7. VIP Club Integration - Restrict stream to VIP club members
 * 8. CDN Storage - Save streams to CDN and user profiles
 * 9. Stream Health Dashboard - Comprehensive stream metrics
 * 10. NEW ROAST GIFT SYSTEM - 45 roast-themed gifts with animations
 */
export default function BroadcastScreen() {
  useKeepAwake();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📺 [BROADCAST] Component rendering with ROAST GIFT SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { streamTitle, contentLabel } = useLocalSearchParams<{
    streamTitle?: string;
    contentLabel?: string;
  }>();
  
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const stateMachine = useLiveStreamStateMachine();
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const state = stateMachine?.state || 'IDLE';
  const startStream = stateMachine?.startStream || null;
  const endStream = stateMachine?.endStream || null;
  const stateMachineErrorState = stateMachine?.error || null;
  
  // UI State
  const [showChat, setShowChat] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSaveReplayModal, setShowSaveReplayModal] = useState(false);
  
  // Feature Panel States
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [showVIPClubPanel, setShowVIPClubPanel] = useState(false);
  const [showStreamHealth, setShowStreamHealth] = useState(true);
  
  // Stream State
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  
  // Guest State
  const [activeGuests, setActiveGuests] = useState<StreamGuestSeat[]>([]);
  const [showGuestInvitation, setShowGuestInvitation] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  
  // Settings State
  const [aboutLive, setAboutLive] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [whoCanWatch, setWhoCanWatch] = useState<'public' | 'followers' | 'vip_club'>('public');
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);
  const [selectedVIPClub, setSelectedVIPClub] = useState<string | null>(null);
  
  // NEW: Roast Gift Animation State
  const [giftAnimations, setGiftAnimations] = useState<RoastGiftAnimationData[]>([]);
  
  const cameraRef = useRef<CameraView>(null);
  const viewerCountIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptedRef = useRef<boolean>(false);
  const streamStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const giftCountIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initialize Roast Gift Service
    roastGiftService.initialize();
    
    return () => {
      isMountedRef.current = false;
      roastGiftService.destroy();
    };
  }, []);

  const loadActiveGuests = useCallback(async () => {
    if (!streamId) {
      console.log('⚠️ [BROADCAST] Cannot load guests: streamId is null');
      return;
    }

    try {
      if (!streamGuestService) {
        console.error('❌ [BROADCAST] streamGuestService is undefined');
        setActiveGuests([]);
        return;
      }

      if (typeof streamGuestService.getActiveGuestSeats !== 'function') {
        console.error('❌ [BROADCAST] streamGuestService.getActiveGuestSeats is not a function');
        setActiveGuests([]);
        return;
      }

      const guests = await streamGuestService.getActiveGuestSeats(streamId);
      
      if (!guests) {
        console.warn('⚠️ [BROADCAST] getActiveGuestSeats returned null/undefined');
        setActiveGuests([]);
        return;
      }

      if (!Array.isArray(guests)) {
        console.warn('⚠️ [BROADCAST] getActiveGuestSeats returned non-array:', typeof guests);
        setActiveGuests([]);
        return;
      }

      setActiveGuests(guests);
      console.log('✅ [BROADCAST] Loaded', guests.length, 'active guests');
    } catch (error) {
      console.error('❌ [BROADCAST] Error loading active guests:', error);
      setActiveGuests([]);
    }
  }, [streamId]);

  const handleSaveStream = useCallback(async () => {
    if (!streamId) {
      console.warn('⚠️ [BROADCAST] Cannot save stream: streamId is null');
      return;
    }

    if (!user) {
      console.warn('⚠️ [BROADCAST] Cannot save stream: user is null');
      return;
    }

    try {
      console.log('💾 [BROADCAST] Saving stream to CDN and profile...');
      
      if (!savedStreamService) {
        console.error('❌ [BROADCAST] savedStreamService is undefined');
        Alert.alert('Error', 'Stream service is not available');
        return;
      }

      if (typeof savedStreamService.saveStream !== 'function') {
        console.error('❌ [BROADCAST] savedStreamService.saveStream is not a function');
        Alert.alert('Error', 'Stream save function is not available');
        return;
      }

      const result = await savedStreamService.saveStream(
        user.id,
        streamId,
        streamTitle || 'Untitled Stream',
        undefined,
        undefined,
        streamDuration
      );

      if (!result) {
        console.error('❌ [BROADCAST] saveStream returned null/undefined');
        Alert.alert('Error', 'Failed to save stream');
        return;
      }

      if (!result.success) {
        console.error('❌ [BROADCAST] Error saving stream:', result.error);
        Alert.alert('Error', result.error || 'Failed to save stream');
        return;
      }

      console.log('✅ [BROADCAST] Stream saved successfully to profile');
      
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('❌ [BROADCAST] Error in handleSaveStream:', error);
      Alert.alert('Error', error?.message || 'Failed to save stream');
    }
  }, [streamId, user, streamTitle, streamDuration]);

  const handleDeleteStream = useCallback(async () => {
    if (!streamId) {
      console.warn('⚠️ [BROADCAST] Cannot delete stream: streamId is null');
      return;
    }

    try {
      console.log('🗑️ [BROADCAST] Deleting stream...');
      
      if (!supabase) {
        console.error('❌ [BROADCAST] supabase client is undefined');
        Alert.alert('Error', 'Database connection is not available');
        return;
      }

      const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', streamId);

      if (error) {
        console.error('❌ [BROADCAST] Error deleting stream:', error);
        Alert.alert('Error', error.message || 'Failed to delete stream');
        return;
      }

      console.log('✅ [BROADCAST] Stream deleted successfully');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('❌ [BROADCAST] Error in handleDeleteStream:', error);
      Alert.alert('Error', error?.message || 'Failed to delete stream');
    }
  }, [streamId]);

  const handleSaveReplayComplete = useCallback(() => {
    setShowSaveReplayModal(false);
    router.replace('/(tabs)/(home)');
  }, []);

  const handleUnpinMessage = useCallback(async (messageId: string) => {
    console.log('📌 [BROADCAST] Unpinning message:', messageId);
  }, []);

  const handleReconnect = useCallback(() => {
    console.log('🔄 [BROADCAST] Attempting to reconnect stream...');
  }, []);

  // NEW: Handle gift received from realtime
  const handleGiftReceived = useCallback((giftData: any) => {
    if (!isMountedRef.current) return;
    
    console.log('🎁 [BROADCAST] Gift received:', giftData);
    
    const newAnimation: RoastGiftAnimationData = {
      id: `${Date.now()}-${Math.random()}`,
      giftId: giftData.giftId,
      displayName: giftData.displayName,
      emoji: giftData.emoji,
      senderName: giftData.senderName,
      priceSEK: giftData.priceSEK,
      tier: giftData.tier,
    };
    
    setGiftAnimations((prev) => [...prev, newAnimation]);
  }, []);

  // NEW: Handle gift animation complete
  const handleGiftAnimationComplete = useCallback((animationId: string) => {
    if (!isMountedRef.current) return;
    
    setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('🔐 [BROADCAST] Checking permissions...');
      
      try {
        if (!cameraPermission?.granted && requestCameraPermission) {
          await requestCameraPermission();
        }
        if (!micPermission?.granted && requestMicPermission) {
          await requestMicPermission();
        }
      } catch (error) {
        console.error('❌ [BROADCAST] Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    if (initAttemptedRef.current) {
      return;
    }

    if (!user) {
      console.warn('⚠️ [BROADCAST] Cannot init stream: user is null');
      setInitError('User not authenticated');
      return;
    }

    if (!streamTitle) {
      console.warn('⚠️ [BROADCAST] Cannot init stream: streamTitle is missing');
      setInitError('Stream title is required');
      return;
    }

    const initStream = async () => {
      initAttemptedRef.current = true;
      
      try {
        console.log('🚀 [BROADCAST] Initializing stream with ROAST GIFT SYSTEM...');

        if (!startStream) {
          console.error('❌ [BROADCAST] startStream is undefined');
          setInitError('Stream service is not available');
          return;
        }

        if (typeof startStream !== 'function') {
          console.error('❌ [BROADCAST] startStream is not a function');
          setInitError('Stream service is not available');
          return;
        }

        const result = await startStream(streamTitle, contentLabel || 'family_friendly');

        if (!result) {
          console.error('❌ [BROADCAST] startStream returned null/undefined');
          setInitError('Failed to start stream');
          return;
        }

        if (result.success && result.streamId) {
          console.log('✅ [BROADCAST] Stream started successfully:', result.streamId);
          setStreamId(result.streamId);
          setInitError(null);
          streamStartTimeRef.current = Date.now();
        } else {
          console.error('❌ [BROADCAST] Stream start failed:', result.error);
          setInitError(result.error || 'Failed to start stream');
        }
      } catch (error: any) {
        console.error('❌ [BROADCAST] Error in initStream:', error);
        setInitError(error?.message || 'Failed to initialize stream');
      }
    };

    initStream();
  }, [user, streamTitle, contentLabel, startStream]);

  useEffect(() => {
    if (!streamId) return;

    const updateViewerCount = async () => {
      try {
        if (!supabase) {
          console.error('❌ [BROADCAST] supabase client is undefined');
          return;
        }

        const { count } = await supabase
          .from('stream_viewers')
          .select('*', { count: 'exact', head: true })
          .eq('stream_id', streamId)
          .is('left_at', null);

        const currentCount = count ?? 0;
        setViewerCount(currentCount);
        
        if (currentCount > peakViewers) {
          setPeakViewers(currentCount);
        }
        
        const { count: totalCount } = await supabase
          .from('stream_viewers')
          .select('*', { count: 'exact', head: true })
          .eq('stream_id', streamId);
        
        setTotalViewers(totalCount ?? 0);
      } catch (error) {
        console.error('❌ [BROADCAST] Error fetching viewer count:', error);
      }
    };

    updateViewerCount();
    viewerCountIntervalRef.current = setInterval(updateViewerCount, 5000);

    return () => {
      if (viewerCountIntervalRef.current) {
        clearInterval(viewerCountIntervalRef.current);
      }
    };
  }, [streamId, peakViewers]);

  useEffect(() => {
    if (!streamId || !streamStartTimeRef.current) return;

    const updateDuration = () => {
      if (streamStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - streamStartTimeRef.current) / 1000);
        setStreamDuration(elapsed);
      }
    };

    updateDuration();
    durationIntervalRef.current = setInterval(updateDuration, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;

    if (!streamGuestService) {
      console.error('❌ [BROADCAST] streamGuestService is undefined');
      return;
    }

    if (typeof streamGuestService.getActiveGuestSeats !== 'function') {
      console.error('❌ [BROADCAST] streamGuestService.getActiveGuestSeats is not a function');
      return;
    }

    loadActiveGuests();

    const interval = setInterval(() => {
      loadActiveGuests();
    }, 3000);

    return () => clearInterval(interval);
  }, [streamId, loadActiveGuests]);

  // NEW: Subscribe to roast gifts
  useEffect(() => {
    if (!streamId) return;

    console.log('🎁 [BROADCAST] Subscribing to roast gifts...');
    
    const unsubscribe = roastGiftService.subscribeToGifts(streamId, handleGiftReceived);

    return () => {
      console.log('🎁 [BROADCAST] Unsubscribing from roast gifts');
      unsubscribe();
    };
  }, [streamId, handleGiftReceived]);

  // Track roast gift count
  useEffect(() => {
    if (!streamId) return;

    const updateGiftCount = async () => {
      try {
        if (!supabase) {
          console.error('❌ [BROADCAST] supabase client is undefined');
          return;
        }

        const { count } = await supabase
          .from('roast_gift_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('stream_id', streamId);

        setGiftCount(count ?? 0);
      } catch (error) {
        console.error('❌ [BROADCAST] Error fetching gift count:', error);
      }
    };

    updateGiftCount();
    giftCountIntervalRef.current = setInterval(updateGiftCount, 10000);

    return () => {
      if (giftCountIntervalRef.current) {
        clearInterval(giftCountIntervalRef.current);
      }
    };
  }, [streamId]);

  if (initError) {
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
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!cameraPermission || !micPermission) {
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
            try {
              if (requestCameraPermission) await requestCameraPermission();
              if (requestMicPermission) await requestMicPermission();
            } catch (error) {
              console.error('❌ [BROADCAST] Error requesting permissions:', error);
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'IDLE' || state === 'CREATING_STREAM') {
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
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
      >
        <NetworkStabilityIndicator
          isStreaming={state === 'STREAMING'}
          streamId={streamId || undefined}
          onReconnect={handleReconnect}
        />

        {showStreamHealth && (
          <StreamHealthDashboard
            viewerCount={viewerCount}
            giftCount={giftCount}
            isVisible={showStreamHealth}
          />
        )}

        {activeGuests.length > 0 && user && streamId && (
          <GuestSeatGrid
            hostName={user.user_metadata?.display_name || 'Host'}
            hostAvatarUrl={user.user_metadata?.avatar_url}
            guests={activeGuests}
            streamId={streamId}
            hostId={user.id}
            isHost={true}
            onRefresh={loadActiveGuests}
            onEmptySeatPress={() => setShowGuestInvitation(true)}
          />
        )}

        {streamId && (
          <PinnedMessageBanner
            streamId={streamId}
            canUnpin={true}
            onUnpin={handleUnpinMessage}
          />
        )}

        <View style={styles.topBar}>
          <View style={[styles.viewerBadge, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowStreamHealth(!showStreamHealth)}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={20}
                color={showStreamHealth ? colors.brandPrimary : '#FFFFFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowModeratorPanel(true)}
            >
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowPinnedMessagesModal(true)}
            >
              <IconSymbol
                ios_icon_name="pin.fill"
                android_material_icon_name="push_pin"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

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
              onPress={() => setShowSettingsPanel(true)}
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

        {showChat && streamId && user && (
          <ChatOverlay
            streamId={streamId}
            isBroadcaster={true}
            hostId={user.id}
            hostName={user.user_metadata?.display_name || 'Host'}
          />
        )}

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

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={() => setShowVIPClubPanel(true)}
          >
            <IconSymbol
              ios_icon_name="star.circle.fill"
              android_material_icon_name="workspace_premium"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* NEW: Roast Gift Selector */}
        {showGifts && user && (
          <RoastGiftSelector
            visible={showGifts}
            onClose={() => setShowGifts(false)}
            receiverId={user.id}
            receiverName={user.user_metadata?.display_name || 'Host'}
            streamId={streamId || undefined}
          />
        )}

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

        {showHostControls && streamId && (
          <HostControlDashboard
            streamId={streamId}
            guests={activeGuests}
            onClose={() => setShowHostControls(false)}
            onGuestsUpdate={loadActiveGuests}
          />
        )}

        {showModeratorPanel && streamId && user && (
          <ModeratorControlPanel
            visible={showModeratorPanel}
            onClose={() => setShowModeratorPanel(false)}
            streamId={streamId}
            streamerId={user.id}
            currentUserId={user.id}
            isStreamer={true}
          />
        )}

        {showSettingsPanel && (
          <LiveSettingsPanel
            visible={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            aboutLive={aboutLive}
            setAboutLive={setAboutLive}
            practiceMode={practiceMode}
            setPracticeMode={setPracticeMode}
            whoCanWatch={whoCanWatch}
            setWhoCanWatch={setWhoCanWatch}
            selectedModerators={selectedModerators}
            setSelectedModerators={setSelectedModerators}
          />
        )}

        {showPinnedMessagesModal && streamId && (
          <ManagePinnedMessagesModal
            visible={showPinnedMessagesModal}
            onClose={() => setShowPinnedMessagesModal(false)}
            streamId={streamId}
          />
        )}

        {showVIPClubPanel && (
          <VIPClubPanel
            visible={showVIPClubPanel}
            onClose={() => setShowVIPClubPanel(false)}
            selectedClub={selectedVIPClub}
            onSelectClub={setSelectedVIPClub}
          />
        )}
      </CameraView>

      {/* NEW: Roast Gift Animations */}
      {giftAnimations.map((animation) => (
        <RoastGiftAnimationOverlay
          key={animation.id}
          giftId={animation.giftId}
          displayName={animation.displayName}
          emoji={animation.emoji}
          senderName={animation.senderName}
          priceSEK={animation.priceSEK}
          tier={animation.tier}
          onAnimationComplete={() => handleGiftAnimationComplete(animation.id)}
        />
      ))}

      {streamId && (
        <EndStreamModal
          visible={showEndModal}
          onClose={() => setShowEndModal(false)}
          onSaveStream={handleSaveStream}
          onDeleteStream={handleDeleteStream}
          streamTitle={streamTitle || 'Untitled Stream'}
          duration={streamDuration}
          peakViewers={peakViewers}
          totalViewers={totalViewers}
        />
      )}

      <SaveReplayModal
        visible={showSaveReplayModal}
        onSave={handleSaveStream}
        onDelete={handleDeleteStream}
        onClose={handleSaveReplayComplete}
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
    zIndex: 100,
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
    flexWrap: 'wrap',
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
    zIndex: 100,
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
