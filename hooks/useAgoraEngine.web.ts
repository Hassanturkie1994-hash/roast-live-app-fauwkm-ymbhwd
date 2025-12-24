
import { useState, useCallback } from 'react';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AGORA ENGINE HOOK (WEB STUB)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is a WEB STUB that prevents native Agora modules from being imported
 * on web, which would cause build errors.
 * 
 * PLATFORM SUPPORT:
 * - iOS: ❌ Use useAgoraEngine.native.ts
 * - Android: ❌ Use useAgoraEngine.native.ts
 * - Web: ✅ Returns stub implementation
 * 
 * WHY THIS EXISTS:
 * - react-native-agora is a native module that cannot run on web
 * - Importing it on web causes Metro bundler errors
 * - This stub prevents those imports while maintaining the same API
 * 
 * BEHAVIOR:
 * - All methods are no-ops (do nothing)
 * - isAgoraAvailable is always false
 * - No actual streaming functionality
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

interface RemoteUser {
  uid: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

interface UseAgoraEngineReturn {
  engine: null;
  isAgoraAvailable: boolean;
  initializeEngine: () => Promise<void>;
  joinChannel: (channelName: string, token: string, uid: number) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  switchCamera: () => Promise<void>;
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  localUid: number;
  remoteUsers: RemoteUser[];
  isJoined: boolean;
}

export function useAgoraEngine(): UseAgoraEngineReturn {
  const [isCameraOn] = useState(false);
  const [isMicrophoneOn] = useState(false);
  const [localUid] = useState(0);
  const [remoteUsers] = useState<RemoteUser[]>([]);
  const [isJoined] = useState(false);

  const initializeEngine = useCallback(async () => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  const joinChannel = useCallback(async (channelName: string, token: string, uid: number) => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  const leaveChannel = useCallback(async () => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  const toggleCamera = useCallback(async () => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  const toggleMicrophone = useCallback(async () => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  const switchCamera = useCallback(async () => {
    console.warn('⚠️ [AGORA] Agora is not supported on web');
  }, []);

  return {
    engine: null,
    isAgoraAvailable: false,
    initializeEngine,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    isCameraOn,
    isMicrophoneOn,
    localUid,
    remoteUsers,
    isJoined,
  };
}
