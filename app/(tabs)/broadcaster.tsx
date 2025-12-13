
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform, BackHandler, AppState, AppStateStatus } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { router } from 'expo-router';

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
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import ContentLabelBadge from '@/components/ContentLabelBadge';
import CreatorRulesModal from '@/components/CreatorRulesModal';
import SafetyAcknowledgementModal from '@/components/SafetyAcknowledgementModal';
import ForcedReviewLockModal from '@/components/ForcedReviewLockModal';

import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';
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

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');

  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [isLive, setIsLive] = useState(false);
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);

  const [viewerCount, setViewerCount] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(true);

  // Content safety state
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showCreatorRulesModal, setShowCreatorRulesModal] = useState(false);
  const [showSafetyAcknowledgement, setShowSafetyAcknowledgement] = useState(false);
  const [showForcedReviewLock, setShowForcedReviewLock] = useState(false);
  const [forcedReviewReportCount, setForcedReviewReportCount] = useState(0);
  const [isCheckingSafety, setIsCheckingSafety] = useState(true);

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const streamStartTime = useRef<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

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
    console.log('🎬 BroadcasterScreen mounted');

    if (!user) {
      router.replace('/auth/login');
    } else {
      checkSafetyStatus();
    }

    return () => {
      isMountedRef.current = false;
      console.log('🎬 BroadcasterScreen unmounted');
    };
  }, [user]);

  /* ───────────────── SAFETY CHECK ───────────────── */
  const checkSafetyStatus = async () => {
    if (!user || !isMountedRef.current) return;

    setIsCheckingSafety(true);

    try {
      // Check if user has accepted safety guidelines
      const hasAcknowledgement = await enhancedContentSafetyService.hasSafetyAcknowledgement(user.id);
      
      if (!hasAcknowledgement && isMountedRef.current) {
        setShowSafetyAcknowledgement(true);
        setIsCheckingSafety(false);
        return;
      }

      // Check if user is under forced review lock
      const isLocked = await enhancedContentSafetyService.isUserLockedForReview(user.id);
      
      if (isLocked && isMountedRef.current) {
        const lock = await enhancedContentSafetyService.getForcedReviewLock(user.id);
        if (lock) {
          setForcedReviewReportCount(lock.report_count);
          setShowForcedReviewLock(true);
        }
      }
    } catch (error) {
      console.error('Error checking safety status:', error);
    } finally {
      if (isMountedRef.current) {
        setIsCheckingSafety(false);
      }
    }
  };

  const handleSafetyAcknowledgement = async () => {
    if (!user || !isMountedRef.current) return;

    setLoading(true);

    try {
      const result = await enhancedContentSafetyService.recordSafetyAcknowledgement(user.id);
      
      if (result.success && isMountedRef.current) {
        setShowSafetyAcknowledgement(false);
        Alert.alert(
          'Welcome!',
          'You can now use all features of Roast Live. Remember to follow our community guidelines!',
          [{ text: 'OK' }]
        );
      } else if (isMountedRef.current) {
        Alert.alert('Error', result.error || 'Failed to record acknowledgement');
      }
    } catch (error) {
      console.error('Error recording safety acknowledgement:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to record acknowledgement');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
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

  /* ───────────────── START STREAM FLOW ───────────────── */
  const handleGoLivePress = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    if (isLive) {
      setShowExitConfirmation(true);
      return;
    }

    try {
      // Check if user is under forced review lock
      const isLocked = await enhancedContentSafetyService.isUserLockedForReview(user.id);
      if (isLocked) {
        const lock = await enhancedContentSafetyService.getForcedReviewLock(user.id);
        if (lock && isMountedRef.current) {
          setForcedReviewReportCount(lock.report_count);
          setShowForcedReviewLock(true);
        }
        return;
      }

      // Check if user has accepted safety guidelines
      const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
      if (!canStream.canStream) {
        Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
        if (isMountedRef.current) {
          setShowSafetyAcknowledgement(true);
        }
        return;
      }

      // Show setup modal
      if (isMountedRef.current) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error in handleGoLivePress:', error);
      Alert.alert('Error', 'Failed to start live setup. Please try again.');
    }
  };

  const startStreamSetup = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a stream title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    try {
      // Validate stream start (check for suspensions and strikes)
      const validation = await contentSafetyService.validateStreamStart(user.id);
      if (!validation.canStream) {
        Alert.alert(
          'Cannot Start Stream',
          validation.reason || 'You are not allowed to stream at this time.',
          [{ text: 'OK' }]
        );
        if (isMountedRef.current) {
          setShowSetup(false);
        }
        return;
      }

      // Show content label selection modal
      if (isMountedRef.current) {
        setShowContentLabelModal(true);
      }
    } catch (error) {
      console.error('Error in startStreamSetup:', error);
      Alert.alert('Error', 'Failed to validate stream start. Please try again.');
    }
  };

  const handleContentLabelSelected = (label: ContentLabel) => {
    if (isMountedRef.current) {
      setContentLabel(label);
      setShowContentLabelModal(false);
      // Show creator rules modal
      setShowCreatorRulesModal(true);
    }
  };

  const handleCreatorRulesConfirm = async () => {
    if (!user || !isMountedRef.current) return;

    setLoading(true);

    try {
      // Log creator rules acceptance
      const result = await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
      
      if (!result.success) {
        console.error('Failed to log creator rules acceptance:', result.error);
        // Continue anyway - don't block streaming
      }

      if (isMountedRef.current) {
        setShowCreatorRulesModal(false);
      }
      
      // Now start the stream
      await startLiveWithLabel(contentLabel!);
    } catch (error) {
      console.error('Error in handleCreatorRulesConfirm:', error);
      if (isMountedRef.current) {
        setShowCreatorRulesModal(false);
      }
      await startLiveWithLabel(contentLabel!);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const startLiveWithLabel = async (label: ContentLabel) => {
    if (!user || !isMountedRef.current) return;

    setLoading(true);

    try {
      console.log('🎬 Starting live stream with title:', streamTitle, 'and label:', label);
      
      const result = await cloudflareService.startLive({ 
        title: streamTitle, 
        userId: user.id 
      });

      console.log('✅ Stream created successfully:', result);

      if (!result.stream) {
        throw new Error('No stream data returned from server');
      }

      // Set content label on stream
      await contentSafetyService.setStreamContentLabel(result.stream.id, label);

      // Create archive record
      const startTime = new Date().toISOString();
      streamStartTime.current = startTime;
      const archiveResult = await liveStreamArchiveService.createArchive(
        user.id,
        streamTitle,
        startTime
      );

      if (archiveResult.success && archiveResult.data && isMountedRef.current) {
        setArchiveId(archiveResult.data.id);
        console.log('📦 Stream archive created:', archiveResult.data.id);
      }

      if (isMountedRef.current) {
        setCurrentStream(result.stream);
        setIsLive(true);
        setIsStreaming(true);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setLiveSeconds(0);
        setShowSetup(false);
        setStreamTitle('');
      }

      startStreamTimer();

      console.log('📺 Stream details:', {
        id: result.stream.id,
        live_input_id: result.stream.live_input_id,
        playback_url: result.stream.playback_url,
      });

      Alert.alert(
        '🔴 You are LIVE!',
        `Your stream is now broadcasting!\n\nStream ID: ${result.stream.id}\n\nViewers can watch you live!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to start stream. Please try again.';
      
      Alert.alert(
        'Cannot Start Stream',
        errorMessage,
        [
          { text: 'Retry', onPress: () => startLiveWithLabel(label) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  /* ───────────────── END STREAM ───────────────── */
  const endLive = async () => {
    if (!currentStream) {
      Alert.alert('Error', 'No active stream to end');
      return;
    }

    setLoading(true);

    try {
      console.log('🛑 Ending stream:', {
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });
      
      // Stop reconnection attempts
      stopReconnect();

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
        setContentLabel(null);
        streamStartTime.current = null;
      }

      Alert.alert(
        'Stream Ended',
        `Your live stream has been ended successfully.\n\n📊 Stats:\n• Peak Viewers: ${peakViewers}\n• Total Viewers: ${totalViewerCount}\n• Total Gifts: ${totalGifts}\n• Duration: ${formatTime(liveSeconds)}`
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
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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

  /* ───────────────── RENDER ───────────────── */

  // Show safety acknowledgement modal if needed
  if (showSafetyAcknowledgement) {
    return (
      <View style={commonStyles.container}>
        <SafetyAcknowledgementModal
          visible={showSafetyAcknowledgement}
          onAccept={handleSafetyAcknowledgement}
          isLoading={loading}
        />
      </View>
    );
  }

  // Show forced review lock modal if needed
  if (showForcedReviewLock) {
    return (
      <View style={commonStyles.container}>
        <ForcedReviewLockModal
          visible={showForcedReviewLock}
          onClose={() => {
            if (isMountedRef.current) {
              setShowForcedReviewLock(false);
            }
            router.back();
          }}
          reportCount={forcedReviewReportCount}
        />
      </View>
    );
  }

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
                {contentLabel && (
                  <ContentLabelBadge label={contentLabel} size="small" />
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
            {contentLabel && (contentLabel === 'roast_mode' || contentLabel === 'adult_only') && (
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

        {/* NOT LIVE - Center Content */}
        {!isLive && (
          <View style={styles.centerContent}>
            <AppLogo size="large" alignment="center" />
            <Text style={styles.welcomeText}>Ready to go live?</Text>
          </View>
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
        {isLive ? (
          <View style={styles.liveControls}>
            <TouchableOpacity
              style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
              onPress={toggleMic}
              disabled={loading}
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
              disabled={loading}
              size="large"
            />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                android_material_icon_name="flip_camera_ios"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <GradientButton
            title="GO LIVE"
            onPress={handleGoLivePress}
            disabled={loading || isCheckingSafety}
            size="large"
          />
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

      {/* CONTENT LABEL MODAL */}
      <ContentLabelModal
        visible={showContentLabelModal}
        onSelect={handleContentLabelSelected}
        onCancel={() => {
          if (isMountedRef.current) {
            setShowContentLabelModal(false);
            setShowSetup(false);
          }
        }}
      />

      {/* CREATOR RULES MODAL */}
      <CreatorRulesModal
        visible={showCreatorRulesModal}
        onConfirm={handleCreatorRulesConfirm}
        onCancel={() => {
          if (isMountedRef.current) {
            setShowCreatorRulesModal(false);
            setShowSetup(false);
          }
        }}
        isLoading={loading}
      />

      {/* SETUP MODAL */}
      <Modal visible={showSetup} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <AppLogo size="medium" alignment="center" style={styles.modalLogo} />
            <Text style={styles.modalTitle}>Setup Your Stream</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Stream Title</Text>
              <TextInput
                placeholder="What are you streaming?"
                placeholderTextColor={colors.textSecondary}
                value={streamTitle}
                onChangeText={setStreamTitle}
                style={styles.input}
                maxLength={100}
                autoFocus
                editable={!loading}
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.infoText}>
                Your stream will be broadcast live to all viewers. Make sure you have a stable internet connection!
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (isMountedRef.current) {
                    setShowSetup(false);
                    setStreamTitle('');
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.startButtonContainer}>
                <GradientButton
                  title={loading ? 'STARTING...' : 'START LIVE'}
                  onPress={startStreamSetup}
                  disabled={loading}
                  size="medium"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitConfirmation} transparent animationType="fade">
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
      </Modal>
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
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 180,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
  },
  modalLogo: {
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  startButtonContainer: {
    flex: 1,
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
