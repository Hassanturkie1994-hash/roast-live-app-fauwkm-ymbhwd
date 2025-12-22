
import { useState, useEffect, useRef, useCallback } from 'react';
import Constants from 'expo-constants';

// Conditionally import Agora SDK
let createAgoraRtcEngine: any;
let IRtcEngine: any;
let ChannelProfileType: any;
let ClientRoleType: any;
let RtcConnection: any;
let UserOfflineReasonType: any;
let VideoStreamType: any;
let AudioVolumeInfo: any;
let RtcSurfaceView: any;
let VideoSourceType: any;

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    // Only import Agora in dev client or standalone builds
    const AgoraSDK = require('react-native-agora');
    createAgoraRtcEngine = AgoraSDK.createAgoraRtcEngine;
    IRtcEngine = AgoraSDK.IRtcEngine;
    ChannelProfileType = AgoraSDK.ChannelProfileType;
    ClientRoleType = AgoraSDK.ClientRoleType;
    RtcConnection = AgoraSDK.RtcConnection;
    UserOfflineReasonType = AgoraSDK.UserOfflineReasonType;
    VideoStreamType = AgoraSDK.VideoStreamType;
    AudioVolumeInfo = AgoraSDK.AudioVolumeInfo;
    RtcSurfaceView = AgoraSDK.RtcSurfaceView;
    VideoSourceType = AgoraSDK.VideoSourceType;
  } catch (error) {
    console.warn('⚠️ [useAgoraEngine] Failed to load react-native-agora:', error);
  }
}

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
  engine: any | null;
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
 * Mock Agora Engine for Expo Go
 * 
 * This mock engine logs all method calls to the console and provides
 * a compatible interface for development in Expo Go.
 */
function createMockAgoraEngine() {
  console.log('🎭 [MOCK AGORA] Creating mock Agora engine for Expo Go');
  
  return {
    initialize: (config: any) => {
      console.log('🎭 [MOCK AGORA] initialize() called with config:', config);
    },
    enableDualStreamMode: (enabled: boolean) => {
      console.log('🎭 [MOCK AGORA] enableDualStreamMode() called:', enabled);
    },
    setDualStreamMode: (config: any) => {
      console.log('🎭 [MOCK AGORA] setDualStreamMode() called with config:', config);
    },
    registerEventHandler: (handlers: any) => {
      console.log('🎭 [MOCK AGORA] registerEventHandler() called');
      // Simulate successful join after 1 second
      setTimeout(() => {
        if (handlers.onJoinChannelSuccess) {
          console.log('🎭 [MOCK AGORA] Simulating onJoinChannelSuccess');
          handlers.onJoinChannelSuccess({ channelId: 'mock-channel' }, 0);
        }
      }, 1000);
    },
    setChannelProfile: (profile: any) => {
      console.log('🎭 [MOCK AGORA] setChannelProfile() called:', profile);
    },
    setClientRole: (role: any) => {
      console.log('🎭 [MOCK AGORA] setClientRole() called:', role);
    },
    enableVideo: () => {
      console.log('🎭 [MOCK AGORA] enableVideo() called');
    },
    enableAudio: () => {
      console.log('🎭 [MOCK AGORA] enableAudio() called');
    },
    enableAudioVolumeIndication: (interval: number, smooth: number, reportLocal: boolean) => {
      console.log('🎭 [MOCK AGORA] enableAudioVolumeIndication() called:', { interval, smooth, reportLocal });
    },
    startPreview: () => {
      console.log('🎭 [MOCK AGORA] startPreview() called');
    },
    joinChannel: async (token: string, channelName: string, uid: number, options: any) => {
      console.log('🎭 [MOCK AGORA] joinChannel() called:', { channelName, uid });
      return Promise.resolve();
    },
    leaveChannel: async () => {
      console.log('🎭 [MOCK AGORA] leaveChannel() called');
      return Promise.resolve();
    },
    release: () => {
      console.log('🎭 [MOCK AGORA] release() called');
    },
    setRemoteVideoStreamType: async (uid: number, streamType: any) => {
      console.log('🎭 [MOCK AGORA] setRemoteVideoStreamType() called:', { uid, streamType });
      return Promise.resolve();
    },
  };
}

