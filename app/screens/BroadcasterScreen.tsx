
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform, BackHandler, AppState, AppStateStatus } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { router } from 'expo-router';
import GiftAnimationOverlay from '@/components/GiftAnimationOverlay';
import LiveStreamControlPanel from '@/components/LiveStreamControlPanel';
import ViewerListModal from '@/components/ViewerListModal';
import CameraFilterSelector, { CameraFilter } from '@/components/CameraFilterSelector';
import EnhancedChatOverlay from '@/components/EnhancedChatOverlay';
import ModeratorChatOverlay from '@/components/ModeratorChatOverlay';
import ModeratorControlPanel from '@/components/ModeratorControlPanel';
import StreamHealthDashboard from '@/components/StreamHealthDashboard';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';
import ModerationHistoryModal from '@/components/ModerationHistoryModal';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import ContentLabelBadge from '@/components/ContentLabelBadge';
import CreatorRulesModal from '@/components/CreatorRulesModal';
import SafetyAcknowledgementModal from '@/components/SafetyAcknowledgementModal';
import ForcedReviewLockModal from '@/components/ForcedReviewLockModal';
import HostControlDashboard from '@/components/HostControlDashboard';
import HostControlButton from '@/components/HostControlButton';
import { moderationService } from '@/app/services/moderationService';
import { viewerTrackingService } from '@/app/services/viewerTrackingService';
import { liveStreamArchiveService } from '@/app/services/liveStreamArchiveService';
import { commentService } from '@/app/services/commentService';
import { contentSafetyService } from '@/app/services/contentSafetyService';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';
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
  const { setIsStreaming } = useStreaming();
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<CameraFilter>('none');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [showHealthDashboard, setShowHealthDashboard] = useState(true);
  const [totalGifts, setTotalGifts] = useState(0);
  const [showModerationHistory, setShowModerationHistory] = useState(false);
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  
  // New state for enhanced safety features
  const [showCreatorRulesModal, setShowCreatorRulesModal] = useState(false);
  const [showSafetyAcknowledgement, setShowSafetyAcknowledgement] = useState(false);
  const [showForcedReviewLock, setShowForcedReviewLock] = useState(false);
  const [forcedReviewReportCount, setForcedReviewReportCount] = useState(0);
  const [isCheckingSafety, setIsCheckingSafety] = useState(true);
  
  // Host Control Dashboard state
  const [showHostControlDashboard, setShowHostControlDashboard] = useState(false);
  
  const realtimeChannelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const streamStartTime = useRef<string | null>(null);
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
      endStream();
    },
  });

  // Check safety acknowledgement and forced review lock on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user) {
      checkSafetyStatus();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user]);

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

    setIsLoading(true);

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
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  // Handle back button press when streaming
  useEffect(() => {
    if (isLive) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('🚫 Back button pressed during livestream - showing confirmation');
        setShowExitConfirmation(true);
        return true;
      });

      return () => backHandler.remove();
    }
  }, [isLive]);

  // Handle multitask mode (app minimization)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (isLive) {
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          console.log('📱 App minimized - enabling floating thumbnail mode');
          if (isMountedRef.current) {
            setIsMinimized(true);
          }
        } else if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('📱 App restored - disabling floating thumbnail mode');
          if (isMountedRef.current) {
            setIsMinimized(false);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isLive]);

  useEffect(() => {
    if (isLive) {
      timerIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setLiveTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isLive]);

  const subscribeToViewerUpdates = useCallback(() => {
    if (!currentStream?.id || !isMountedRef.current) return;

    const channel = supabase
      .channel(`stream:${currentStream.id}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('👥 Viewer count update:', payload);
        const count = payload.payload.count || 0;
        
        if (isMountedRef.current) {
          setViewerCount(count);
          
          // Track peak viewers
          setPeakViewers(prev => count > prev ? count : prev);
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [currentStream?.id]);

  const subscribeToGifts = useCallback(() => {
    if (!currentStream?.id || !isMountedRef.current) return;

    const channel = supabase
      .channel(`stream:${currentStream.id}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 Gift received:', payload);
        const giftData = payload.payload;
        
        const newAnimation: GiftAnimation = {
          id: `${Date.now()}-${Math.random()}`,
          giftName: giftData.gift_name,
          giftEmoji: giftData.gift_emoji || '🎁',
          senderUsername: giftData.sender_username,
          amount: giftData.amount,
          tier: giftData.tier || 'A',
        };
        
        if (isMountedRef.current) {
          setGiftAnimations((prev) => [...prev, newAnimation]);
          setTotalGifts((prev) => prev + 1);
        }
      })
      .subscribe();

    giftChannelRef.current = channel;
  }, [currentStream?.id]);

  useEffect(() => {
    if (isLive && currentStream?.id) {
      subscribeToViewerUpdates();
      subscribeToGifts();
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (giftChannelRef.current) {
        supabase.removeChannel(giftChannelRef.current);
        giftChannelRef.current = null;
      }
    };
  }, [isLive, currentStream?.id, subscribeToViewerUpdates, subscribeToGifts]);

  const handleAnimationComplete = (animationId: string) => {
    if (isMountedRef.current) {
      setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="video.fill"
          android_material_icon_name="videocam"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need your permission to use the camera
        </Text>
        <GradientButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    console.log('📷 Switching camera without restarting stream');
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

  const handleStartLiveSetup = async () => {
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

      if (isMountedRef.current) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error in handleStartLiveSetup:', error);
      Alert.alert('Error', 'Failed to start live setup. Please try again.');
    }
  };

  const handleEndStreamConfirm = () => {
    if (isMountedRef.current) {
      setShowExitConfirmation(false);
    }
    endStream();
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

    setIsLoading(true);

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
      await startStreamWithLabel(contentLabel!);
    } catch (error) {
      console.error('Error in handleCreatorRulesConfirm:', error);
      if (isMountedRef.current) {
        setShowCreatorRulesModal(false);
      }
      await startStreamWithLabel(contentLabel!);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
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
      console.error('Error in startStream:', error);
      Alert.alert('Error', 'Failed to validate stream start. Please try again.');
    }
  };

  const startStreamWithLabel = async (label: ContentLabel) => {
    if (!user || !isMountedRef.current) return;

    setIsLoading(true);

    try {
      console.log('🎬 Starting live stream with title:', streamTitle, 'and label:', label);
      
      const result = await cloudflareService.startLive({ 
        title: streamTitle, 
        userId: user.id 
      });

      console.log('✅ Stream created successfully:', result);

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
        setLiveTime(0);
        setShowSetup(false);
        setStreamTitle('');
      }

      console.log('📺 Stream details:', {
        id: result.stream.id,
        live_input_id: result.stream.live_input_id,
        playback_url: result.stream.playback_url,
        rtmps_url: result.ingest.rtmps_url,
        stream_key: result.ingest.stream_key ? '***' : null,
        webRTC_url: result.ingest.webRTC_url,
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
          { text: 'Retry', onPress: () => startStreamWithLabel(label) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const endStream = async () => {
    if (!currentStream) {
      Alert.alert('Error', 'No active stream to end');
      return;
    }

    setIsLoading(true);

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

      if (isMountedRef.current) {
        setIsLive(false);
        setIsStreaming(false);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setLiveTime(0);
        setCurrentStream(null);
        setGiftAnimations([]);
        setIsMinimized(false);
        setSelectedFilter('none');
        setShowFilters(false);
        setArchiveId(null);
        setContentLabel(null);
        streamStartTime.current = null;
      }

      Alert.alert(
        'Stream Ended',
        `Your live stream has been ended successfully.\n\n📊 Stats:\n• Peak Viewers: ${peakViewers}\n• Total Viewers: ${totalViewerCount}\n• Total Gifts: ${totalGifts}\n• Duration: ${formatTime(liveTime)}`
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
          { text: 'Retry', onPress: endStream },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCameraStyle = () => {
    const baseStyle = styles.camera;
    return baseStyle;
  };

  // Show safety acknowledgement modal if needed
  if (showSafetyAcknowledgement) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafetyAcknowledgementModal
          visible={showSafetyAcknowledgement}
          onAccept={handleSafetyAcknowledgement}
          isLoading={isLoading}
        />
      </View>
    );
  }

  // Show forced review lock modal if needed
  if (showForcedReviewLock) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Camera View */}
      {isCameraOn ? (
        <CameraView 
          style={getCameraStyle()} 
          facing={facing}
          flash={flashMode}
          videoQuality="1080p"
          ratio="16:9"
        />
      ) : (
        <View style={[styles.cameraOffContainer, { backgroundColor: colors.background }]}>
          <IconSymbol
            ios_icon_name="video.slash.fill"
            android_material_icon_name="videocam_off"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.cameraOffText, { color: colors.text }]}>
            Camera Off — Stream Still Active
          </Text>
        </View>
      )}

      {/* Floating Thumbnail for Multitask Mode */}
      {isMinimized && isLive && (
        <TouchableOpacity 
          style={[styles.floatingThumbnail, { borderColor: colors.gradientEnd }]}
          onPress={() => {
            console.log('📱 Expanding from minimized mode');
            if (isMountedRef.current) {
              setIsMinimized(false);
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.thumbnailContent}>
            {isCameraOn ? (
              <CameraView 
                style={styles.thumbnailCamera} 
                facing={facing}
                flash={flashMode}
              />
            ) : (
              <View style={[styles.thumbnailCameraOff, { backgroundColor: colors.background }]}>
                <IconSymbol
                  ios_icon_name="video.slash.fill"
                  android_material_icon_name="videocam_off"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.thumbnailOverlay}>
              <LiveBadge size="small" />
              <Text style={styles.thumbnailText}>Tap to expand</Text>
              <Text style={styles.thumbnailViewers}>👁 {viewerCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.overlay}>
        {isLive && !isMinimized && (
          <>
            {/* Connection Status Indicator */}
            <ConnectionStatusIndicator
              status={connectionStatus}
              attemptNumber={reconnectAttempt}
              maxAttempts={6}
            />

            {/* Top Bar with Logo */}
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
                  <Text style={styles.statText}>{formatTime(liveTime)}</Text>
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
              isVisible={showHealthDashboard && !isMinimized}
            />

            {/* Filter Toggle Button */}
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="camera.filters"
                android_material_icon_name="filter"
                size={24}
                color={showFilters ? colors.gradientEnd : colors.text}
              />
            </TouchableOpacity>

            {/* Moderator Panel Toggle Button */}
            <TouchableOpacity
              style={styles.moderatorPanelToggle}
              onPress={() => setShowModeratorPanel(true)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={24}
                color={colors.gradientEnd}
              />
            </TouchableOpacity>

            {/* Moderation History Button */}
            <TouchableOpacity
              style={styles.moderationHistoryToggle}
              onPress={() => setShowModerationHistory(true)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Host Control Dashboard Button */}
            <HostControlButton onPress={() => setShowHostControlDashboard(true)} />

            {/* Filter Selector */}
            <CameraFilterSelector
              selectedFilter={selectedFilter}
              onSelectFilter={(filter) => {
                console.log('🎨 Applying filter:', filter);
                if (isMountedRef.current) {
                  setSelectedFilter(filter);
                }
              }}
              visible={showFilters}
            />

            {/* Moderator Chat Overlay */}
            {currentStream && user && (
              <ModeratorChatOverlay
                streamId={currentStream.id}
                streamerId={user.id}
                currentUserId={user.id}
                isStreamer={true}
                isModerator={false}
              />
            )}
          </>
        )}

        {!isLive && (
          <View style={styles.centerContent}>
            <AppLogo size="large" alignment="center" />
            <Text style={[styles.welcomeText, { color: colors.text }]}>Ready to go live?</Text>
            <GradientButton
              title="Go Live"
              onPress={handleStartLiveSetup}
              size="large"
              disabled={isLoading || isCheckingSafety}
            />
          </View>
        )}
      </View>

      {/* Gift Animations */}
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

      {/* Control Panel */}
      {isLive && !isMinimized && (
        <LiveStreamControlPanel
          isMicOn={isMicOn}
          onToggleMic={toggleMic}
          isCameraOn={isCameraOn}
          onToggleCamera={toggleCamera}
          facing={facing}
          onFlipCamera={toggleCameraFacing}
          isFlashOn={flashMode === 'on'}
          onToggleFlash={toggleFlash}
          onEndStream={() => setShowExitConfirmation(true)}
          isLoading={isLoading}
          isBackCamera={facing === 'back'}
        />
      )}

      {/* Viewer List Modal */}
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

      {/* Moderator Control Panel */}
      {currentStream && user && (
        <ModeratorControlPanel
          visible={showModeratorPanel}
          onClose={() => setShowModeratorPanel(false)}
          streamId={currentStream.id}
          streamerId={user.id}
          currentUserId={user.id}
          isStreamer={true}
        />
      )}

      {/* Moderation History Modal */}
      {user && (
        <ModerationHistoryModal
          visible={showModerationHistory}
          onClose={() => setShowModerationHistory(false)}
          streamerId={user.id}
        />
      )}

      {/* Host Control Dashboard */}
      {currentStream && user && (
        <HostControlDashboard
          streamId={currentStream.id}
          hostId={user.id}
          visible={showHostControlDashboard}
          onClose={() => setShowHostControlDashboard(false)}
        />
      )}

      {/* Content Label Selection Modal */}
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

      {/* Creator Rules Modal */}
      <CreatorRulesModal
        visible={showCreatorRulesModal}
        onConfirm={handleCreatorRulesConfirm}
        onCancel={() => {
          if (isMountedRef.current) {
            setShowCreatorRulesModal(false);
            setShowSetup(false);
          }
        }}
        isLoading={isLoading}
      />

      {/* Setup Modal */}
      <Modal
        visible={showSetup}
        transparent
        animationType="slide"
        onRequestClose={() => !isLoading && setShowSetup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppLogo size="medium" alignment="center" style={styles.modalLogo} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Setup Your Stream</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Stream Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="What are you streaming?"
                placeholderTextColor={colors.placeholder}
                value={streamTitle}
                onChangeText={setStreamTitle}
                maxLength={100}
                autoFocus
                editable={!isLoading}
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Your stream will be broadcast live in vertical format (9:16) at up to 1080p quality. Make sure you have a stable internet connection!
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                onPress={() => setShowSetup(false)}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.goLiveButtonContainer}>
                <GradientButton
                  title={isLoading ? 'STARTING...' : 'Go Live'}
                  onPress={startStream}
                  size="medium"
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationModal, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>End Livestream?</Text>
            <Text style={[styles.confirmationText, { color: colors.textSecondary }]}>
              You cannot leave your livestream until you end it.{'\n\n'}Are you sure you want to end the stream?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationCancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                onPress={() => setShowExitConfirmation(false)}
              >
                <Text style={[styles.confirmationCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.confirmationEndButton}>
                <GradientButton
                  title="End Stream"
                  onPress={handleEndStreamConfirm}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOffContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cameraOffText: {
    fontSize: 18,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
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
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterToggle: {
    position: 'absolute',
    top: 360,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  moderatorPanelToggle: {
    position: 'absolute',
    top: 420,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A40028',
  },
  moderationHistoryToggle: {
    position: 'absolute',
    top: 480,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingThumbnail: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 3,
  },
  thumbnailContent: {
    flex: 1,
  },
  thumbnailCamera: {
    flex: 1,
  },
  thumbnailCameraOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  thumbnailViewers: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalLogo: {
    marginBottom: 16,
  },
  modalTitle: {
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: '#A40028',
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
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  goLiveButtonContainer: {
    flex: 1,
  },
  confirmationModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '400',
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
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmationCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmationEndButton: {
    flex: 1,
  },
});
