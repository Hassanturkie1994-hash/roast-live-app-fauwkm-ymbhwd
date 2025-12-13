
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { router } from 'expo-router';
import ChatOverlay from '@/components/ChatOverlay';
import WebRTCLivePublisher from '@/components/WebRTCLivePublisher';

interface StreamData {
  id: string;
  live_input_id: string;
  title: string;
  status: string;
  playback_url: string;
}

export default function BroadcasterScreen() {
  const { user } = useAuth();
  const { setIsStreaming, startStreamTimer, stopStreamTimer } = useStreaming();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webRTCUrl, setWebRTCUrl] = useState<string | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  // Request permissions on mount
  useEffect(() => {
    const requestPerms = async () => {
      if (!permission?.granted) {
        console.log('📷 Requesting camera permissions...');
        const result = await requestPermission();
        if (result.granted) {
          console.log('✅ Camera permissions granted');
        } else {
          console.log('❌ Camera permissions denied');
        }
      }
    };
    requestPerms();
  }, []);

  useEffect(() => {
    if (isLive) {
      timerIntervalRef.current = setInterval(() => {
        setLiveTime((prev) => prev + 1);
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
    if (!currentStream?.id) return;

    const channel = supabase
      .channel(`stream:${currentStream.id}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('👥 Viewer count update:', payload);
        setViewerCount(payload.payload.count || 0);
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [currentStream?.id]);

  useEffect(() => {
    if (isLive && currentStream?.id) {
      subscribeToViewerUpdates();
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [isLive, currentStream?.id, subscribeToViewerUpdates]);

  if (!permission) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[commonStyles.container, styles.permissionContainer]}>
        <IconSymbol
          ios_icon_name="video.fill"
          android_material_icon_name="videocam"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <Text style={styles.permissionSubtext}>
          Camera and microphone access are required to broadcast live streams
        </Text>
        <GradientButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleStartLiveSetup = () => {
    if (isLive) {
      Alert.alert(
        'End Stream',
        'Are you sure you want to end your live stream?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Stream',
            style: 'destructive',
            onPress: endStream,
          },
        ]
      );
    } else {
      // Hide tab bar when opening setup modal
      console.log('🎬 Opening live setup - hiding tab bar');
      setIsStreaming(true);
      setShowSetup(true);
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

    setIsLoading(true);

    try {
      console.log('🎬 Starting live stream with title:', streamTitle);
      
      const result = await cloudflareService.startLive({ 
        title: streamTitle, 
        userId: user.id 
      });

      console.log('✅ Stream created successfully:', result);

      // Store the stream data
      setCurrentStream(result.stream);
      setIsLive(true);
      setViewerCount(0);
      setLiveTime(0);
      setShowSetup(false);
      setStreamTitle('');

      // Start stream timer for tracking
      startStreamTimer();

      // Set WebRTC URL if available
      if (result.ingest.webRTC_url) {
        setWebRTCUrl(result.ingest.webRTC_url);
        console.log('📺 WebRTC URL set:', result.ingest.webRTC_url);
      } else {
        console.log('⚠️ No WebRTC URL available, using camera preview only');
      }

      console.log('📺 Stream details:', {
        id: result.stream.id,
        live_input_id: result.stream.live_input_id,
        playback_url: result.stream.playback_url,
        webRTC_url: result.ingest.webRTC_url,
      });

      Alert.alert(
        '🔴 You are LIVE!',
        'Your stream is now broadcasting. Viewers can watch you live!',
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
        [{ text: 'OK' }]
      );
      
      // Show tab bar again if stream failed to start
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
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

      // Try to stop the stream, but don't fail if it errors
      try {
        await cloudflareService.stopLive({
          liveInputId: currentStream.live_input_id,
          streamId: currentStream.id,
        });
        console.log('✅ Stream ended successfully via Edge Function');
      } catch (stopError) {
        console.error('⚠️ Error stopping stream via Edge Function:', stopError);
        // Continue anyway - we'll update the database directly
        
        // Update database directly as fallback
        const { error: dbError } = await supabase
          .from('streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('id', currentStream.id);
        
        if (dbError) {
          console.error('❌ Error updating database:', dbError);
        } else {
          console.log('✅ Stream ended successfully via direct database update');
        }
      }

      // Stop stream timer and update database
      if (user) {
        await stopStreamTimer(user.id);
      }

      // Reset all state
      setIsLive(false);
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStream(null);
      setWebRTCUrl(null);

      // Show tab bar again
      console.log('✅ Stream ended - showing tab bar');
      setIsStreaming(false);

      Alert.alert('Stream Ended', 'Your live stream has been ended successfully.');
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      
      // Even if there's an error, reset the UI state
      setIsLive(false);
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStream(null);
      setWebRTCUrl(null);
      setIsStreaming(false);
      
      Alert.alert(
        'Stream Ended',
        'Your stream has been ended, but there may have been an issue with cleanup.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSetup = () => {
    console.log('❌ Cancelled live setup - showing tab bar');
    setShowSetup(false);
    setStreamTitle('');
    // Show tab bar again when cancelling setup
    setIsStreaming(false);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={commonStyles.container}>
      {/* Camera View - Always show when not streaming or when streaming without WebRTC */}
      {(!isLive || !webRTCUrl) && (
        <CameraView 
          style={styles.camera} 
          facing={facing}
          videoQuality="1080p"
        />
      )}

      {/* WebRTC Publisher - Only show when streaming with WebRTC URL */}
      {isLive && webRTCUrl && (
        <WebRTCLivePublisher
          rtcPublishUrl={webRTCUrl}
          facing={facing}
          isCameraOn={isCameraOn}
          onStreamStarted={() => console.log('WebRTC stream started')}
          onStreamError={(error) => {
            console.error('WebRTC error:', error);
            Alert.alert('Streaming Error', error.message);
          }}
        />
      )}

      {/* OVERLAY LAYER - ALWAYS ABOVE VIDEO - GUARANTEED VISIBILITY */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {isLive && (
          <>
            <View style={styles.topBar} pointerEvents="box-none">
              <LiveBadge size="small" />
              <View style={styles.statsContainer} pointerEvents="box-none">
                <View style={styles.stat}>
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.statText}>{viewerCount}</Text>
                </View>
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

            <View style={styles.watermarkContainer} pointerEvents="none">
              <RoastLiveLogo size="small" opacity={0.25} />
            </View>

            {/* CHAT OVERLAY - ALWAYS RENDERED WHEN LIVE */}
            {currentStream && (
              <View style={styles.chatContainer} pointerEvents="box-none">
                <ChatOverlay streamId={currentStream.id} isBroadcaster={true} />
              </View>
            )}
          </>
        )}

        <View style={styles.controlsContainer} pointerEvents="box-none">
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
              onPress={() => setIsMicOn(!isMicOn)}
              disabled={!isLive || isLoading}
            >
              <IconSymbol
                ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
                android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <View style={styles.startButtonContainer}>
              <GradientButton
                title={isLive ? 'END STREAM' : 'GO LIVE'}
                onPress={handleStartLiveSetup}
                size="large"
                disabled={isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              disabled={isLoading}
            >
              <IconSymbol
                ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                android_material_icon_name="flip_camera_ios"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showSetup}
        transparent
        animationType="slide"
        onRequestClose={() => !isLoading && handleCancelSetup()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RoastLiveLogo size="medium" style={styles.modalLogo} />
            <Text style={styles.modalTitle}>Setup Your Stream</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Stream Title</Text>
              <TextInput
                style={styles.input}
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
              <Text style={styles.infoText}>
                Your camera will automatically start streaming when you go live. Make sure you have a stable internet connection!
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSetup}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.goLiveButtonContainer}>
                <GradientButton
                  title={isLoading ? 'STARTING...' : 'GO LIVE'}
                  onPress={startStream}
                  size="medium"
                  disabled={isLoading}
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
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 110,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    pointerEvents: 'none',
    zIndex: 110,
  },
  chatContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    zIndex: 120,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
    zIndex: 110,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
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
  startButtonContainer: {
    marginHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
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
    color: colors.text,
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
  goLiveButtonContainer: {
    flex: 1,
  },
});
