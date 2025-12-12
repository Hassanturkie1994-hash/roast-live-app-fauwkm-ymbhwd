
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, Dimensions } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { colors } from '@/styles/commonStyles';

// Import WebRTC for native platforms
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let mediaDevices: any;
let RTCView: any;

if (Platform.OS !== 'web') {
  try {
    // Dynamic import for react-native-webrtc
    import('react-native-webrtc').then((WebRTC) => {
      RTCPeerConnection = WebRTC.RTCPeerConnection;
      RTCSessionDescription = WebRTC.RTCSessionDescription;
      mediaDevices = WebRTC.mediaDevices;
      RTCView = WebRTC.RTCView;
      console.log('✅ react-native-webrtc loaded successfully');
    }).catch((error) => {
      console.log('⚠️ react-native-webrtc not available:', error);
    });
  } catch (error) {
    console.log('⚠️ react-native-webrtc not available:', error);
  }
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

// Calculate optimal camera dimensions for 9:16 aspect ratio
const ASPECT_RATIO = 9 / 16;
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;
const FALLBACK_WIDTH = 720;
const FALLBACK_HEIGHT = 1280;

/**
 * WebRTC Live Publisher Component
 * 
 * This component handles WebRTC streaming to Cloudflare with TikTok-style vertical format.
 * 
 * Camera Settings:
 * - Resolution target: 1080x1920 (Full HD vertical)
 * - Fallback resolution: 720x1280
 * - Aspect ratio: 9:16 (portrait mode)
 * - Framerate: 30-60 fps (device dependent)
 * 
 * Native Build Support:
 * - Uses react-native-webrtc for native iOS/Android builds
 * - Uses browser WebRTC API for web
 * - Cloudflare WebRTC streaming uses WHIP (WebRTC-HTTP Ingestion Protocol)
 */
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
  const peerConnectionRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);

  const startWebRTCStreamNative = useCallback(async () => {
    try {
      if (!mediaDevices || !RTCPeerConnection) {
        throw new Error('WebRTC not available - using camera preview only');
      }

      console.log('🎬 Starting native WebRTC stream');

      // Get user media (camera and microphone) with TikTok-style vertical settings
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: TARGET_WIDTH, min: FALLBACK_WIDTH },
          height: { ideal: TARGET_HEIGHT, min: FALLBACK_HEIGHT },
          aspectRatio: { ideal: ASPECT_RATIO },
          frameRate: { ideal: 60, min: 30 },
          facingMode: facing === 'front' ? 'user' : 'environment',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Log actual video settings
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('📹 Native camera settings:', {
        width: settings.width,
        height: settings.height,
        aspectRatio: settings.aspectRatio,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode,
      });

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add tracks to peer connection
      stream.getTracks().forEach((track: any) => {
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to Cloudflare using WHIP protocol
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

      // Get answer from Cloudflare
      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await peerConnection.setRemoteDescription(answer);

      setIsStreaming(true);
      console.log('✅ Native WebRTC streaming started successfully');

      if (onStreamStarted) {
        onStreamStarted();
      }

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          const error = new Error('WebRTC connection failed');
          setError(error.message);
          if (onStreamError) {
            onStreamError(error);
          }
        }
      };
    } catch (err) {
      console.error('❌ Error starting native WebRTC stream:', err);
      throw err;
    }
  }, [rtcPublishUrl, facing, onStreamStarted, onStreamError]);

  const startWebRTCStreamWeb = useCallback(async () => {
    try {
      console.log('🎬 Starting web WebRTC stream');

      // Get user media (camera and microphone) with TikTok-style vertical settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: TARGET_WIDTH, min: FALLBACK_WIDTH },
          height: { ideal: TARGET_HEIGHT, min: FALLBACK_HEIGHT },
          aspectRatio: { ideal: ASPECT_RATIO },
          frameRate: { ideal: 60, min: 30 },
          facingMode: facing === 'front' ? 'user' : 'environment',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      });

      localStreamRef.current = stream;

      // Log actual video settings
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('📹 Web camera settings:', {
        width: settings.width,
        height: settings.height,
        aspectRatio: settings.aspectRatio,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode,
      });

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to Cloudflare using WHIP protocol
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

      // Get answer from Cloudflare
      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await peerConnection.setRemoteDescription(answer);

      setIsStreaming(true);
      console.log('✅ Web WebRTC streaming started successfully');

      if (onStreamStarted) {
        onStreamStarted();
      }

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          const error = new Error('WebRTC connection failed');
          setError(error.message);
          if (onStreamError) {
            onStreamError(error);
          }
        }
      };
    } catch (err) {
      console.error('❌ Error starting web WebRTC stream:', err);
      throw err;
    }
  }, [rtcPublishUrl, facing, onStreamStarted, onStreamError]);

  const initializeWebRTCStream = useCallback(async () => {
    try {
      console.log('🎬 Initializing WebRTC stream to:', rtcPublishUrl);
      setIsInitializing(true);

      if (Platform.OS === 'web') {
        // Web platform
        if (typeof RTCPeerConnection !== 'undefined') {
          await startWebRTCStreamWeb();
        } else {
          throw new Error('WebRTC not supported in this browser');
        }
      } else {
        // Native platforms (iOS/Android)
        // Wait a bit for react-native-webrtc to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mediaDevices && RTCPeerConnection) {
          await startWebRTCStreamNative();
        } else {
          console.log('📱 WebRTC native module not available, showing camera preview only');
          setError('WebRTC streaming requires native build. Camera preview is shown.');
          
          // Still call onStreamStarted to allow camera preview
          if (onStreamStarted) {
            onStreamStarted();
          }
        }
      }
    } catch (err) {
      console.error('❌ Error initializing WebRTC:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize WebRTC');
      setError(error.message);
      if (onStreamError) {
        onStreamError(error);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [rtcPublishUrl, startWebRTCStreamWeb, startWebRTCStreamNative, onStreamStarted, onStreamError]);

  useEffect(() => {
    if (rtcPublishUrl) {
      initializeWebRTCStream();
    }

    return () => {
      cleanup();
    };
  }, [rtcPublishUrl]);

  const cleanup = () => {
    console.log('🧹 Cleaning up WebRTC resources');

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
    setLocalStream(null);
  };

  // For native platforms with WebRTC support, show RTCView
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
            <Text style={styles.streamingText}>Streaming via WebRTC</Text>
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

  // For native platforms without WebRTC or as fallback, show camera preview
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
            <Text style={styles.initializingText}>Initializing stream...</Text>
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

  // For web, show video element with WebRTC stream
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
              <Text style={styles.streamingText}>Streaming via WebRTC</Text>
            </View>
          )}
          {isInitializing && (
            <View style={styles.initializingOverlay}>
              <Text style={styles.initializingText}>Initializing stream...</Text>
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
