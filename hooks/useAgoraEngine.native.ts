
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  UserOfflineReasonType,
  VideoStreamType,
  AudioVolumeInfo,
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
  remoteUids: number[];
  error: string | null;
  streamId: string | null;
  channelName: string | null;
  speakingUids: number[];
  leaveChannel: () => Promise<void>;
  setRemoteVideoStreamType: (uid: number, streamType: VideoStreamType) => Promise<void>;
}

/**
 * useAgoraEngine Hook (Native - iOS/Android)
 * 
 * Manages Agora RTC Engine lifecycle for multi-guest live streaming
 * 
 * Features:
 * - Initializes Agora RTC Engine with dual-stream mode
 * - Fetches token from start-live edge function
 * - Joins channel as PUBLISHER
 * - Tracks multiple remote users (up to 10 simultaneous streamers)
 * - Subscribes to Low quality streams by default for bandwidth optimization
 * - Provides method to switch specific users to High quality
 * - Tracks speaking users via audio volume indication
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
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  
  const engineRef = useRef<IRtcEngine | null>(null);
  const isMountedRef = useRef(true);
  const speakingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

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

        // Enable dual-stream mode (Simulcast)
        agoraEngine.enableDualStreamMode(true);
        console.log('✅ [useAgoraEngine] Dual-stream mode enabled');

        // Set low-quality stream parameters
        agoraEngine.setDualStreamMode({
          streamConfig: {
            width: 320,
            height: 240,
            framerate: 15,
            bitrate: 200, // 200 kbps
          },
        });
        console.log('✅ [useAgoraEngine] Low-quality stream configured');

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
              setRemoteUids(prev => {
                if (!prev.includes(remoteUid)) {
                  const newUids = [...prev, remoteUid];
                  console.log('📊 [useAgoraEngine] Total remote users:', newUids.length);
                  
                  // Subscribe to low quality stream by default for bandwidth optimization
                  if (newUids.length > 2) {
                    console.log('🔄 [useAgoraEngine] Subscribing to LOW quality for UID:', remoteUid);
                    agoraEngine.setRemoteVideoStreamType(remoteUid, VideoStreamType.VideoStreamLow);
                  } else {
                    console.log('🔄 [useAgoraEngine] Subscribing to HIGH quality for UID:', remoteUid);
                    agoraEngine.setRemoteVideoStreamType(remoteUid, VideoStreamType.VideoStreamHigh);
                  }
                  
                  return newUids;
                }
                return prev;
              });
            }
          },
          onUserOffline: (
            connection: RtcConnection,
            remoteUid: number,
            reason: UserOfflineReasonType
          ) => {
            console.log('👋 [useAgoraEngine] Remote user left:', remoteUid, 'reason:', reason);
            if (isMountedRef.current) {
              setRemoteUids(prev => {
                const newUids = prev.filter(uid => uid !== remoteUid);
                console.log('📊 [useAgoraEngine] Total remote users:', newUids.length);
                return newUids;
              });
              
              // Clear speaking indicator
              setSpeakingUids(prev => prev.filter(uid => uid !== remoteUid));
              
              // Clear speaking timeout
              const timeout = speakingTimeoutsRef.current.get(remoteUid);
              if (timeout) {
                clearTimeout(timeout);
                speakingTimeoutsRef.current.delete(remoteUid);
              }
            }
          },
          onAudioVolumeIndication: (
            connection: RtcConnection,
            speakers: AudioVolumeInfo[],
            speakerNumber: number,
            totalVolume: number
          ) => {
            // Update speaking indicators based on audio volume
            if (isMountedRef.current) {
              const activeSpeakers = speakers
                .filter(speaker => speaker.volume > 10) // Threshold for speaking
                .map(speaker => speaker.uid);
              
              // Update speaking UIDs
              setSpeakingUids(activeSpeakers);
              
              // Set timeouts to clear speaking indicators after 1 second of silence
              activeSpeakers.forEach(uid => {
                // Clear existing timeout
                const existingTimeout = speakingTimeoutsRef.current.get(uid);
                if (existingTimeout) {
                  clearTimeout(existingTimeout);
                }
                
                // Set new timeout
                const timeout = setTimeout(() => {
                  setSpeakingUids(prev => prev.filter(id => id !== uid));
                  speakingTimeoutsRef.current.delete(uid);
                }, 1000);
                
                speakingTimeoutsRef.current.set(uid, timeout);
              });
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

        // Enable video and audio
        agoraEngine.enableVideo();
        agoraEngine.enableAudio();

        // Enable audio volume indication (for speaking indicator)
        agoraEngine.enableAudioVolumeIndication(200, 3, true); // 200ms interval, 3 smooth, report local

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
      
      // Clear all speaking timeouts
      speakingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      speakingTimeoutsRef.current.clear();
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
        setRemoteUids([]);
        setSpeakingUids([]);
        console.log('✅ [useAgoraEngine] Left channel successfully');
      } catch (err) {
        console.error('❌ [useAgoraEngine] Error leaving channel:', err);
        throw err;
      }
    }
  }, []);

  const setRemoteVideoStreamType = useCallback(async (uid: number, streamType: VideoStreamType) => {
    if (engineRef.current) {
      try {
        console.log(`🔄 [useAgoraEngine] Setting stream type for UID ${uid} to ${streamType === VideoStreamType.VideoStreamHigh ? 'HIGH' : 'LOW'}`);
        await engineRef.current.setRemoteVideoStreamType(uid, streamType);
      } catch (err) {
        console.error('❌ [useAgoraEngine] Error setting stream type:', err);
      }
    }
  }, []);

  return {
    engine,
    isInitialized,
    isJoined,
    remoteUids,
    error,
    streamId,
    channelName,
    speakingUids,
    leaveChannel,
    setRemoteVideoStreamType,
  };
}

// Export Agora types and components for use in native screens
export { RtcSurfaceView, VideoSourceType } from 'react-native-agora';
