
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  UserOfflineReasonType,
} from 'react-native-agora';
import { supabase } from '@/app/integrations/supabase/client';

interface AgoraConfig {
  token: string;
  channelName: string;
  uid: number;
  appId: string;
}

interface UseAgoraEngineProps {
  streamTitle: string;
  userId: string;
  onStreamReady?: (streamId: string) => void;
  onStreamError?: (error: Error) => void;
}

interface UseAgoraEngineReturn {
  engine: IRtcEngine | null;
  isInitialized: boolean;
  isJoined: boolean;
  remoteUid: number | null;
  error: string | null;
  streamId: string | null;
  channelName: string | null;
  leaveChannel: () => Promise<void>;
}

/**
 * useAgoraEngine Hook (Native - iOS/Android)
 * 
 * Manages Agora RTC Engine lifecycle for live streaming
 * 
 * Features:
 * - Initializes Agora RTC Engine
 * - Fetches token from start-live edge function
 * - Joins channel as PUBLISHER
 * - Tracks remote users (for 1v1 battles)
 * - Handles cleanup on unmount
 */
export function useAgoraEngine({
  streamTitle,
  userId,
  onStreamReady,
  onStreamError,
}: UseAgoraEngineProps): UseAgoraEngineReturn {
  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  
  const engineRef = useRef<IRtcEngine | null>(null);
  const isMountedRef = useRef(true);

  // Initialize Agora Engine
  useEffect(() => {
    isMountedRef.current = true;

    const initializeAgora = async () => {
      try {
        console.log('🎯 [useAgoraEngine] Initializing Agora RTC Engine...');

        // Call start-live edge function to get token and channel info
        const { data: startLiveData, error: startLiveError } = await supabase.functions.invoke(
          'start-live',
          {
            body: {
              title: streamTitle,
              user_id: userId,
            },
          }
        );

        if (startLiveError) {
          throw new Error(`Failed to start stream: ${startLiveError.message}`);
        }

        if (!startLiveData?.success) {
          throw new Error(startLiveData?.error || 'Failed to start stream');
        }

        const agoraConfig: AgoraConfig = {
          token: startLiveData.agora.token,
          channelName: startLiveData.agora.channelName,
          uid: startLiveData.agora.uid,
          appId: startLiveData.agora.appId,
        };

        console.log('✅ [useAgoraEngine] Received Agora config:', {
          channelName: agoraConfig.channelName,
          uid: agoraConfig.uid,
          hasToken: !!agoraConfig.token,
        });

        if (!isMountedRef.current) return;

        setStreamId(startLiveData.stream.id);
        setChannelName(agoraConfig.channelName);

        // Create Agora RTC Engine
        const agoraEngine = createAgoraRtcEngine();
        engineRef.current = agoraEngine;

        // Initialize engine
        agoraEngine.initialize({
          appId: agoraConfig.appId,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });

        console.log('✅ [useAgoraEngine] Engine initialized');

        // Register event handlers
        agoraEngine.registerEventHandler({
          onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
            console.log('✅ [useAgoraEngine] Joined channel successfully:', connection.channelId);
            if (isMountedRef.current) {
              setIsJoined(true);
              onStreamReady?.(startLiveData.stream.id);
            }
          },
          onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
            console.log('👤 [useAgoraEngine] Remote user joined:', remoteUid);
            if (isMountedRef.current) {
              setRemoteUid(remoteUid);
            }
          },
          onUserOffline: (
            connection: RtcConnection,
            remoteUid: number,
            reason: UserOfflineReasonType
          ) => {
            console.log('👋 [useAgoraEngine] Remote user left:', remoteUid, 'reason:', reason);
            if (isMountedRef.current) {
              setRemoteUid(null);
            }
          },
          onError: (err: number, msg: string) => {
            console.error('❌ [useAgoraEngine] Agora error:', err, msg);
            if (isMountedRef.current) {
              setError(`Agora error: ${msg}`);
              onStreamError?.(new Error(msg));
            }
          },
        });

        // Set channel profile and client role
        agoraEngine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
        agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        // Enable video
        agoraEngine.enableVideo();
        agoraEngine.enableAudio();

        // Start preview
        agoraEngine.startPreview();

        console.log('✅ [useAgoraEngine] Video/Audio enabled, preview started');

        if (!isMountedRef.current) return;

        setEngine(agoraEngine);
        setIsInitialized(true);

        // Join channel
        console.log('🚀 [useAgoraEngine] Joining channel:', agoraConfig.channelName);
        
        await agoraEngine.joinChannel(
          agoraConfig.token,
          agoraConfig.channelName,
          agoraConfig.uid,
          {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          }
        );

        console.log('✅ [useAgoraEngine] Join channel request sent');
      } catch (err) {
        console.error('❌ [useAgoraEngine] Initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Agora';
        if (isMountedRef.current) {
          setError(errorMessage);
          onStreamError?.(err instanceof Error ? err : new Error(errorMessage));
        }
      }
    };

    initializeAgora();

    return () => {
      isMountedRef.current = false;
    };
  }, [streamTitle, userId, onStreamReady, onStreamError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (engineRef.current) {
          try {
            console.log('🧹 [useAgoraEngine] Cleaning up Agora engine...');
            await engineRef.current.leaveChannel();
            engineRef.current.release();
            console.log('✅ [useAgoraEngine] Cleanup complete');
          } catch (err) {
            console.error('❌ [useAgoraEngine] Cleanup error:', err);
          }
        }
      };

      cleanup();
    };
  }, []);

  const leaveChannel = useCallback(async () => {
    if (engineRef.current) {
      try {
        console.log('👋 [useAgoraEngine] Leaving channel...');
        await engineRef.current.leaveChannel();
        setIsJoined(false);
        setRemoteUid(null);
        console.log('✅ [useAgoraEngine] Left channel successfully');
      } catch (err) {
        console.error('❌ [useAgoraEngine] Error leaving channel:', err);
        throw err;
      }
    }
  }, []);

  return {
    engine,
    isInitialized,
    isJoined,
    remoteUid,
    error,
    streamId,
    channelName,
    leaveChannel,
  };
}
