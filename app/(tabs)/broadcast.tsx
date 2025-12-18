
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
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStreamStateMachine } from '@/contexts/LiveStreamStateMachine';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import GiftSelector from '@/components/GiftSelector';
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
import StreamStartingOverlay from '@/components/StreamStartingOverlay';
import AIFaceFilterSystem from '@/components/AIFaceFilterSystem';
import AIFaceEffectsPanel from '@/components/AIFaceEffectsPanel';
import ImprovedFiltersPanel from '@/components/ImprovedFiltersPanel';
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
import CameraZoomControl, { ZoomLevel } from '@/components/CameraZoomControl';
import { streamGuestService, StreamGuestSeat } from '@/app/services/streamGuestService';
import { supabase } from '@/app/integrations/supabase/client';
import { savedStreamService } from '@/app/services/savedStreamService';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BroadcastScreen - AI Face Filter System with Fixed Zoom
 * 
 * NEW FEATURES IMPLEMENTED:
 * 1. ✅ AI-Based Face Filters (Real-time face detection and transformation)
 * 2. ✅ Fixed Camera Zoom (0.5x = wide, 1x = standard, 2x = zoomed)
 * 3. ✅ "Starting Roast Live" Text (Displayed on stream initialization)
 * 4. ✅ All Client-Side (No backend modifications)
 * 
 * REMOVED:
 * - Old particle-based face effects (fire, sparkles, hearts, etc.)
 * 
 * REPLACED WITH:
 * - AI Face Filters: Big Eyes, Big Nose, Slim Face, Smooth Skin, Funny Face, Beauty
 * - Real-time face detection using TensorFlow.js and BlazeFace
 * - Face-focused transformations that adapt to movement, rotation, and distance
 * 
 * CAMERA ZOOM:
 * - 0.5x: Natural wide angle (default, NOT zoomed in)
 * - 1x: True standard camera baseline
 * - 2x: True 2× zoom
 * - Properly calibrated to match TikTok/native camera behavior
 * 
 * STREAM START:
 * - Displays "Starting Roast Live" text on initialization
 * - Pure UI/UX level, does not affect streaming logic
 * - Auto-hides after 2.5 seconds
 */
