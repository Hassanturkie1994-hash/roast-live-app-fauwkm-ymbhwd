
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
  remoteUid: number | null;
  error: string | null;
  streamId: string | null;
  channelName: string | null;
  leaveChannel: () => Promise<void>;
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

  return {
    engine: null,
    isInitialized: false,
    isJoined: false,
    remoteUid: null,
    error,
    streamId: null,
    channelName: null,
    leaveChannel,
  };
}
