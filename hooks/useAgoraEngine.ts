
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
  leaveChannel: () => Promise<void>;
  setRemoteVideoStreamType: (uid: number, streamType: any) => Promise<void>;
}

/**
 * useAgoraEngine Hook (Web Fallback)
 * 
 * This is a fallback implementation for web platforms where react-native-agora is not supported.
 * Live streaming is only available on native platforms (iOS/Android).
 */
export function useAgoraEngine({
  streamTitle,
  userId,
  onStreamReady,
  onStreamError,
}: UseAgoraEngineProps): UseAgoraEngineReturn {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webError = new Error('Live streaming is not supported on web. Please use the iOS or Android app.');
    setError(webError.message);
    onStreamError?.(webError);
    console.warn('⚠️ [useAgoraEngine] Web platform detected - Agora is not supported on web');
  }, [onStreamError]);

  const leaveChannel = useCallback(async () => {
    console.log('⚠️ [useAgoraEngine] leaveChannel called on web (no-op)');
  }, []);

  const setRemoteVideoStreamType = useCallback(async (uid: number, streamType: any) => {
    console.log('⚠️ [useAgoraEngine] setRemoteVideoStreamType called on web (no-op)');
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
    leaveChannel,
    setRemoteVideoStreamType,
  };
}

// Export dummy components for web compatibility
export const RtcSurfaceView = () => null;
export const VideoSourceType = {
  VideoSourceCamera: 0,
  VideoSourceRemote: 1,
};
