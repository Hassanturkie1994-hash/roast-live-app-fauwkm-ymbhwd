
import { useState, useEffect, useCallback } from 'react';

interface UseAgoraEngineProps {
  streamTitle: string;
  userId: string;
  onStreamReady?: (streamId: string) => void;
  onStreamError?: (error: Error) => void;
}

interface UseAgoraEngineReturn {
  engine: null;
  isInitialized: boolean;
  isJoined: boolean;
  remoteUids: number[];
  error: string | null;
  streamId: string | null;
  channelName: string | null;
  speakingUids: number[];
  isMocked: boolean;
  leaveChannel: () => Promise<void>;
  setRemoteVideoStreamType: (uid: number, streamType: any) => Promise<void>;
}

/**
 * useAgoraEngine Hook (Web Stub)
 * 
 * This is a stub implementation for web that prevents importing react-native-agora.
 * Web builds do not support native Agora streaming.
 * 
 * Users should use Android/iOS dev builds for full streaming functionality.
 */
export function useAgoraEngine({
  streamTitle,
  userId,
  onStreamReady,
  onStreamError,
}: UseAgoraEngineProps): UseAgoraEngineReturn {
  const [error] = useState<string | null>(
    'Streaming is not supported on web. Please use Android or iOS dev build.'
  );

  useEffect(() => {
    console.warn('⚠️ [useAgoraEngine.web] Agora streaming is not supported on web');
    console.warn('⚠️ [useAgoraEngine.web] Please build and run on Android/iOS for streaming');
    
    // Notify error callback
    if (onStreamError) {
      onStreamError(new Error('Streaming is not supported on web. Please use Android or iOS dev build.'));
    }
  }, [onStreamError]);

  const leaveChannel = useCallback(async () => {
    console.log('🌐 [useAgoraEngine.web] leaveChannel() - stub implementation');
  }, []);

  const setRemoteVideoStreamType = useCallback(async (uid: number, streamType: any) => {
    console.log('🌐 [useAgoraEngine.web] setRemoteVideoStreamType() - stub implementation');
  }, []);

  return {
    engine: null,
    isInitialized: false,
    isJoined: false,
    remoteUids: [],
    error,
    streamId: null,
    channelName: null,
    speakingUids: [],
    isMocked: true,
    leaveChannel,
    setRemoteVideoStreamType,
  };
}

// Export stub types for web
export const RtcSurfaceView = null;
export const VideoSourceType = null;
