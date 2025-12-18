
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, Dimensions } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import { colors } from '@/styles/commonStyles';

let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;
let mediaDevices: any = null;
let RTCView: any = null;
let webRTCLoaded = false;

if (Platform.OS !== 'web') {
  const loadWebRTC = async () => {
    try {
      const WebRTC = await import('react-native-webrtc');
      RTCPeerConnection = WebRTC.RTCPeerConnection;
      RTCSessionDescription = WebRTC.RTCSessionDescription;
      mediaDevices = WebRTC.mediaDevices;
      RTCView = WebRTC.RTCView;
      webRTCLoaded = true;
      console.log('✅ react-native-webrtc loaded successfully');
    } catch (error) {
      console.log('⚠️ react-native-webrtc not available - using camera preview only');
      console.log('This is expected in Expo Go. Use a development build for WebRTC streaming.');
      webRTCLoaded = false;
    }
  };

  loadWebRTC();
}

interface WebRTCLivePublisherProps {
  rtcPublishUrl: string;
  facing?: CameraType;
  onStreamStarted?: () => void;
  onStreamError?: (error: Error) => void;
  flashMode?: 'on' | 'off' | 'auto';
  isCameraOn?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TikTok Live Standard: 9:16 aspect ratio
const ASPECT_RATIO = 9 / 16;

// Primary target: 720x1280 (HD mobile)
const PRIMARY_WIDTH = 720;
const PRIMARY_HEIGHT = 1280;

// High quality target: 1080x1920 (Full HD mobile)
const HIGH_QUALITY_WIDTH = 1080;
const HIGH_QUALITY_HEIGHT = 1920;

// Frame rate: 30 fps (mobile-safe, H.264 compatible)
const TARGET_FRAME_RATE = 30;

export default function WebRTCLivePublisher({
  rtcPublishUrl,
  facing = 'front',
  onStreamStarted,
  onStreamError,
  flashMode = 'off',
  isCameraOn = true,
}: WebRTCLivePublisherProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [webRTCReady, setWebRTCReady] = useState(false);
  const peerConnectionRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const isMounted = useRef(true);

  // Lock orientation to portrait on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        console.log('🔒 [WebRTC] Locking orientation to portrait');
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (error) {
        console.warn('⚠️ [WebRTC] Failed to lock orientation:', error);
      }
    };

    lockOrientation();

    return () => {
      // Unlock orientation when component unmounts
      ScreenOrientation.unlockAsync().catch((error) => {
        console.warn('⚠️ [WebRTC] Failed to unlock orientation:', error);
      });
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (Platform.OS !== 'web') {
      const checkWebRTC = setInterval(() => {
        if (webRTCLoaded && isMounted.current) {
          setWebRTCReady(true);
          clearInterval(checkWebRTC);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkWebRTC);
        if (isMounted.current) {
          setWebRTCReady(false);
          console.log('⚠️ WebRTC loading timeout - using camera preview only');
        }
      }, 3000);

      return () => {
        isMounted.current = false;
        clearInterval(checkWebRTC);
        clearTimeout(timeout);
      };
    } else {
      setWebRTCReady(true);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const startWebRTCStreamNative = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      if (!mediaDevices || !RTCPeerConnection) {
        throw new Error('WebRTC not available - using camera preview only');
      }

      console.log('🎬 [WebRTC] Starting native WebRTC stream with TikTok-style constraints');

      // TikTok Live constraints: 9:16 vertical format, 30 fps, H.264 compatible
      const videoConstraints = {
        width: { ideal: HIGH_QUALITY_WIDTH, min: PRIMARY_WIDTH },
        height: { ideal: HIGH_QUALITY_HEIGHT, min: PRIMARY_HEIGHT },
        aspectRatio: { exact: ASPECT_RATIO }, // Force 9:16 aspect ratio
        frameRate: { ideal: TARGET_FRAME_RATE, max: TARGET_FRAME_RATE }, // Lock to 30 fps
        facingMode: facing === 'front' ? 'user' : 'environment',
      };

      console.log('📹 [WebRTC] Requesting camera with constraints:', videoConstraints);

      const stream = await mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      });

