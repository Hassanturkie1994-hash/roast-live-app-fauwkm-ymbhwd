
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, BackHandler, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import GiftAnimationOverlay from '@/components/GiftAnimationOverlay';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';
import StreamHealthDashboard from '@/components/StreamHealthDashboard';
import ViewerListModal from '@/components/ViewerListModal';
import ContentLabelBadge from '@/components/ContentLabelBadge';
import { ContentLabel } from '@/components/ContentLabelModal';

import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { contentSafetyService } from '@/app/services/contentSafetyService';
import { viewerTrackingService } from '@/app/services/viewerTrackingService';
import { liveStreamArchiveService } from '@/app/services/liveStreamArchiveService';
import { useStreamConnection } from '@/hooks/useStreamConnection';

interface StreamData {
  id: string;
  live_input_id: string;
  title: string;
  status: string;
  playback_url: string;
}

interface GiftAnimation {
  id: string;
  giftName: string;
  giftEmoji: string;
  senderUsername: string;
  amount: number;
  tier: 'A' | 'B' | 'C';
}

export default function BroadcasterScreen() {
  const { user } = useAuth();
  const { setIsStreaming, startStreamTimer, stopStreamTimer } = useStreaming();
  
  // Get params from navigation
  const params = useLocalSearchParams<{
    streamTitle?: string;
    contentLabel?: ContentLabel;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');

  // Stream creation states
  const [isCreatingStream, setIsCreatingStream] = useState(true);
  const [streamCreationError, setStreamCreationError] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);

  // Live stream states
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);

  // Camera controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // UI states
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(true);

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const streamStartTime = useRef<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

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
      console.log('✅ Stream reconnected successfully');
    },
    onReconnectFailed: () => {
      console.log('❌ Stream reconnection failed, ending stream');
      endLive();
    },
  });

  /* ───────────────── MOUNT / AUTH GUARD ───────────────── */
  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 BroadcasterScreen mounted with params:', params);

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Start stream creation immediately on mount
    if (params.streamTitle && params.contentLabel) {
      createStreamOnMount();
    } else {
      console.error('❌ Missing required params:', { streamTitle: params.streamTitle, contentLabel: params.contentLabel });
      setStreamCreationError('Missing stream information. Please try again.');
      setIsCreatingStream(false);
    }

    return () => {
      isMountedRef.current = false;
      console.log('🎬 BroadcasterScreen unmounted');
      // Deactivate keep awake when component unmounts
      try {
        deactivateKeepAwake();
        console.log('💤 Keep awake deactivated on unmount');
      } catch (error) {
        console.warn('⚠️ Failed to deactivate keep awake on unmount:', error);
      }
    };
  }, [user]);

  /* ───────────────── STREAM CREATION ON MOUNT ───────────────── */
  const createStreamOnMount = async () => {
    if (!user || !params.streamTitle || !params.contentLabel) {
      console.error('❌ Cannot create stream: missing required data');
      setStreamCreationError('Missing required information');
      setIsCreatingStream(false);
      return;
    }

    console.log('🎬 [STREAM-CREATE-1] Starting stream creation...');
    console.log('📝 [STREAM-CREATE-1] Title:', params.streamTitle);
    console.log('🏷️ [STREAM-CREATE-1] Label:', params.contentLabel);

    try {
      // STEP 1: Activate keep awake (non-blocking)
      console.log('💤 [STREAM-CREATE-2] Attempting to activate keep awake...');
      try {
        await activateKeepAwakeAsync();
        console.log('✅ [STREAM-CREATE-2] Keep awake activated successfully');
      } catch (keepAwakeError) {
        console.warn('⚠️ [STREAM-CREATE-2] KeepAwake failed (continuing anyway):', keepAwakeError);
      }

      // STEP 2: Create Cloudflare stream
      console.log('📡 [STREAM-CREATE-3] Calling cloudflareService.startLive...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stream creation timed out after 30 seconds')), 30000);
      });
      
      const streamPromise = cloudflareService.startLive({ 
        title: params.streamTitle, 
        userId: user.id 
      });
      
      const result = await Promise.race([streamPromise, timeoutPromise]) as any;

      console.log('✅ [STREAM-CREATE-3] cloudflareService.startLive response received');

      if (!result.success || !result.stream || !result.stream.id) {
        throw new Error(result.error || 'Failed to create stream');
      }

      // STEP 3: Set content label
      console.log('📝 [STREAM-CREATE-4] Setting content label on stream...');
      try {
        await contentSafetyService.setStreamContentLabel(result.stream.id, params.contentLabel);
        console.log('✅ [STREAM-CREATE-4] Content label set successfully');
      } catch (labelError) {
        console.error('⚠️ [STREAM-CREATE-4] Failed to set content label (continuing anyway):', labelError);
      }

      // STEP 4: Create archive record
      console.log('📦 [STREAM-CREATE-5] Creating archive record...');
      const startTime = new Date().toISOString();
      streamStartTime.current = startTime;
      
      try {
        const archiveResult = await liveStreamArchiveService.createArchive(
          user.id,
          params.streamTitle,
          startTime
        );

        if (archiveResult.success && archiveResult.data && isMountedRef.current) {
          setArchiveId(archiveResult.data.id);
          console.log('✅ [STREAM-CREATE-5] Stream archive created:', archiveResult.data.id);
        }
      } catch (archiveError) {
        console.error('⚠️ [STREAM-CREATE-5] Error creating archive (continuing anyway):', archiveError);
      }

      // STEP 5: Update UI state
      console.log('🎉 [STREAM-CREATE-6] Setting stream state in UI...');
      if (isMountedRef.current) {
        setCurrentStream(result.stream);
        setIsLive(true);
        setIsStreaming(true);
        setIsCreatingStream(false);
        setStreamCreationError(null);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setLiveSeconds(0);
        console.log('✅ [STREAM-CREATE-6] Stream state updated successfully');
      }

      startStreamTimer();

      console.log('📺 [STREAM-CREATE-7] Stream details:', {
        id: result.stream.id,
        live_input_id: result.stream.live_input_id,
        playback_url: result.stream.playback_url,
      });

      console.log('🎊 [STREAM-CREATE-8] Stream creation complete!');
    } catch (error) {
      console.error('❌ [STREAM-CREATE-ERROR] Error creating stream:', error);
      
      let errorMessage = 'Failed to start stream. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('timed out')) {
          errorMessage = 'Stream creation timed out. Please check your internet connection and try again.';
        } else if (errorMessage.includes('Missing Cloudflare credentials')) {
          errorMessage = 'Server configuration error. Please contact support.';
        } else if (errorMessage.includes('Cloudflare API error')) {
          errorMessage = 'Failed to create stream on Cloudflare. Please try again.';
        }
      }
      
      if (isMountedRef.current) {
        setStreamCreationError(errorMessage);
        setIsCreatingStream(false);
      }
    }
  };

  /* ───────────────── PERMISSIONS ───────────────── */
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  /* ───────────────── BACK BUTTON HANDLER ───────────────── */
  useEffect(() => {
    if (isLive && Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('🚫 Back button pressed during livestream - showing confirmation');
        setShowExitConfirmation(true);
        return true;
      });

      return () => backHandler.remove();
    }
  }, [isLive]);

  /* ───────────────── LIVE TIMER ───────────────── */
  useEffect(() => {
    if (!isLive) return;

    timerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setLiveSeconds((s) => s + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  /* ───────────────── VIEWER COUNT SUBSCRIPTION ───────────────── */
  const subscribeViewers = useCallback((streamId: string) => {
    if (!isMountedRef.current) return;

    console.log('🔌 Subscribing to viewer updates:', `stream:${streamId}:broadcaster`);

    const channel = supabase
      .channel(`stream:${streamId}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('👥 Viewer count update:', payload);
        
        if (!isMountedRef.current) return;
        
        const count = payload.payload?.count ?? 0;
        setViewerCount(count);
        setPeakViewers(prev => count > prev ? count : prev);
      })
      .subscribe((status) => {
        console.log('📡 Viewer channel subscription status:', status);
      });

    realtimeRef.current = channel;
  }, []);

  /* ───────────────── GIFT SUBSCRIPTION ───────────────── */
  const subscribeToGifts = useCallback((streamId: string) => {
    if (!isMountedRef.current) return;

    console.log('🔌 Subscribing to gifts:', `stream:${streamId}:gifts`);

    const channel = supabase
      .channel(`stream:${streamId}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 Gift received:', payload);
        
        if (!isMountedRef.current) return;
        
        const giftData = payload.payload;
        
        const newAnimation: GiftAnimation = {
          id: `${Date.now()}-${Math.random()}`,
          giftName: giftData.gift_name,
          giftEmoji: giftData.gift_emoji || '🎁',
          senderUsername: giftData.sender_username,
          amount: giftData.amount,
          tier: giftData.tier || 'A',
        };
        
        setGiftAnimations((prev) => [...prev, newAnimation]);
        setTotalGifts((prev) => prev + 1);
      })
      .subscribe((status) => {
        console.log('📡 Gift channel subscription status:', status);
      });

    giftChannelRef.current = channel;
  }, []);

  useEffect(() => {
    if (isLive && currentStream?.id && isMountedRef.current) {
      console.log('🚀 Initializing Realtime channels for stream:', currentStream.id);
      subscribeViewers(currentStream.id);
      subscribeToGifts(currentStream.id);
    }
    
    return () => {
      if (realtimeRef.current) {
        console.log('🔌 Unsubscribing from viewer channel');
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      if (giftChannelRef.current) {
        console.log('🔌 Unsubscribing from gift channel');
        supabase.removeChannel(giftChannelRef.current);
        giftChannelRef.current = null;
      }
    };
  }, [isLive, currentStream?.id, subscribeViewers, subscribeToGifts]);

  const handleAnimationComplete = (animationId: string) => {
    if (isMountedRef.current) {
      setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
    }
  };

  const cleanupRealtime = () => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    if (giftChannelRef.current) {
      supabase.removeChannel(giftChannelRef.current);
      giftChannelRef.current = null;
    }
  };

  /* ───────────────── END STREAM ───────────────── */
  const endLive = async () => {
    if (!currentStream) {
      Alert.alert('Error', 'No active stream to end');
      return;
    }

    try {
      console.log('🛑 Ending stream:', {
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });
      
      // Stop reconnection attempts
      stopReconnect();

      // Deactivate keep awake
      try {
        deactivateKeepAwake();
        console.log('💤 Keep awake deactivated');
      } catch (keepAwakeError) {
        console.warn('⚠️ Failed to deactivate keep awake:', keepAwakeError);
      }

      // Get total unique viewers
      const totalViewerCount = await viewerTrackingService.getTotalViewerCount(currentStream.id);
      if (isMountedRef.current) {
        setTotalViewers(totalViewerCount);
      }

      // Clean up viewer sessions
      await viewerTrackingService.cleanupStreamViewers(currentStream.id);

      // Update archive with final metrics
      if (archiveId && streamStartTime.current) {
        const endTime = new Date().toISOString();
        const duration = liveStreamArchiveService.calculateDuration(
          streamStartTime.current,
          endTime
        );

        await liveStreamArchiveService.updateArchive(archiveId, {
          ended_at: endTime,
          viewer_peak: peakViewers,
          total_viewers: totalViewerCount,
          stream_duration_s: duration,
          archived_url: currentStream.playback_url,
        });

        console.log('📦 Stream archive updated with metrics:', {
          duration,
          peakViewers,
          totalViewers: totalViewerCount,
        });
      }

      await cloudflareService.stopLive({
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });

      console.log('✅ Stream ended successfully');

      // Stop stream timer and update database
      if (user) {
        await stopStreamTimer(user.id);
      }

      cleanupRealtime();

      if (isMountedRef.current) {
        setIsLive(false);
        setIsStreaming(false);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setLiveSeconds(0);
        setCurrentStream(null);
        setGiftAnimations([]);
        setArchiveId(null);
        streamStartTime.current = null;
      }

      Alert.alert(
        'Stream Ended',
        `Your live stream has been ended successfully.\n\n📊 Stats:\n• Peak Viewers: ${peakViewers}\n• Total Viewers: ${totalViewerCount}\n• Total Gifts: ${totalGifts}\n• Duration: ${formatTime(liveSeconds)}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to end stream. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Retry', onPress: endLive },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ───────────────── CAMERA CONTROLS ───────────────── */
  const toggleCameraFacing = () => {
    console.log('📷 Switching camera');
    if (isMountedRef.current) {
      setFacing((current) => (current === 'back' ? 'front' : 'back'));
      if (facing === 'back') {
        setFlashMode('off');
      }
    }
  };

  const toggleFlash = () => {
    if (facing === 'back') {
      console.log('💡 Toggling flash');
      if (isMountedRef.current) {
        setFlashMode((current) => (current === 'off' ? 'on' : 'off'));
      }
    } else {
      Alert.alert('Flash Unavailable', 'Flash is only available when using the back camera.');
    }
  };

  const toggleCamera = () => {
    console.log('📹 Toggling camera on/off');
    if (isMountedRef.current) {
      setIsCameraOn((current) => !current);
    }
  };

  const toggleMic = () => {
    console.log('🎤 Toggling microphone');
    if (isMountedRef.current) {
      setIsMicOn((current) => !current);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying stream creation...');
    setStreamCreationError(null);
    setIsCreatingStream(true);
    createStreamOnMount();
  };

  const handleCancel = () => {
    console.log('❌ Cancelling stream creation...');
    setIsStreaming(false);
    router.back();
  };

  /* ───────────────── RENDER ───────────────── */

  if (!permission?.granted) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.permissionText}>We need your permission to use the camera</Text>
          <GradientButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  // Show loading state while creating stream
  if (isCreatingStream) {
    return (
      <View style={commonStyles.container}>
        {/* Camera preview in background */}
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing={facing}
        />
        
        {/* Loading overlay */}
        <View style={styles.loadingOverlay}>
          <AppLogo size="large" alignment="center" />
          <ActivityIndicator size="large" color={colors.gradientEnd} style={styles.loadingSpinner} />
          <Text style={styles.loadingTitle}>You are going live...</Text>
          <Text style={styles.loadingSubtitle}>Setting up your stream</Text>
          <View style={styles.loadingSteps}>
            <Text style={styles.loadingStep}>✓ Camera ready</Text>
            <Text style={styles.loadingStep}>⏳ Creating stream...</Text>
            <Text style={styles.loadingStep}>⏳ Connecting to server...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show error state if stream creation failed
  if (streamCreationError) {
    return (
      <View style={commonStyles.container}>
        {/* Camera preview in background */}
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing={facing}
        />
        
        {/* Error overlay */}
        <View style={styles.errorOverlay}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="error"
            size={64}
            color={colors.gradientEnd}
          />
          <Text style={styles.errorTitle}>Failed to Start Stream</Text>
          <Text style={styles.errorMessage}>{streamCreationError}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.errorCancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.errorCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.errorRetryButton}>
              <GradientButton
                title="Retry"
                onPress={handleRetry}
                size="medium"
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* CAMERA LAYER */}
      {isCameraOn ? (
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing={facing}
          flash={flashMode}
        />
      ) : (
        <View style={styles.cameraOffContainer}>
          <IconSymbol
            ios_icon_name="video.slash.fill"
            android_material_icon_name="videocam_off"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.cameraOffText}>Camera Off — Stream Still Active</Text>
        </View>
      )}

      {/* OVERLAY LAYER - z-index 50 */}
      <View style={styles.overlay} pointerEvents="box-none">
        {isLive && currentStream && (
          <>
            {/* Connection Status */}
            <ConnectionStatusIndicator
              status={connectionStatus}
              attemptNumber={reconnectAttempt}
              maxAttempts={6}
            />

            {/* Top Bar */}
            <View style={styles.topBar}>
              <View style={styles.topLeft}>
                <AppLogo size={80} opacity={0.35} alignment="left" />
                <LiveBadge size="small" />
                {params.contentLabel && (
                  <ContentLabelBadge label={params.contentLabel} size="small" />
                )}
              </View>
              <View style={styles.statsContainer}>
                <TouchableOpacity 
                  style={styles.stat}
                  onPress={() => setShowViewerList(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.statText}>{viewerCount}</Text>
                </TouchableOpacity>
                <View style={styles.stat}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.statText}>{formatTime(liveSeconds)}</Text>
                </View>
              </View>
            </View>

            {/* Content Warning Banner */}
            {params.contentLabel && (params.contentLabel === 'roast_mode' || params.contentLabel === 'adult_only') && (
              <View style={styles.warningBanner}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={14}
                  color={colors.text}
                />
                <Text style={styles.warningText}>Viewer discretion advised</Text>
              </View>
            )}

            {/* Stream Health Dashboard */}
            <StreamHealthDashboard
              viewerCount={viewerCount}
              giftCount={totalGifts}
              isVisible={showHealthDashboard}
            />

            {/* Chat Overlay - ALWAYS RENDERED when live */}
            <ChatOverlay
              streamId={currentStream.id}
              isBroadcaster={true}
              streamDelay={0}
            />
          </>
        )}
      </View>

      {/* GIFT ANIMATIONS - z-index 100 */}
      {giftAnimations.map((animation) => (
        <GiftAnimationOverlay
          key={animation.id}
          giftName={animation.giftName}
          giftEmoji={animation.giftEmoji}
          senderUsername={animation.senderUsername}
          amount={animation.amount}
          tier={animation.tier}
          onAnimationComplete={() => handleAnimationComplete(animation.id)}
        />
      ))}

      {/* CONTROLS - POSITIONED HIGHER TO AVOID TAB BAR - z-index 150 */}
      <View style={styles.controlsWrapper}>
        {isLive && (
          <View style={styles.liveControls}>
            <TouchableOpacity
              style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
              onPress={toggleMic}
            >
              <IconSymbol
                ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
                android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <GradientButton
              title="END LIVE"
              onPress={() => setShowExitConfirmation(true)}
              size="large"
            />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <IconSymbol
                ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                android_material_icon_name="flip_camera_ios"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* VIEWER LIST MODAL */}
      {currentStream && user && (
        <ViewerListModal
          visible={showViewerList}
          onClose={() => setShowViewerList(false)}
          streamId={currentStream.id}
          viewerCount={viewerCount}
          streamerId={user.id}
          currentUserId={user.id}
          isStreamer={true}
          isModerator={false}
        />
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirmation && (
        <View style={styles.modal}>
          <View style={styles.confirmationModal}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.confirmationTitle}>End Livestream?</Text>
            <Text style={styles.confirmationText}>
              Are you sure you want to end the stream?{'\n\n'}Your viewers will be disconnected.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowExitConfirmation(false)}
              >
                <Text style={styles.confirmationCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.confirmationEndButton}>
                <GradientButton
                  title="End Stream"
                  onPress={() => {
                    setShowExitConfirmation(false);
                    endLive();
                  }}
                  size="medium"
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 20,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingSteps: {
    marginTop: 20,
    gap: 12,
  },
  loadingStep: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  errorCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  errorCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  errorRetryButton: {
    flex: 1,
  },
  cameraOffContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
  },
  cameraOffText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingHorizontal: 20,
    zIndex: 60,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    zIndex: 60,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 150,
  },
  liveControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    width: '100%',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  controlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.7)',
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 200,
  },
  confirmationModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmationCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmationCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  confirmationEndButton: {
    flex: 1,
  },
});