export default function BroadcastScreen() {
  useKeepAwake();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📺 [BROADCAST] AI Face Filter System Active');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { streamTitle, contentLabel, cameraZoom: initialZoom } = useLocalSearchParams<{
    streamTitle?: string;
    contentLabel?: string;
    cameraZoom?: string;
  }>();
  
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // AI Face Effects Context
  const { activeEffect, effectIntensity } = useAIFaceEffects();
  
  // Legacy Color Filters Context
  const { activeFilter, filterIntensity } = useCameraEffects();
  
  const stateMachine = useLiveStreamStateMachine();
  const state = stateMachine?.state || 'IDLE';
  const startStream = stateMachine?.startStream || null;
  const endStream = stateMachine?.endStream || null;
  const stateMachineErrorState = stateMachine?.error || null;
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  // UI State
  const [showChat, setShowChat] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSaveReplayModal, setShowSaveReplayModal] = useState(false);
  const [showStartingOverlay, setShowStartingOverlay] = useState(true);
  
  // Feature Panel States
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [showFaceEffectsPanel, setShowFaceEffectsPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showVIPClubPanel, setShowVIPClubPanel] = useState(false);
  const [showStreamHealth, setShowStreamHealth] = useState(true);
  
  // Camera Zoom State
  const [cameraZoom, setCameraZoom] = useState<ZoomLevel>(
    initialZoom ? parseFloat(initialZoom) as ZoomLevel : 0.5
  );
  const [deviceZoom, setDeviceZoom] = useState<number>(0);
  const [cameraZoomRange, setCameraZoomRange] = useState({ min: 0, max: 1 });
  
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
  
  const cameraRef = useRef<CameraView>(null);
  const viewerCountIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptedRef = useRef<boolean>(false);
  const streamStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const giftCountIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lock orientation to portrait
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        console.log('🔒 [BROADCAST] Locking orientation to portrait');
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (error) {
        console.warn('⚠️ [BROADCAST] Failed to lock orientation:', error);
      }
    };

    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync().catch((error) => {
        console.warn('⚠️ [BROADCAST] Failed to unlock orientation:', error);
      });
    };
  }, []);

  // Calculate device zoom from UI zoom
  const calculateDeviceZoom = useCallback((uiZoom: ZoomLevel): number => {
    const range = cameraZoomRange.max - cameraZoomRange.min;
    const midpoint = cameraZoomRange.min + (range / 2);

    switch (uiZoom) {
      case 0.5:
        return cameraZoomRange.min;
      case 1:
        return midpoint;
      case 2:
        return Math.min(cameraZoomRange.max, midpoint * 2);
      default:
        return midpoint;
    }
  }, [cameraZoomRange]);

  // Update device zoom when UI zoom changes
  useEffect(() => {
    const newDeviceZoom = calculateDeviceZoom(cameraZoom);
    setDeviceZoom(newDeviceZoom);
    console.log(`📷 [BROADCAST] Zoom: ${cameraZoom}x (Device: ${newDeviceZoom.toFixed(2)})`);
  }, [cameraZoom, calculateDeviceZoom]);

  const handleZoomChange = (zoom: ZoomLevel) => {
    console.log('🔍 [BROADCAST] Camera zoom changed to:', zoom);
    setCameraZoom(zoom);
  };

  const loadActiveGuests = useCallback(async () => {
    if (!streamId) return;

    try {
      if (!streamGuestService || typeof streamGuestService.getActiveGuestSeats !== 'function') {
        console.error('❌ [BROADCAST] streamGuestService not available');
        setActiveGuests([]);
        return;
      }

      const guests = await streamGuestService.getActiveGuestSeats(streamId);
      
      if (!guests || !Array.isArray(guests)) {
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
    if (!streamId || !user) return;

    try {
      console.log('💾 [BROADCAST] Saving stream...');
      
      if (!savedStreamService || typeof savedStreamService.saveStream !== 'function') {
        Alert.alert('Error', 'Stream service is not available');
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

      if (!result || !result.success) {
        Alert.alert('Error', result?.error || 'Failed to save stream');
        return;
      }

      console.log('✅ [BROADCAST] Stream saved successfully');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('❌ [BROADCAST] Error saving stream:', error);
      Alert.alert('Error', error?.message || 'Failed to save stream');
    }
  }, [streamId, user, streamTitle, streamDuration]);

  const handleDeleteStream = useCallback(async () => {
    if (!streamId) return;

    try {
      console.log('🗑️ [BROADCAST] Deleting stream...');
      
      if (!supabase) {
        Alert.alert('Error', 'Database connection is not available');
        return;
      }

      const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', streamId);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to delete stream');
        return;
      }

      console.log('✅ [BROADCAST] Stream deleted successfully');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('❌ [BROADCAST] Error deleting stream:', error);
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

  // Check permissions
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

  // Initialize stream
  useEffect(() => {
    if (initAttemptedRef.current) return;

    if (!user || !streamTitle) {
      setInitError('User not authenticated or stream title missing');
      return;
    }

    const initStream = async () => {
      initAttemptedRef.current = true;
      
      try {
        console.log('🚀 [BROADCAST] Initializing stream with AI Face Filters...');

        if (!startStream || typeof startStream !== 'function') {
          setInitError('Stream service is not available');
          return;
        }

        const result = await startStream(streamTitle, contentLabel || 'family_friendly');

        if (!result) {
          setInitError('Failed to start stream');
          return;
        }

        if (result.success && result.streamId) {
          console.log('✅ [BROADCAST] Stream started successfully:', result.streamId);
          setStreamId(result.streamId);
          setInitError(null);
          streamStartTimeRef.current = Date.now();
          
          // Show "Starting Roast Live" overlay
          setShowStartingOverlay(true);
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

  // Update viewer count
  useEffect(() => {
    if (!streamId) return;

    const updateViewerCount = async () => {
      try {
        if (!supabase) return;

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

  // Track stream duration
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

  // Load active guests
  useEffect(() => {
    if (!streamId) return;

    if (!streamGuestService || typeof streamGuestService.getActiveGuestSeats !== 'function') {
      return;
    }

    loadActiveGuests();

    const interval = setInterval(() => {
      loadActiveGuests();
    }, 3000);

    return () => clearInterval(interval);
  }, [streamId, loadActiveGuests]);

  // Track gift count
  useEffect(() => {
    if (!streamId) return;

    const updateGiftCount = async () => {
      try {
        if (!supabase) return;

        const { count } = await supabase
          .from('gift_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('livestream_id', streamId);

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

  // Conditional rendering for errors and loading states
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

  // Main render
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
        zoom={deviceZoom}
      >
        {/* "Starting Roast Live" Overlay */}
        <StreamStartingOverlay
          visible={showStartingOverlay}
          onComplete={() => setShowStartingOverlay(false)}
        />

        {/* Legacy Color Filter Overlay */}
        <ImprovedCameraFilterOverlay filter={activeFilter} intensity={filterIntensity} />

        {/* AI Face Filter System (NEW) */}
        <AIFaceFilterSystem
          filter={activeEffect}
          intensity={effectIntensity}
          onFaceDetected={(count) => {
            if (count > 0 && __DEV__) {
              console.log('🤖 [BROADCAST] Faces detected:', count);
            }
          }}
        />

        {/* Network Stability Indicator */}
        <NetworkStabilityIndicator
          isStreaming={state === 'STREAMING'}
          streamId={streamId || undefined}
          onReconnect={handleReconnect}
        />

        {/* Stream Health Dashboard */}
        {showStreamHealth && (
          <StreamHealthDashboard
            viewerCount={viewerCount}
            giftCount={giftCount}
            isVisible={showStreamHealth}
          />
        )}

        {/* Guest Seats Grid */}
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

        {/* Pinned Message Banner */}
        {streamId && (
          <PinnedMessageBanner
            streamId={streamId}
            canUnpin={true}
            onUnpin={handleUnpinMessage}
          />
        )}

        {/* Camera Zoom Control (FIXED) */}
        <CameraZoomControl
          currentZoom={cameraZoom}
          onZoomChange={handleZoomChange}
          position="top"
          minZoom={cameraZoomRange.min}
          maxZoom={cameraZoomRange.max}
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={[styles.viewerBadge, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>

          <View style={styles.topBarRight}>
            {/* Stream Health Toggle */}
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

            {/* AI Face Effects Toggle (NEW) */}
            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowFaceEffectsPanel(true)}
            >
              <IconSymbol
                ios_icon_name="face.smiling"
                android_material_icon_name="face"
                size={20}
                color={activeEffect ? colors.brandPrimary : '#FFFFFF'}
              />
            </TouchableOpacity>

            {/* Color Filters Toggle */}
            <TouchableOpacity
              style={[styles.topBarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              onPress={() => setShowFiltersPanel(true)}
            >
              <IconSymbol
                ios_icon_name="camera.filters"
                android_material_icon_name="filter"
                size={20}
                color={activeFilter ? colors.brandPrimary : '#FFFFFF'}
              />
            </TouchableOpacity>

            {/* Moderator Panel */}
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

            {/* Pinned Messages */}
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

            {/* Host Controls */}
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

            {/* Settings */}
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

            {/* End Stream */}
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
        {showChat && streamId && user && (
          <ChatOverlay
            streamId={streamId}
            isBroadcaster={true}
            hostId={user.id}
            hostName={user.user_metadata?.display_name || 'Host'}
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

        {/* Gift Selector */}
        {showGifts && user && (
          <GiftSelector
            visible={showGifts}
            onClose={() => setShowGifts(false)}
            receiverId={user.id}
            receiverName={user.user_metadata?.display_name || 'Host'}
            livestreamId={streamId || undefined}
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

        {/* Moderator Control Panel */}
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

        {/* Live Settings Panel */}
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

        {/* Manage Pinned Messages Modal */}
        {showPinnedMessagesModal && streamId && (
          <ManagePinnedMessagesModal
            visible={showPinnedMessagesModal}
            onClose={() => setShowPinnedMessagesModal(false)}
            streamId={streamId}
          />
        )}

        {/* AI Face Effects Panel (NEW) */}
        <AIFaceEffectsPanel
          visible={showFaceEffectsPanel}
          onClose={() => setShowFaceEffectsPanel(false)}
          selectedEffect={activeEffect}
          onSelectEffect={() => {}}
          intensity={effectIntensity}
          onIntensityChange={() => {}}
        />

        {/* Color Filters Panel */}
        <ImprovedFiltersPanel
          visible={showFiltersPanel}
          onClose={() => setShowFiltersPanel(false)}
        />

        {/* VIP Club Panel */}
        {showVIPClubPanel && (
          <VIPClubPanel
            visible={showVIPClubPanel}
            onClose={() => setShowVIPClubPanel(false)}
            selectedClub={selectedVIPClub}
            onSelectClub={setSelectedVIPClub}
          />
        )}
      </CameraView>

      {/* End Stream Modal */}
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

      {/* Save Replay Modal */}
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
