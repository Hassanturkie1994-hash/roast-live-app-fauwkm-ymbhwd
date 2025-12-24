/**
 * useAgoraEngine Hook - Platform Fallback
 * 
 * This file serves as a fallback for platforms that don't have
 * platform-specific implementations.
 * 
 * Platform-specific implementations:
 * - useAgoraEngine.native.ts - For iOS/Android (real Agora SDK)
 * - useAgoraEngine.web.ts - For Web (stub implementation)
 * 
 * This fallback should never be used in production as all platforms
 * have their own implementations.
 */

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

export function useAgoraEngine({
  streamTitle,
  userId,
  onStreamReady,
  onStreamError,
}: UseAgoraEngineProps): UseAgoraEngineReturn {
  const [error] = useState<string | null>(
    'Platform not supported. This fallback should not be used.'
  );

  useEffect(() => {
    console.error('❌ [useAgoraEngine] Fallback implementation used - this should not happen');
    console.error('❌ [useAgoraEngine] Platform-specific implementation not found');
    
    if (onStreamError) {
      onStreamError(new Error('Platform not supported'));
    }
  }, [onStreamError]);

  const leaveChannel = useCallback(async () => {
    console.log('⚠️ [useAgoraEngine] leaveChannel() - fallback stub');
  }, []);

  const setRemoteVideoStreamType = useCallback(async (uid: number, streamType: any) => {
    console.log('⚠️ [useAgoraEngine] setRemoteVideoStreamType() - fallback stub');
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

// Export stub types
export const RtcSurfaceView = null;
export const VideoSourceType = null;
