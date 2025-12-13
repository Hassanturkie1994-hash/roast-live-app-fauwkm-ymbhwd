
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';

import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { IconSymbol } from '@/components/IconSymbol';
import ChatOverlay from '@/components/ChatOverlay';
import WebRTCLivePublisher from '@/components/WebRTCLivePublisher';

import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';

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

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');

  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [isLive, setIsLive] = useState(false);
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [webRTCUrl, setWebRTCUrl] = useState<string | null>(null);

  const [viewerCount, setViewerCount] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRef = useRef<any>(null);

  /* ───────────────── AUTH GUARD ───────────────── */
  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user]);

  /* ───────────────── PERMISSIONS ───────────────── */
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  /* ───────────────── LIVE TIMER ───────────────── */
  useEffect(() => {
    if (!isLive) return;

    timerRef.current = setInterval(() => {
      setLiveSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  /* ───────────────── VIEWER COUNT ───────────────── */
  const subscribeViewers = useCallback((streamId: string) => {
    const channel = supabase
      .channel(`stream:${streamId}`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        setViewerCount(payload.payload?.count ?? 0);
      })
      .subscribe();

    realtimeRef.current = channel;
  }, []);

  const cleanupRealtime = () => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
  };

  /* ───────────────── START STREAM ───────────────── */
  const startLive = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a stream title');
      return;
    }

    setLoading(true);

    try {
      setIsStreaming(true);

      const result = await cloudflareService.startLive({
        title: streamTitle,
        userId: user!.id,
      });

      setCurrentStream(result.stream);
      setWebRTCUrl(result.ingest.webRTC_url || null);

      // IMPORTANT: stream is now considered live
      setIsLive(true);
      setLiveSeconds(0);
      setViewerCount(0);
      setShowSetup(false);
      setStreamTitle('');

      startStreamTimer();
      subscribeViewers(result.stream.id);

      Alert.alert('You are LIVE', 'Your stream is now live');
    } catch (e: any) {
      setIsStreaming(false);
      Alert.alert('Failed to start stream', e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────── END STREAM ───────────────── */
  const endLive = async () => {
    if (!currentStream) return;

    setLoading(true);

    try {
      await cloudflareService.stopLive({
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });
    } catch (_) {
      // graceful
    }

    cleanupRealtime();
    stopStreamTimer(user!.id);

    setIsLive(false);
    setCurrentStream(null);
    setWebRTCUrl(null);
    setViewerCount(0);
    setLiveSeconds(0);
    setIsStreaming(false);

    Alert.alert('Stream ended');
    setLoading(false);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ───────────────── RENDER ───────────────── */

  if (!permission?.granted) {
    return (
      <View style={commonStyles.container}>
        <Text style={{ color: colors.text }}>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* VIDEO LAYER */}
      {!webRTCUrl && <CameraView style={StyleSheet.absoluteFill} facing={facing} />}
      {webRTCUrl && isLive && (
        <WebRTCLivePublisher rtcPublishUrl={webRTCUrl} facing={facing} />
      )}

      {/* OVERLAY */}
      {isLive && currentStream && (
        <>
          <View style={styles.topBar}>
            <LiveBadge />
            <Text style={styles.stat}>{viewerCount} viewers</Text>
            <Text style={styles.stat}>{formatTime(liveSeconds)}</Text>
          </View>

          <RoastLiveLogo style={styles.watermark} opacity={0.25} />

          <ChatOverlay streamId={currentStream.id} isBroadcaster />
        </>
      )}

      {/* CONTROLS - Positioned higher to avoid navigation bar */}
      <View style={styles.controls}>
        <GradientButton
          title={isLive ? 'END LIVE' : 'GO LIVE'}
          onPress={() => (isLive ? endLive() : setShowSetup(true))}
          disabled={loading}
        />
      </View>

      {/* SETUP MODAL */}
      <Modal visible={showSetup} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Setup Your Stream</Text>
            <TextInput
              placeholder="Stream title"
              placeholderTextColor={colors.textSecondary}
              value={streamTitle}
              onChangeText={setStreamTitle}
              style={styles.input}
            />
            <GradientButton title="START LIVE" onPress={startLive} loading={loading} />
            <TouchableOpacity onPress={() => setShowSetup(false)} style={styles.cancelButton}>
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    color: '#fff',
    fontWeight: '600',
  },
  watermark: {
    position: 'absolute',
    bottom: 200,
    right: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
  },
});
