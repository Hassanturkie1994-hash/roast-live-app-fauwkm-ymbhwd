
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, BackHandler, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import GiftAnimationOverlay from '@/components/GiftAnimationOverlay';
import ViewerListModal from '@/components/ViewerListModal';
import ContentLabelBadge from '@/components/ContentLabelBadge';
import { ContentLabel } from '@/components/ContentLabelModal';
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
import ImprovedVisualEffectsOverlay from '@/components/ImprovedVisualEffectsOverlay';
import ImprovedEffectsPanel from '@/components/ImprovedEffectsPanel';
import ImprovedFiltersPanel from '@/components/ImprovedFiltersPanel';
import GuestSeatGrid from '@/components/GuestSeatGrid';
import HostControlDashboard from '@/components/HostControlDashboard';

import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useLiveStreamState } from '@/contexts/LiveStreamStateMachine';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { contentSafetyService } from '@/app/services/contentSafetyService';
import { viewerTrackingService } from '@/app/services/viewerTrackingService';
import { liveStreamArchiveService } from '@/app/services/liveStreamArchiveService';
import { streamGuestService, StreamGuestSeat } from '@/app/services/streamGuestService';
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

interface ViewerRanking {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  watch_time_seconds: number;
}

export default function BroadcastScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { setIsStreaming, startStreamTimer, stopStreamTimer } = useStreaming();
  const liveStreamState = useLiveStreamState();
  const { activeFilter, activeEffect, filterIntensity, hasActiveFilter, hasActiveEffect } = useCameraEffects();
  
  const params = useLocalSearchParams<{
    streamTitle?: string;
    contentLabel?: ContentLabel;
    aboutLive?: string;
    practiceMode?: string;
    whoCanWatch?: string;
    selectedModerators?: string;
    selectedVIPClub?: string;
    giftGoal?: string;
    roastGoalViewers?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');

  const isPracticeMode = params.practiceMode === 'true';

  // Stream creation states
  const [isCreatingStream, setIsCreatingStream] = useState(!isPracticeMode);
  const [streamCreationError, setStreamCreationError] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);

  // Live stream states
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // NEW: Network & FPS metrics
  const [networkQuality, setNetworkQuality] = useState<'Good' | 'Medium' | 'Bad'>('Good');
  const [currentFPS, setCurrentFPS] = useState(30);

  // NEW: Viewer ranking
  const [topViewers, setTopViewers] = useState<ViewerRanking[]>([]);
  const [showViewerRanking, setShowViewerRanking] = useState(false);

  // Camera controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // NEW: Guest management
  const [activeGuests, setActiveGuests] = useState<StreamGuestSeat[]>([]);
  const [showGuestControls, setShowGuestControls] = useState(false);
  const [showHostDashboard, setShowHostDashboard] = useState(false);

  // UI states
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showLiveSettings, setShowLiveSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const streamStartTime = useRef<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const likesChannelRef = useRef<any>(null);
  const guestChannelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const {
    connectionStatus,
    reconnectAttempt,
    isReconnecting,
    startReconnect,
    stopReconnect,
  } = useStreamConnection({
    isStreaming: isLive && !isPracticeMode,
    onReconnectSuccess: () => {
      console.log('✅ Stream reconnected successfully');
    },
    onReconnectFailed: () => {
      console.log('❌ Stream reconnection failed, ending stream');
      endLive();
    },
  });

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

  /* ───────────────── PRACTICE MODE SETUP ───────────────── */
  const startPracticeMode = useCallback(async () => {
    try {
      console.log('🎯 [PRACTICE] Starting Practice Mode');

      try {
        await activateKeepAwakeAsync();
        console.log('✅ [PRACTICE] Keep awake activated');
      } catch (keepAwakeError) {
        console.warn('⚠️ [PRACTICE] Failed to activate keep awake:', keepAwakeError);
      }

      liveStreamState.startBroadcasting();

      if (isMountedRef.current) {
        setIsLive(true);
        setIsStreaming(true);
        setIsCreatingStream(false);
        setStreamCreationError(null);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setTotalLikes(0);
        setLiveSeconds(0);
      }

      console.log('✅ [PRACTICE] Practice Mode started successfully');
    } catch (error) {
      console.error('❌ [PRACTICE] Error starting practice mode:', error);
      liveStreamState.setError('Failed to start practice mode');
      if (isMountedRef.current) {
        setStreamCreationError('Failed to start practice mode');
        setIsCreatingStream(false);
      }
    }
  }, [liveStreamState, setIsStreaming]);

  /* ───────────────── STREAM CREATION ON MOUNT ───────────────── */
  const createStreamOnMount = useCallback(async () => {
    if (!user || !params.streamTitle || !params.contentLabel) {
      console.error('❌ [BROADCAST] Cannot create stream: missing required data');
      liveStreamState.setError('Missing required information');
      setStreamCreationError('Missing required information');
      setIsCreatingStream(false);
      return;
    }

    console.log('🎬 [STREAM-CREATE-1] Starting stream creation...');

    try {
      console.log('💤 [STREAM-CREATE-2] Attempting to activate keep awake...');
      try {
        await activateKeepAwakeAsync();
        console.log('✅ [STREAM-CREATE-2] Keep awake activated successfully');
      } catch (keepAwakeError) {
        console.warn('⚠️ [STREAM-CREATE-2] KeepAwake failed (continuing anyway):', keepAwakeError);
      }

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

      console.log('📝 [STREAM-CREATE-4] Setting content label and goals on stream...');
      try {
        await contentSafetyService.setStreamContentLabel(result.stream.id, params.contentLabel);
        
        // Store goals in stream metadata
        await supabase
          .from('streams')
          .update({
            gift_goal: params.giftGoal || null,
            roast_goal_viewers: parseInt(params.roastGoalViewers || '0', 10),
          })
          .eq('id', result.stream.id);
        
        console.log('✅ [STREAM-CREATE-4] Content label and goals set successfully');
      } catch (labelError) {
        console.error('⚠️ [STREAM-CREATE-4] Failed to set content label/goals (continuing anyway):', labelError);
      }

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

      console.log('🔄 [STREAM-CREATE-6] Updating state machine to STREAM_READY...');
      liveStreamState.streamCreated();

      console.log('🎉 [STREAM-CREATE-7] Setting stream state in UI...');
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
        setTotalLikes(0);
        setLiveSeconds(0);
        console.log('✅ [STREAM-CREATE-7] Stream state updated successfully');
      }

      console.log('🔄 [STREAM-CREATE-8] Transitioning to BROADCASTING state...');
      liveStreamState.startBroadcasting();

      startStreamTimer();

      console.log('🎊 [STREAM-CREATE-10] Stream creation complete! Now LIVE!');
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
      
      liveStreamState.setError(errorMessage);
      
      if (isMountedRef.current) {
        setStreamCreationError(errorMessage);
        setIsCreatingStream(false);
      }
    }
  }, [user, params, liveStreamState, setIsStreaming, startStreamTimer]);

  /* ───────────────── MOUNT / AUTH GUARD ───────────────── */
  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 [BROADCAST] BroadcastScreen mounted with params:', params);

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!params.streamTitle || !params.contentLabel) {
      console.error('❌ [BROADCAST] Missing required params');
      
      Alert.alert(
        'Missing Stream Information',
        'Required stream information is missing. Please try again.',
        [
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => {
              liveStreamState.setError('Missing stream information');
              router.back();
            },
          },
        ]
      );
      
      setStreamCreationError('Missing stream information');
      setIsCreatingStream(false);
      return;
    }

    if (isPracticeMode) {
      console.log('🎯 [BROADCAST] Practice Mode enabled - skipping Cloudflare stream creation');
      startPracticeMode();
    } else {
      createStreamOnMount();
    }

    return () => {
      isMountedRef.current = false;
      console.log('🎬 [BROADCAST] BroadcastScreen unmounted');
      try {
        deactivateKeepAwake();
        console.log('💤 [BROADCAST] Keep awake deactivated on unmount');
      } catch (error) {
        console.warn('⚠️ [BROADCAST] Failed to deactivate keep awake on unmount:', error);
      }
    };
  }, [user, params, isPracticeMode, createStreamOnMount, startPracticeMode, liveStreamState]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isLive && Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('🚫 [BROADCAST] Back button pressed during livestream - showing confirmation');
        setShowExitConfirmation(true);
        return true;
      });

      return () => backHandler.remove();
    }
  }, [isLive]);

  /* ───────────────── LIVE TIMER - FIXED TO NOT RESET ───────────────── */
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
    if (!isMountedRef.current || isPracticeMode) return;

    console.log('🔌 [BROADCAST] Subscribing to viewer updates:', `stream:${streamId}:broadcaster`);

    const channel = supabase
      .channel(`stream:${streamId}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('👥 [BROADCAST] Viewer count update:', payload);
        
        if (!isMountedRef.current) return;
        
        const count = payload.payload?.count ?? 0;
        setViewerCount(count);
        setPeakViewers(prev => count > prev ? count : prev);
      })
      .subscribe((status) => {
        console.log('📡 [BROADCAST] Viewer channel subscription status:', status);
      });

    realtimeRef.current = channel;
  }, [isPracticeMode]);

  /* ───────────────── GIFT SUBSCRIPTION ───────────────── */
  const subscribeToGifts = useCallback((streamId: string) => {
    if (!isMountedRef.current || isPracticeMode) return;

    console.log('🔌 [BROADCAST] Subscribing to gifts:', `stream:${streamId}:gifts`);

    const channel = supabase
      .channel(`stream:${streamId}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 [BROADCAST] Gift received:', payload);
        
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
        console.log('📡 [BROADCAST] Gift channel subscription status:', status);
      });

    giftChannelRef.current = channel;
  }, [isPracticeMode]);

  /* ───────────────── LIKES SUBSCRIPTION ───────────────── */
  const subscribeToLikes = useCallback((streamId: string) => {
    if (!isMountedRef.current || isPracticeMode) return;

    console.log('🔌 [BROADCAST] Subscribing to likes:', `stream:${streamId}:likes`);

    const channel = supabase
      .channel(`stream:${streamId}:likes`)
      .on('broadcast', { event: 'like_sent' }, (payload) => {
        console.log('❤️ [BROADCAST] Like received:', payload);
        
        if (!isMountedRef.current) return;
        
        setTotalLikes((prev) => prev + 1);
      })
      .subscribe((status) => {
        console.log('📡 [BROADCAST] Likes channel subscription status:', status);
      });

    likesChannelRef.current = channel;
  }, [isPracticeMode]);

  /* ───────────────── GUEST SUBSCRIPTION ───────────────── */
  const subscribeToGuests = useCallback((streamId: string) => {
    if (!isMountedRef.current || isPracticeMode) return;

    console.log('🔌 [BROADCAST] Subscribing to guest events');

    const channel = streamGuestService.subscribeToGuestEvents(streamId, (payload) => {
      console.log('👥 [BROADCAST] Guest event received:', payload);
      loadActiveGuests();
    });

    guestChannelRef.current = channel;
  }, [isPracticeMode]);

  const loadActiveGuests = useCallback(async () => {
    if (!currentStream?.id || isPracticeMode) return;

    try {
      const guests = await streamGuestService.getActiveGuestSeats(currentStream.id);
      if (isMountedRef.current) {
        setActiveGuests(guests);
      }
    } catch (error) {
      console.error('Error loading active guests:', error);
    }
  }, [currentStream?.id, isPracticeMode]);

  useEffect(() => {
    if (isLive && currentStream?.id && !isPracticeMode && isMountedRef.current) {
      console.log('🚀 [BROADCAST] Initializing Realtime channels for stream:', currentStream.id);
      subscribeViewers(currentStream.id);
      subscribeToGifts(currentStream.id);
      subscribeToLikes(currentStream.id);
      subscribeToGuests(currentStream.id);
      loadActiveGuests();
    }
    
    return () => {
      if (realtimeRef.current) {
        console.log('🔌 [BROADCAST] Unsubscribing from viewer channel');
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      if (giftChannelRef.current) {
        console.log('🔌 [BROADCAST] Unsubscribing from gift channel');
        supabase.removeChannel(giftChannelRef.current);
        giftChannelRef.current = null;
      }
      if (likesChannelRef.current) {
        console.log('🔌 [BROADCAST] Unsubscribing from likes channel');
        supabase.removeChannel(likesChannelRef.current);
        likesChannelRef.current = null;
      }
      if (guestChannelRef.current) {
        console.log('🔌 [BROADCAST] Unsubscribing from guest channel');
        supabase.removeChannel(guestChannelRef.current);
        guestChannelRef.current = null;
      }
    };
  }, [isLive, currentStream?.id, subscribeViewers, subscribeToGifts, subscribeToLikes, subscribeToGuests, loadActiveGuests, isPracticeMode]);

  /* ───────────────── VIEWER RANKING ───────────────── */
  const loadViewerRanking = useCallback(async () => {
    if (!currentStream?.id || isPracticeMode) return;

    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('user_id, watch_time_seconds, profiles(display_name, avatar_url)')
        .eq('stream_id', currentStream.id)
        .is('left_at', null)
        .order('watch_time_seconds', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading viewer ranking:', error);
        return;
      }

      const rankings: ViewerRanking[] = (data || []).map((v: any) => ({
        user_id: v.user_id,
        display_name: v.profiles?.display_name || 'Unknown',
        avatar_url: v.profiles?.avatar_url || null,
        watch_time_seconds: v.watch_time_seconds || 0,
      }));

      if (isMountedRef.current) {
        setTopViewers(rankings);
      }
    } catch (error) {
      console.error('Error in loadViewerRanking:', error);
    }
  }, [currentStream?.id, isPracticeMode]);

  useEffect(() => {
    if (isLive && currentStream?.id && !isPracticeMode) {
      loadViewerRanking();
      const interval = setInterval(loadViewerRanking, 10000);
      return () => clearInterval(interval);
    }
  }, [isLive, currentStream?.id, isPracticeMode, loadViewerRanking]);

  /* ───────────────── NETWORK QUALITY SIMULATION ───────────────── */
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        const random = Math.random();
        if (random > 0.9) {
          setNetworkQuality('Bad');
        } else if (random > 0.7) {
          setNetworkQuality('Medium');
        } else {
          setNetworkQuality('Good');
        }

        setCurrentFPS(Math.floor(24 + Math.random() * 7));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

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
    if (likesChannelRef.current) {
      supabase.removeChannel(likesChannelRef.current);
      likesChannelRef.current = null;
    }
    if (guestChannelRef.current) {
      supabase.removeChannel(guestChannelRef.current);
      guestChannelRef.current = null;
    }
  };

  /* ───────────────── END STREAM ───────────────── */
  const endLive = async () => {
    console.log('🛑 [BROADCAST] Ending stream (Practice Mode:', isPracticeMode, ')');

    try {
      console.log('🔄 [BROADCAST] Resetting streaming state...');
      if (isMountedRef.current) {
        setIsLive(false);
        setIsStreaming(false);
        setViewerCount(0);
        setPeakViewers(0);
        setTotalViewers(0);
        setTotalGifts(0);
        setTotalLikes(0);
        setLiveSeconds(0);
        setGiftAnimations([]);
      }

      liveStreamState.endStream();
      stopReconnect();

      try {
        deactivateKeepAwake();
        console.log('💤 [BROADCAST] Keep awake deactivated');
      } catch (keepAwakeError) {
        console.warn('⚠️ [BROADCAST] Failed to deactivate keep awake:', keepAwakeError);
      }

      if (isPracticeMode) {
        console.log('🎯 [PRACTICE] Ending practice mode - no Cloudflare cleanup needed');

        const parent = navigation.getParent();
        if (parent) {
          console.log('🔄 [PRACTICE] Explicitly restoring tab bar before navigation');
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }

        liveStreamState.resetToIdle();

        Alert.alert(
          'Practice Ended',
          `Your practice session has ended.\n\n📊 Stats:\n• Duration: ${formatTime(liveSeconds)}\n\nAll your settings (filters, effects, VIP Club, moderators) have been saved and will be used when you go live for real.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            }
          ]
        );
        return;
      }

      if (!currentStream) {
        Alert.alert('Error', 'No active stream to end');
        return;
      }

      console.log('🛑 [BROADCAST] Ending real stream:', {
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });

      const totalViewerCount = await viewerTrackingService.getTotalViewerCount(currentStream.id);
      if (isMountedRef.current) {
        setTotalViewers(totalViewerCount);
      }

      await viewerTrackingService.cleanupStreamViewers(currentStream.id);
      await streamGuestService.endAllGuestSessions(currentStream.id);

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

        console.log('📦 [BROADCAST] Stream archive updated with metrics');
      }

      await cloudflareService.stopLive({
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });

      console.log('✅ [BROADCAST] Stream ended successfully');

      if (user) {
        await stopStreamTimer(user.id);
      }

      cleanupRealtime();

      if (isMountedRef.current) {
        setCurrentStream(null);
        setArchiveId(null);
        streamStartTime.current = null;
      }

      const parent = navigation.getParent();
      if (parent) {
        console.log('🔄 [BROADCAST] Explicitly restoring tab bar before navigation');
        parent.setOptions({
          tabBarStyle: undefined,
        });
      }

      liveStreamState.resetToIdle();

      Alert.alert(
        'Stream Ended',
        `Your live stream has been ended successfully.\n\n📊 Stats:\n• Peak Viewers: ${peakViewers}\n• Total Viewers: ${totalViewerCount}\n• Total Gifts: ${totalGifts}\n• Total Likes: ${totalLikes}\n• Duration: ${formatTime(liveSeconds)}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
    } catch (error) {
      console.error('❌ [BROADCAST] Error ending stream:', error);
      
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
    console.log('📷 [BROADCAST] Switching camera');
    if (isMountedRef.current) {
      setFacing((current) => (current === 'back' ? 'front' : 'back'));
      if (facing === 'back') {
        setFlashMode('off');
      }
    }
  };

  const toggleFlash = () => {
    if (facing === 'back') {
      console.log('💡 [BROADCAST] Toggling flash');
      if (isMountedRef.current) {
        setFlashMode((current) => (current === 'off' ? 'on' : 'off'));
      }
    } else {
      Alert.alert('Flash Unavailable', 'Flash is only available when using the back camera.');
    }
  };

  const toggleCamera = () => {
    console.log('📹 [BROADCAST] Toggling camera on/off');
    if (isMountedRef.current) {
      setIsCameraOn((current) => !current);
    }
  };

  const toggleMic = () => {
    console.log('🎤 [BROADCAST] Toggling microphone');
    if (isMountedRef.current) {
      setIsMicOn((current) => !current);
    }
  };

  const handleRetry = () => {
    console.log('🔄 [BROADCAST] Retrying stream creation...');
    setStreamCreationError(null);
    setIsCreatingStream(true);
    liveStreamState.startStreamCreation();
    createStreamOnMount();
  };

  const handleCancel = () => {
    console.log('❌ [BROADCAST] Cancelling stream creation...');
    
    if (isMountedRef.current) {
      setIsStreaming(false);
      setIsLive(false);
      setIsCreatingStream(false);
      setStreamCreationError(null);
    }
    
    const parent = navigation.getParent();
    if (parent) {
      console.log('🔄 [BROADCAST] Explicitly restoring tab bar before navigation');
      parent.setOptions({
        tabBarStyle: undefined,
      });
    }
    
    liveStreamState.resetToIdle();
    router.back();
  };

  const handleShare = () => {
    console.log('📤 [BROADCAST] Share stream');
    setShowShareModal(true);
  };

  const handleInviteGuest = () => {
    if (isMountedRef.current) {
      setShowViewerList(true);
    }
  };

  /* ───────────────── RENDER ───────────────── */

  if (!permission?.granted) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
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
      </>
    );
  }

  if (isCreatingStream && !isPracticeMode) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={commonStyles.container}>
          <CameraView 
            style={StyleSheet.absoluteFill} 
            facing={facing}
          />
          
          <View style={styles.loadingOverlay}>
            <AppLogo size="large" alignment="center" />
            <ActivityIndicator size="large" color={colors.gradientEnd} style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>Connecting to LIVE...</Text>
            <Text style={styles.loadingSubtitle}>Setting up your stream</Text>
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>✓ Camera ready</Text>
              <Text style={styles.loadingStep}>⏳ Creating stream...</Text>
              <Text style={styles.loadingStep}>⏳ Connecting to server...</Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  if (streamCreationError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={commonStyles.container}>
          <CameraView 
            style={StyleSheet.absoluteFill} 
            facing={facing}
          />
          
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
                <Text style={styles.errorCancelText}>Exit</Text>
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
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
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

        {/* CAMERA FILTER OVERLAY */}
        <ImprovedCameraFilterOverlay filter={activeFilter} intensity={filterIntensity} />

        {/* VISUAL EFFECTS OVERLAY */}
        <ImprovedVisualEffectsOverlay effect={activeEffect} />

        {/* GUEST SEAT GRID (if guests are active) */}
        {activeGuests.length > 0 && user && (
          <GuestSeatGrid
            hostName={user.display_name || 'Host'}
            hostAvatarUrl={user.avatar_url}
            guests={activeGuests}
            streamId={currentStream?.id || ''}
            hostId={user.id}
            isHost={true}
            onRefresh={loadActiveGuests}
            onEmptySeatPress={handleInviteGuest}
          />
        )}

        {/* OVERLAY LAYER */}
        <View style={styles.overlay} pointerEvents="box-none">
          {isLive && (
            <>
              {/* TOP BAR */}
              <View style={styles.topBar}>
                <View style={styles.topLeft}>
                  {/* GOALS - REPOSITIONED TO TOP LEFT */}
                  {(params.giftGoal || (params.roastGoalViewers && parseInt(params.roastGoalViewers, 10) > 0)) && (
                    <View style={styles.goalsCompact}>
                      {params.giftGoal && (
                        <View style={styles.goalBadge}>
                          <IconSymbol
                            ios_icon_name="gift.fill"
                            android_material_icon_name="card_giftcard"
                            size={12}
                            color="#FFD700"
                          />
                          <Text style={styles.goalText} numberOfLines={1}>{params.giftGoal}</Text>
                        </View>
                      )}
                      {params.roastGoalViewers && parseInt(params.roastGoalViewers, 10) > 0 && (
                        <View style={styles.goalBadge}>
                          <IconSymbol
                            ios_icon_name="flame.fill"
                            android_material_icon_name="whatshot"
                            size={12}
                            color="#FF6B00"
                          />
                          <Text style={styles.goalText}>
                            {viewerCount}/{params.roastGoalViewers}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Host Avatar & Name */}
                  <View style={styles.hostInfo}>
                    <View style={styles.hostAvatar}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.hostName}>{user?.display_name || 'Host'}</Text>
                  </View>

                  {/* Live Badge or Practice Badge */}
                  {isPracticeMode ? (
                    <View style={styles.practiceBadge}>
                      <Text style={styles.practiceBadgeText}>PRACTICE</Text>
                    </View>
                  ) : (
                    <LiveBadge size="small" />
                  )}

                  {/* Viewer Count */}
                  <TouchableOpacity 
                    style={styles.viewerCountButton}
                    onPress={() => !isPracticeMode && setShowViewerList(true)}
                    activeOpacity={0.7}
                    disabled={isPracticeMode}
                  >
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.viewerCountText}>{isPracticeMode ? 0 : viewerCount}</Text>
                  </TouchableOpacity>

                  {/* Duration Timer - FIXED */}
                  <View style={styles.durationBadge}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.durationText}>{formatTime(liveSeconds)}</Text>
                  </View>
                </View>

                {/* Close (End Live) Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowExitConfirmation(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Content Label Badge */}
              {params.contentLabel && (
                <View style={styles.contentLabelContainer}>
                  <ContentLabelBadge label={params.contentLabel} size="small" />
                </View>
              )}

              {/* RIGHT SIDE CONTROLS */}
              <View style={styles.rightSideControls}>
                {/* Add Guests Button */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={handleInviteGuest}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="person.badge.plus.fill"
                    android_material_icon_name="person_add"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.rightSideButtonText}>Add Guest</Text>
                  {activeGuests.length > 0 && (
                    <View style={styles.guestCountBadge}>
                      <Text style={styles.guestCountText}>{activeGuests.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Camera Toggle */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={toggleCamera}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={isCameraOn ? 'video.fill' : 'video.slash.fill'}
                    android_material_icon_name={isCameraOn ? 'videocam' : 'videocam_off'}
                    size={32}
                    color={isCameraOn ? '#FFFFFF' : '#FF1744'}
                  />
                  <Text style={styles.rightSideButtonText}>Camera</Text>
                </TouchableOpacity>

                {/* Flashlight Control - WORKING */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={toggleFlash}
                  activeOpacity={0.7}
                  disabled={facing !== 'back'}
                >
                  <IconSymbol
                    ios_icon_name={flashMode === 'on' ? 'bolt.fill' : 'bolt.slash.fill'}
                    android_material_icon_name={flashMode === 'on' ? 'flash_on' : 'flash_off'}
                    size={32}
                    color={facing === 'back' ? (flashMode === 'on' ? '#FFD700' : '#FFFFFF') : '#666666'}
                  />
                  <Text style={[styles.rightSideButtonText, facing !== 'back' && styles.disabledText]}>
                    Flash
                  </Text>
                </TouchableOpacity>

                {/* Effects */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={() => setShowEffectsPanel(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto_awesome"
                    size={32}
                    color={hasActiveEffect() ? colors.brandPrimary : '#FFFFFF'}
                  />
                  <Text style={styles.rightSideButtonText}>Effects</Text>
                </TouchableOpacity>

                {/* Filters */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={() => setShowFiltersPanel(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="camera.filters"
                    android_material_icon_name="filter"
                    size={32}
                    color={hasActiveFilter() ? colors.brandPrimary : '#FFFFFF'}
                  />
                  <Text style={styles.rightSideButtonText}>Filters</Text>
                </TouchableOpacity>

                {/* Settings */}
                <TouchableOpacity 
                  style={styles.rightSideButton} 
                  onPress={() => setShowLiveSettings(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="gearshape.fill"
                    android_material_icon_name="settings"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.rightSideButtonText}>Settings</Text>
                </TouchableOpacity>

                {/* Share */}
                {!isPracticeMode && (
                  <TouchableOpacity 
                    style={styles.rightSideButton} 
                    onPress={handleShare}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="square.and.arrow.up.fill"
                      android_material_icon_name="share"
                      size={32}
                      color="#FFFFFF"
                    />
                    <Text style={styles.rightSideButtonText}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* BOTTOM LEFT - Chat Overlay */}
              {isPracticeMode ? (
                <View style={styles.practiceChatOverlay}>
                  <Text style={styles.practiceChatText}>💬 Chat Preview</Text>
                  <Text style={styles.practiceChatSubtext}>
                    This is how chat will appear during your live stream
                  </Text>
                </View>
              ) : currentStream ? (
                <ChatOverlay
                  streamId={currentStream.id}
                  isBroadcaster={true}
                  streamDelay={0}
                  hostId={user?.id}
                  hostName={user?.display_name || 'Host'}
                />
              ) : null}

              {/* BOTTOM CENTER - Controls */}
              <View style={styles.bottomCenterControls}>
                {/* Mic Control */}
                <TouchableOpacity
                  style={[styles.bottomControlButton, !isMicOn && styles.bottomControlButtonOff]}
                  onPress={toggleMic}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
                    android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Camera Flip */}
                <TouchableOpacity
                  style={styles.bottomControlButton}
                  onPress={toggleCameraFacing}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                    android_material_icon_name="flip_camera_ios"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Host Dashboard */}
                <TouchableOpacity
                  style={styles.bottomControlButton}
                  onPress={() => setShowHostDashboard(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="slider.horizontal.3"
                    android_material_icon_name="tune"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* BOTTOM METRICS BAR */}
              <View style={styles.metricsBar}>
                {/* Network Quality */}
                <View style={styles.metricItem}>
                  <IconSymbol
                    ios_icon_name="wifi"
                    android_material_icon_name="wifi"
                    size={16}
                    color={
                      networkQuality === 'Good' ? '#00FF00' :
                      networkQuality === 'Medium' ? '#FFA500' : '#FF0000'
                    }
                  />
                  <Text style={styles.metricText}>{networkQuality}</Text>
                </View>

                {/* FPS */}
                <View style={styles.metricItem}>
                  <IconSymbol
                    ios_icon_name="speedometer"
                    android_material_icon_name="speed"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.metricText}>{currentFPS} FPS</Text>
                </View>

                {/* Viewer Count */}
                <TouchableOpacity 
                  style={styles.metricItem}
                  onPress={() => setShowViewerRanking(true)}
                  disabled={isPracticeMode}
                >
                  <IconSymbol
                    ios_icon_name="person.2.fill"
                    android_material_icon_name="people"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.metricText}>{viewerCount} viewers</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* GIFT ANIMATIONS */}
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

        {/* VIEWER LIST MODAL */}
        {currentStream && user && !isPracticeMode && (
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

        {/* VIEWER RANKING MODAL */}
        {!isPracticeMode && (
          <ViewerRankingModal
            visible={showViewerRanking}
            onClose={() => setShowViewerRanking(false)}
            topViewers={topViewers}
            totalViewers={viewerCount}
          />
        )}

        {/* HOST DASHBOARD */}
        {currentStream && user && (
          <HostControlDashboard
            visible={showHostDashboard}
            onClose={() => setShowHostDashboard(false)}
            streamId={currentStream.id}
            hostId={user.id}
          />
        )}

        {/* EFFECTS PANEL */}
        <ImprovedEffectsPanel
          visible={showEffectsPanel}
          onClose={() => setShowEffectsPanel(false)}
        />

        {/* FILTERS PANEL */}
        <ImprovedFiltersPanel
          visible={showFiltersPanel}
          onClose={() => setShowFiltersPanel(false)}
        />

        {/* LIVE SETTINGS MODAL */}
        <LiveSettingsModal
          visible={showLiveSettings}
          onClose={() => setShowLiveSettings(false)}
          streamTitle={params.streamTitle || ''}
          liveSeconds={liveSeconds}
          viewerCount={viewerCount}
          peakViewers={peakViewers}
          totalGifts={totalGifts}
          totalLikes={totalLikes}
          isPracticeMode={isPracticeMode}
          giftGoal={params.giftGoal}
          roastGoalViewers={params.roastGoalViewers}
        />

        {/* SHARE MODAL */}
        {!isPracticeMode && (
          <ShareModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
            streamTitle={params.streamTitle || ''}
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
              <Text style={styles.confirmationTitle}>
                {isPracticeMode ? 'End Practice?' : 'End Livestream?'}
              </Text>
              <Text style={styles.confirmationText}>
                {isPracticeMode 
                  ? 'Are you sure you want to end the practice session?\n\nYour settings will be saved for when you go live.'
                  : 'Are you sure you want to end the stream?\n\nYour viewers will be disconnected.'}
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
                    title={isPracticeMode ? 'End Practice' : 'End Stream'}
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
    </>
  );
}

/* ───────────────── VIEWER RANKING MODAL ───────────────── */

interface ViewerRankingModalProps {
  visible: boolean;
  onClose: () => void;
  topViewers: ViewerRanking[];
  totalViewers: number;
}

function ViewerRankingModal({ visible, onClose, topViewers, totalViewers }: ViewerRankingModalProps) {
  const formatWatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.settingsOverlay}>
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Top Viewers</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rankingInfo}>
            <Text style={styles.rankingInfoText}>
              Showing top {Math.min(topViewers.length, 100)} viewers by watch time
            </Text>
            <Text style={styles.rankingInfoSubtext}>
              Total viewers: {totalViewers}
            </Text>
          </View>

          <ScrollView style={styles.rankingList} showsVerticalScrollIndicator={false}>
            {topViewers.length === 0 ? (
              <View style={styles.emptyRanking}>
                <IconSymbol
                  ios_icon_name="person.2.slash"
                  android_material_icon_name="people_outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No viewers yet</Text>
              </View>
            ) : (
              topViewers.map((viewer, index) => (
                <View key={viewer.user_id} style={styles.rankingItem}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  <View style={styles.viewerAvatar}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.viewerDetails}>
                    <Text style={styles.viewerName}>{viewer.display_name}</Text>
                    <Text style={styles.watchTime}>{formatWatchTime(viewer.watch_time_seconds)}</Text>
                  </View>
                  {index < 3 && (
                    <IconSymbol
                      ios_icon_name="trophy.fill"
                      android_material_icon_name="emoji_events"
                      size={20}
                      color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                    />
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────── LIVE SETTINGS MODAL ───────────────── */

interface LiveSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  streamTitle: string;
  liveSeconds: number;
  viewerCount: number;
  peakViewers: number;
  totalGifts: number;
  totalLikes: number;
  isPracticeMode: boolean;
  giftGoal?: string;
  roastGoalViewers?: string;
}

function LiveSettingsModal({
  visible,
  onClose,
  streamTitle,
  liveSeconds,
  viewerCount,
  peakViewers,
  totalGifts,
  totalLikes,
  isPracticeMode,
  giftGoal,
  roastGoalViewers,
}: LiveSettingsModalProps) {
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.settingsOverlay}>
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>
              {isPracticeMode ? 'Practice Settings' : 'Live Settings'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
            {/* Stream Info */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Stream Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>{streamTitle}</Text>
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.infoText}>Duration: {formatTime(liveSeconds)}</Text>
                </View>
                {isPracticeMode && (
                  <View style={styles.practiceInfoBox}>
                    <IconSymbol
                      ios_icon_name="eye.slash.fill"
                      android_material_icon_name="visibility_off"
                      size={16}
                      color={colors.brandPrimary}
                    />
                    <Text style={styles.practiceInfoText}>
                      Practice Mode - No viewers can join
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Goals Progress */}
            {(giftGoal || roastGoalViewers) && (
              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Goals Progress</Text>
                {giftGoal && (
                  <View style={styles.goalProgressCard}>
                    <IconSymbol
                      ios_icon_name="gift.fill"
                      android_material_icon_name="card_giftcard"
                      size={20}
                      color="#FFD700"
                    />
                    <View style={styles.goalProgressInfo}>
                      <Text style={styles.goalProgressLabel}>Gift Goal</Text>
                      <Text style={styles.goalProgressValue}>{giftGoal}</Text>
                      <Text style={styles.goalProgressCurrent}>Current: {totalGifts} gifts</Text>
                    </View>
                  </View>
                )}
                {roastGoalViewers && parseInt(roastGoalViewers, 10) > 0 && (
                  <View style={styles.goalProgressCard}>
                    <IconSymbol
                      ios_icon_name="flame.fill"
                      android_material_icon_name="whatshot"
                      size={20}
                      color="#FF6B00"
                    />
                    <View style={styles.goalProgressInfo}>
                      <Text style={styles.goalProgressLabel}>Roast Goal</Text>
                      <Text style={styles.goalProgressValue}>{roastGoalViewers} viewers</Text>
                      <Text style={styles.goalProgressCurrent}>
                        Current: {viewerCount} / {roastGoalViewers}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Live Stats */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>
                {isPracticeMode ? 'Practice Statistics' : 'Live Statistics'}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={24}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.statValue}>{viewerCount}</Text>
                  <Text style={styles.statLabel}>Current</Text>
                </View>
                <View style={styles.statCard}>
                  <IconSymbol
                    ios_icon_name="chart.line.uptrend.xyaxis"
                    android_material_icon_name="trending_up"
                    size={24}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.statValue}>{peakViewers}</Text>
                  <Text style={styles.statLabel}>Peak</Text>
                </View>
                <View style={styles.statCard}>
                  <IconSymbol
                    ios_icon_name="gift.fill"
                    android_material_icon_name="card_giftcard"
                    size={24}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.statValue}>{totalGifts}</Text>
                  <Text style={styles.statLabel}>Gifts</Text>
                </View>
                <View style={styles.statCard}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={24}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.statValue}>{totalLikes}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.settingsFooter}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────── SHARE MODAL ───────────────── */

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  streamTitle: string;
}

function ShareModal({ visible, onClose, streamTitle }: ShareModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.settingsOverlay}>
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Share Stream</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.shareContent}>
            <Text style={styles.shareTitle}>{streamTitle}</Text>
            <Text style={styles.shareSubtitle}>Share this live stream with your friends!</Text>

            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.shareButton}>
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={32}
                  color={colors.brandPrimary}
                />
                <Text style={styles.shareButtonText}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={32}
                  color={colors.brandPrimary}
                />
                <Text style={styles.shareButtonText}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="share"
                  size={32}
                  color={colors.brandPrimary}
                />
                <Text style={styles.shareButtonText}>More</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsFooter}>
            <GradientButton title="Close" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  topLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  goalsCompact: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    maxWidth: '80%',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  goalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 100,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  practiceBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  practiceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewerCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  viewerCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLabelContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 160 : 150,
    left: 16,
    zIndex: 100,
  },
  rightSideControls: {
    position: 'absolute',
    right: 12,
    bottom: 200,
    gap: 24,
    alignItems: 'center',
    zIndex: 100,
  },
  rightSideButton: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  rightSideButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  disabledText: {
    color: '#666666',
  },
  guestCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.gradientEnd,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guestCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  practiceChatOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    zIndex: 100,
  },
  practiceChatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  practiceChatSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomCenterControls: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  bottomControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomControlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.8)',
    borderColor: colors.brandPrimary,
  },
  metricsBar: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  settingsContent: {
    padding: 20,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  practiceInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: 'rgba(255, 165, 0, 0.5)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  practiceInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  goalProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  goalProgressInfo: {
    flex: 1,
  },
  goalProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  goalProgressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  goalProgressCurrent: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.brandPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  settingsFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareContent: {
    padding: 20,
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  shareSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  shareButton: {
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  rankingInfo: {
    padding: 16,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rankingInfoSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  rankingList: {
    maxHeight: 500,
    padding: 16,
  },
  emptyRanking: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerDetails: {
    flex: 1,
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  watchTime: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