/**
 * useAgoraEngine Hook (Native - iOS/Android)
 * 
 * Manages Agora RTC Engine lifecycle for multi-guest live streaming
 * 
 * EXPO GO SUPPORT:
 * - Detects Expo Go environment using Constants.appOwnership
 * - Returns mock engine in Expo Go with isMocked: true
 * - Full Agora functionality in dev client or standalone builds
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
  const [engine, setEngine] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [isMocked, setIsMocked] = useState(false);
  
  const engineRef = useRef<any | null>(null);
  const isMountedRef = useRef(true);
  const speakingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Initialize Agora Engine (or mock in Expo Go)
  useEffect(() => {
    isMountedRef.current = true;

    const initializeAgora = async () => {
      try {
        console.log('🎯 [useAgoraEngine] Initializing Agora RTC Engine...');
        console.log('🎯 [useAgoraEngine] Environment:', isExpoGo ? 'Expo Go' : 'Dev Client/Standalone');

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

        // Check if we're in Expo Go
        if (isExpoGo) {
          console.log('🎭 [useAgoraEngine] Expo Go detected - using mock engine');
          const mockEngine = createMockAgoraEngine();
          engineRef.current = mockEngine;
          setEngine(mockEngine);
          setIsMocked(true);
          setIsInitialized(true);

          // Initialize mock engine
          mockEngine.initialize({
            appId: agoraConfig.appId,
            channelProfile: 'ChannelProfileLiveBroadcasting',
          });

          mockEngine.enableDualStreamMode(true);
          mockEngine.setDualStreamMode({
            streamConfig: {
              width: 320,
              height: 240,
              framerate: 15,
              bitrate: 200,
            },
          });

          mockEngine.registerEventHandler({
            onJoinChannelSuccess: (connection: any, elapsed: number) => {
              console.log('✅ [MOCK AGORA] Joined channel successfully:', connection.channelId);
              if (isMountedRef.current) {
                setIsJoined(true);
                onStreamReady?.(startLiveData.stream.id);
              }
            },
          });

          mockEngine.setChannelProfile('ChannelProfileLiveBroadcasting');
          mockEngine.setClientRole('ClientRoleBroadcaster');
          mockEngine.enableVideo();
          mockEngine.enableAudio();
          mockEngine.enableAudioVolumeIndication(200, 3, true);
          mockEngine.startPreview();

          await mockEngine.joinChannel(
            agoraConfig.token,
            agoraConfig.channelName,
            agoraConfig.uid,
            { clientRoleType: 'ClientRoleBroadcaster' }
          );

          console.log('✅ [MOCK AGORA] Mock engine initialized and joined');
          return;
        }

        // Real Agora implementation for dev client/standalone
        if (!createAgoraRtcEngine) {
          throw new Error('Agora SDK not available. Please build a dev client or standalone app.');
        }

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
          onJoinChannelSuccess: (connection: any, elapsed: number) => {
            console.log('✅ [useAgoraEngine] Joined channel successfully:', connection.channelId);
            if (isMountedRef.current) {
              setIsJoined(true);
              onStreamReady?.(startLiveData.stream.id);
            }
          },
          onUserJoined: (connection: any, remoteUid: number, elapsed: number) => {
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
            connection: any,
            remoteUid: number,
            reason: any
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
            connection: any,
            speakers: any[],
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
      const timeouts = speakingTimeoutsRef.current;
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [streamTitle, userId, onStreamReady, onStreamError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (engineRef.current && !isMocked) {
          try {
            console.log('🧹 [useAgoraEngine] Cleaning up Agora engine...');
            await engineRef.current.leaveChannel();
            engineRef.current.release();
            console.log('✅ [useAgoraEngine] Cleanup complete');
          } catch (err) {
            console.error('❌ [useAgoraEngine] Cleanup error:', err);
          }
        } else if (engineRef.current && isMocked) {
          console.log('🧹 [MOCK AGORA] Cleaning up mock engine...');
          await engineRef.current.leaveChannel();
        }
      };

      cleanup();
    };
  }, [isMocked]);

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

  const setRemoteVideoStreamType = useCallback(async (uid: number, streamType: any) => {
    if (engineRef.current && !isMocked) {
      try {
        console.log(`🔄 [useAgoraEngine] Setting stream type for UID ${uid} to ${streamType === VideoStreamType?.VideoStreamHigh ? 'HIGH' : 'LOW'}`);
        await engineRef.current.setRemoteVideoStreamType(uid, streamType);
      } catch (err) {
        console.error('❌ [useAgoraEngine] Error setting stream type:', err);
      }
    } else if (isMocked) {
      console.log(`🎭 [MOCK AGORA] setRemoteVideoStreamType called for UID ${uid}`);
    }
  }, [isMocked]);

  return {
    engine,
    isInitialized,
    isJoined,
    remoteUids,
    error,
    streamId,
    channelName,
    speakingUids,
    isMocked,
    leaveChannel,
    setRemoteVideoStreamType,
  };
}

// Export Agora types and components for use in native screens
// In Expo Go, these will be mock components
export { RtcSurfaceView, VideoSourceType };
