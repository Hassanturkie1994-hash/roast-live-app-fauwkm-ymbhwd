
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
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
  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

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
    return <View style={commonStyles.container} />;
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
      
      await cloudflareService.stopLive({
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });

      console.log('✅ Stream ended successfully');

      // Stop stream timer and update database
      if (user) {
        await stopStreamTimer(user.id);
      }

      // Reset all state
      setIsLive(false);
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStream(null);

      // Show tab bar again
      console.log('✅ Stream ended - showing tab bar');
      setIsStreaming(false);

      Alert.alert('Stream Ended', 'Your live stream has been ended successfully.');
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to end stream. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
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
      <CameraView style={styles.camera} facing={facing} />

      <View style={styles.overlay}>
        {isLive && (
          <>
            <View style={styles.topBar}>
              <LiveBadge size="small" />
              <View style={styles.statsContainer}>
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

            <View style={styles.watermarkContainer}>
              <RoastLiveLogo size="small" opacity={0.25} />
            </View>

            {currentStream && (
              <ChatOverlay streamId={currentStream.id} isBroadcaster={true} />
            )}
          </>
        )}

        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
              onPress={() => setIsMicOn(!isMicOn)}
              disabled={isLoading}
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
                Your stream will be broadcast live to all viewers. Make sure you have a stable internet connection!
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
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
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
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