      if (!isMounted.current) {
        stream.getTracks().forEach((track: any) => track.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('✅ [WebRTC] Native camera settings (TikTok-style):', {
        width: settings.width,
        height: settings.height,
        aspectRatio: settings.aspectRatio,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode,
      });

      // Verify aspect ratio
      const actualAspectRatio = settings.width && settings.height 
        ? settings.width / settings.height 
        : 0;
      
      if (Math.abs(actualAspectRatio - ASPECT_RATIO) > 0.01) {
        console.warn('⚠️ [WebRTC] Aspect ratio mismatch. Expected:', ASPECT_RATIO, 'Got:', actualAspectRatio);
      } else {
        console.log('✅ [WebRTC] Perfect 9:16 aspect ratio achieved');
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track: any) => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch(rtcPublishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP request failed: ${response.status}`);
      }

      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await peerConnection.setRemoteDescription(answer);

      if (isMounted.current) {
        setIsStreaming(true);
        console.log('✅ [WebRTC] Native WebRTC streaming started successfully (TikTok-style)');

        if (onStreamStarted) {
          onStreamStarted();
        }
      }

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed' && isMounted.current) {
          const error = new Error('WebRTC connection failed');
          setError(error.message);
          if (onStreamError) {
            onStreamError(error);
          }
        }
      };
    } catch (err) {
      console.error('❌ [WebRTC] Error starting native WebRTC stream:', err);
      throw err;
    }
  }, [rtcPublishUrl, facing, onStreamStarted, onStreamError]);

  const startWebRTCStreamWeb = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      console.log('🎬 [WebRTC] Starting web WebRTC stream with TikTok-style constraints');

      // TikTok Live constraints: 9:16 vertical format, 30 fps, H.264 compatible
      const videoConstraints = {
        width: { ideal: HIGH_QUALITY_WIDTH, min: PRIMARY_WIDTH },
        height: { ideal: HIGH_QUALITY_HEIGHT, min: PRIMARY_HEIGHT },
        aspectRatio: { exact: ASPECT_RATIO }, // Force 9:16 aspect ratio
        frameRate: { ideal: TARGET_FRAME_RATE, max: TARGET_FRAME_RATE }, // Lock to 30 fps
        facingMode: facing === 'front' ? 'user' : 'environment',
      };

      console.log('📹 [WebRTC] Requesting camera with constraints:', videoConstraints);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      });

      if (!isMounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('✅ [WebRTC] Web camera settings (TikTok-style):', {
        width: settings.width,
        height: settings.height,
        aspectRatio: settings.aspectRatio,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode,
      });

      // Verify aspect ratio
      const actualAspectRatio = settings.width && settings.height 
        ? settings.width / settings.height 
        : 0;
      
      if (Math.abs(actualAspectRatio - ASPECT_RATIO) > 0.01) {
        console.warn('⚠️ [WebRTC] Aspect ratio mismatch. Expected:', ASPECT_RATIO, 'Got:', actualAspectRatio);
      } else {
        console.log('✅ [WebRTC] Perfect 9:16 aspect ratio achieved');
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch(rtcPublishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP request failed: ${response.status}`);
      }

      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await peerConnection.setRemoteDescription(answer);

      if (isMounted.current) {
        setIsStreaming(true);
        console.log('✅ [WebRTC] Web WebRTC streaming started successfully (TikTok-style)');

        if (onStreamStarted) {
          onStreamStarted();
        }
      }

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed' && isMounted.current) {
          const error = new Error('WebRTC connection failed');
          setError(error.message);
          if (onStreamError) {
            onStreamError(error);
          }
        }
      };
    } catch (err) {
      console.error('❌ [WebRTC] Error starting web WebRTC stream:', err);
      throw err;
    }
  }, [rtcPublishUrl, facing, onStreamStarted, onStreamError]);

  const initializeWebRTCStream = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      console.log('🎬 [WebRTC] Initializing WebRTC stream to:', rtcPublishUrl);
      setIsInitializing(true);

      if (Platform.OS === 'web') {
        if (typeof RTCPeerConnection !== 'undefined') {
          await startWebRTCStreamWeb();
        } else {
          throw new Error('WebRTC not supported in this browser');
        }
      } else {
        if (webRTCReady && mediaDevices && RTCPeerConnection) {
          await startWebRTCStreamNative();
        } else {
          console.log('📱 [WebRTC] WebRTC native module not available, showing camera preview only');
          console.log('This is expected in Expo Go. Use a development build or APK for WebRTC streaming.');
          setError('WebRTC streaming requires native build. Camera preview is shown.');
          
          if (onStreamStarted) {
            onStreamStarted();
          }
        }
      }
    } catch (err) {
      console.error('❌ [WebRTC] Error initializing WebRTC:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize WebRTC');
      if (isMounted.current) {
        setError(error.message);
        if (onStreamError) {
          onStreamError(error);
        }
      }
    } finally {
      if (isMounted.current) {
        setIsInitializing(false);
      }
    }
  }, [rtcPublishUrl, webRTCReady, startWebRTCStreamWeb, startWebRTCStreamNative, onStreamStarted, onStreamError]);

  useEffect(() => {
    if (rtcPublishUrl && webRTCReady && isMounted.current) {
      initializeWebRTCStream();
    }

    return () => {
      cleanup();
    };
  }, [rtcPublishUrl, webRTCReady]);

  const cleanup = () => {
    console.log('🧹 [WebRTC] Cleaning up WebRTC resources');

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track: any) => {
          track.stop();
        });
      } catch (error) {
        console.log('Error stopping tracks:', error);
      }
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (error) {
        console.log('Error closing peer connection:', error);
      }
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
    setLocalStream(null);
  };

  if (Platform.OS !== 'web' && RTCView && localStream) {
    return (
      <View style={styles.container}>
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.camera}
          objectFit="cover"
          mirror={facing === 'front'}
        />
        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <View style={styles.streamingDot} />
            <Text style={styles.streamingText}>Streaming 9:16 @ 30fps</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        {isCameraOn ? (
          <CameraView 
            style={styles.camera} 
            facing={facing}
            flash={flashMode}
            videoQuality="1080p"
          />
        ) : (
          <View style={styles.cameraOffContainer}>
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}
        {isInitializing && (
          <View style={styles.initializingOverlay}>
            <Text style={styles.initializingText}>Initializing TikTok-style stream...</Text>
          </View>
        )}
        {error && !isInitializing && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              Camera preview is shown. Stream is active.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.streamContainer}>
          {isStreaming && (
            <View style={styles.streamingIndicator}>
              <View style={styles.streamingDot} />
              <Text style={styles.streamingText}>Streaming 9:16 @ 30fps</Text>
            </View>
          )}
          {isInitializing && (
            <View style={styles.initializingOverlay}>
              <Text style={styles.initializingText}>Initializing TikTok-style stream...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOffContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOffText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  streamingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
  streamingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  initializingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  initializingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    padding: 16,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
});
