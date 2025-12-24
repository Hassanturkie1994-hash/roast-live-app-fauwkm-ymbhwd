
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import RtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngineEventHandler,
  RtcConnection,
  UserOfflineReasonType,
} from 'react-native-agora';
import Constants from 'expo-constants';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AGORA ENGINE HOOK (NATIVE - iOS/Android)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is the NATIVE implementation of the Agora RTC engine hook.
 * 
 * PLATFORM SUPPORT:
 * - iOS: ✅ Full Agora support
 * - Android: ✅ Full Agora support
 * - Web: ❌ Use useAgoraEngine.web.ts instead
 * 
 * FEATURES:
 * - Initialize Agora RTC engine
 * - Join/leave channels
 * - Toggle camera and microphone
 * - Switch between front/back camera
 * - Track remote users
 * - Handle connection events
 * 
 * ENVIRONMENT VARIABLES:
 * - EXPO_PUBLIC_AGORA_APP_ID: Your Agora App ID
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

interface RemoteUser {
  uid: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

interface UseAgoraEngineReturn {
  engine: RtcEngine | null;
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

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export function useAgoraEngine(): UseAgoraEngineReturn {
  const [engine, setEngine] = useState<RtcEngine | null>(null);
  const [isAgoraAvailable] = useState(!isExpoGo);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [localUid, setLocalUid] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);

  const engineRef = useRef<RtcEngine | null>(null);

  // Initialize Agora engine
  const initializeEngine = useCallback(async () => {
    if (!isAgoraAvailable) {
      console.warn('⚠️ [AGORA] Not available in Expo Go');
      return;
    }

    if (engineRef.current) {
      console.log('✅ [AGORA] Engine already initialized');
      return;
    }

    try {
      console.log('🚀 [AGORA] Initializing engine...');

      const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error('EXPO_PUBLIC_AGORA_APP_ID is not set');
      }

      // Create engine instance
      const agoraEngine = RtcEngine.create(appId);
      
      // Set channel profile to live broadcasting
      await agoraEngine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      
      // Set client role to broadcaster
      await agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      // Enable video
      await agoraEngine.enableVideo();
      
      // Enable audio
      await agoraEngine.enableAudio();

      // Register event handlers
      agoraEngine.addListener('onJoinChannelSuccess', (connection: RtcConnection, elapsed: number) => {
        console.log('✅ [AGORA] Joined channel successfully:', connection.channelId);
        setLocalUid(connection.localUid);
        setIsJoined(true);
      });

      agoraEngine.addListener('onUserJoined', (connection: RtcConnection, remoteUid: number, elapsed: number) => {
        console.log('👤 [AGORA] Remote user joined:', remoteUid);
        setRemoteUsers((prev) => [
          ...prev,
          { uid: remoteUid, hasAudio: false, hasVideo: false },
        ]);
      });

      agoraEngine.addListener('onUserOffline', (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
        console.log('👤 [AGORA] Remote user left:', remoteUid);
        setRemoteUsers((prev) => prev.filter((user) => user.uid !== remoteUid));
      });

      agoraEngine.addListener('onRemoteVideoStateChanged', (connection: RtcConnection, remoteUid: number, state: number) => {
        console.log('📹 [AGORA] Remote video state changed:', remoteUid, state);
        setRemoteUsers((prev) =>
          prev.map((user) =>
            user.uid === remoteUid ? { ...user, hasVideo: state === 2 } : user
          )
        );
      });

      agoraEngine.addListener('onRemoteAudioStateChanged', (connection: RtcConnection, remoteUid: number, state: number) => {
        console.log('🎤 [AGORA] Remote audio state changed:', remoteUid, state);
        setRemoteUsers((prev) =>
          prev.map((user) =>
            user.uid === remoteUid ? { ...user, hasAudio: state === 2 } : user
          )
        );
      });

      agoraEngine.addListener('onError', (err: number, msg: string) => {
        console.error('❌ [AGORA] Error:', err, msg);
      });

      engineRef.current = agoraEngine;
      setEngine(agoraEngine);

      console.log('✅ [AGORA] Engine initialized successfully');
    } catch (error) {
      console.error('❌ [AGORA] Failed to initialize engine:', error);
      throw error;
    }
  }, [isAgoraAvailable]);

  // Join channel
  const joinChannel = useCallback(async (channelName: string, token: string, uid: number) => {
    if (!engineRef.current) {
      console.error('❌ [AGORA] Engine not initialized');
      return;
    }

    try {
      console.log('🚀 [AGORA] Joining channel:', channelName);
      await engineRef.current.joinChannel(token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (error) {
      console.error('❌ [AGORA] Failed to join channel:', error);
      throw error;
    }
  }, []);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    if (!engineRef.current) {
      console.error('❌ [AGORA] Engine not initialized');
      return;
    }

    try {
      console.log('🚪 [AGORA] Leaving channel...');
      await engineRef.current.leaveChannel();
      setIsJoined(false);
      setRemoteUsers([]);
      console.log('✅ [AGORA] Left channel successfully');
    } catch (error) {
      console.error('❌ [AGORA] Failed to leave channel:', error);
      throw error;
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!engineRef.current) {
      console.error('❌ [AGORA] Engine not initialized');
      return;
    }

    try {
      const newState = !isCameraOn;
      await engineRef.current.enableLocalVideo(newState);
      setIsCameraOn(newState);
      console.log(`📹 [AGORA] Camera ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ [AGORA] Failed to toggle camera:', error);
    }
  }, [isCameraOn]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!engineRef.current) {
      console.error('❌ [AGORA] Engine not initialized');
      return;
    }

    try {
      const newState = !isMicrophoneOn;
      await engineRef.current.enableLocalAudio(newState);
      setIsMicrophoneOn(newState);
      console.log(`🎤 [AGORA] Microphone ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ [AGORA] Failed to toggle microphone:', error);
    }
  }, [isMicrophoneOn]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!engineRef.current) {
      console.error('❌ [AGORA] Engine not initialized');
      return;
    }

    try {
      await engineRef.current.switchCamera();
      console.log('🔄 [AGORA] Camera switched');
    } catch (error) {
      console.error('❌ [AGORA] Failed to switch camera:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        console.log('🧹 [AGORA] Cleaning up engine...');
        engineRef.current.leaveChannel();
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return {
    engine,
    isAgoraAvailable,
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
