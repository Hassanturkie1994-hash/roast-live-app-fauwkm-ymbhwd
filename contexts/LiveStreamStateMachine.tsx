
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { agoraService } from '@/app/services/agoraService';
import { supabase } from '@/app/integrations/supabase/client';

type StreamState = 
  | 'IDLE'
  | 'CREATING_STREAM'
  | 'READY'
  | 'LIVE'
  | 'ENDING'
  | 'ENDED'
  | 'ERROR';

interface StreamData {
  streamId: string;
  cloudflareStreamId: string;
  rtmpsUrl: string;
  rtmpsStreamKey: string;
  playbackUrl: string;
}

interface LiveStreamStateMachineContextType {
  state: StreamState;
  streamData: StreamData | null;
  error: string | null;
  startStream: (title: string, contentLabel: string) => Promise<{ success: boolean; streamId?: string; error?: string }>;
  endStream: (streamId: string, saveReplay: boolean) => Promise<{ success: boolean; error?: string }>;
  resetState: () => void;
}

const LiveStreamStateMachineContext = createContext<LiveStreamStateMachineContextType | undefined>(undefined);

/**
 * LiveStreamStateMachineProvider
 * 
 * CRITICAL: This component MUST be exported as a named export
 * and imported with curly braces: import { LiveStreamStateMachineProvider } from '...'
 * 
 * MOUNTED IN: app/_layout.tsx (root level)
 */
export function LiveStreamStateMachineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>('IDLE');
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceVerifiedRef = useRef<boolean>(false);

  const setErrorState = useCallback((errorMessage: string) => {
    console.error('❌ [STATE_MACHINE] Error:', errorMessage);
    setError(errorMessage);
    setState('ERROR');
  }, []);

  // Verify service on mount
  React.useEffect(() => {
    console.log('🔍 [STATE_MACHINE] Verifying agoraService on mount...');
    
    if (!agoraService) {
      console.error('❌ [STATE_MACHINE] agoraService is undefined on mount!');
      serviceVerifiedRef.current = false;
      return;
    }

    if (typeof agoraService.createLiveStream !== 'function') {
      console.error('❌ [STATE_MACHINE] createLiveStream method is missing!');
      console.error('Available methods:', Object.keys(agoraService));
      serviceVerifiedRef.current = false;
      return;
    }

    // Call verification method if available
    if (typeof agoraService.verifyService === 'function') {
      const verified = agoraService.verifyService();
      serviceVerifiedRef.current = verified;
      
      if (verified) {
        console.log('✅ [STATE_MACHINE] agoraService verified successfully');
      } else {
        console.error('❌ [STATE_MACHINE] agoraService verification failed');
      }
    } else {
      // Manual verification
      serviceVerifiedRef.current = true;
      console.log('✅ [STATE_MACHINE] agoraService verified (manual check)');
    }
  }, []);

  const startStream = useCallback(async (title: string, contentLabel: string) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [STATE_MACHINE] Starting stream creation...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Runtime safety guards
    console.log('🔍 [STATE_MACHINE] Step 1: Verifying agoraService...');
    
    // Check 1: Service exists
    if (!agoraService) {
      const errorMsg = 'Agora service is not available. Please restart the app.';
      console.error('❌ [STATE_MACHINE] agoraService is undefined');
      console.error('Type of agoraService:', typeof agoraService);
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] agoraService exists');

    // Check 2: Service is an object
    if (typeof agoraService !== 'object') {
      const errorMsg = 'Agora service is not properly initialized. Please restart the app.';
      console.error('❌ [STATE_MACHINE] agoraService is not an object');
      console.error('Type:', typeof agoraService);
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] agoraService is an object');

    // Check 3: createLiveStream method exists
    if (!agoraService.createLiveStream) {
      const errorMsg = 'Stream creation method is missing. Please restart the app.';
      console.error('❌ [STATE_MACHINE] createLiveStream property is missing');
      console.error('Available properties:', Object.keys(agoraService));
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] createLiveStream property exists');

    // Check 4: createLiveStream is a function
    if (typeof agoraService.createLiveStream !== 'function') {
      const errorMsg = 'Stream creation service is not properly configured. Please restart the app.';
      console.error('❌ [STATE_MACHINE] createLiveStream is not a function');
      console.error('Type:', typeof agoraService.createLiveStream);
      console.error('Available methods:', Object.keys(agoraService));
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] createLiveStream is a function');

    // Check 5: Service was verified on mount
    if (!serviceVerifiedRef.current) {
      console.warn('⚠️ [STATE_MACHINE] Service was not verified on mount, attempting to verify now...');
      
      if (typeof agoraService.verifyService === 'function') {
        const verified = agoraService.verifyService();
        if (!verified) {
          const errorMsg = 'Service verification failed. Please restart the app.';
          console.error('❌ [STATE_MACHINE] Service verification failed');
          setErrorState(errorMsg);
          return { success: false, error: errorMsg };
        }
        serviceVerifiedRef.current = true;
      }
    }

    console.log('✅ [STATE_MACHINE] All service verification checks passed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setState('CREATING_STREAM');
    setError(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.error('⏱️ [STATE_MACHINE] Stream creation timeout (30s)');
      setErrorState('Stream creation timed out. Please try again.');
    }, 30000);

    try {
      console.log('🔍 [STATE_MACHINE] Step 2: Getting authenticated user...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setErrorState('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }
      console.log('✅ [STATE_MACHINE] User authenticated:', user.id);

      console.log('🔍 [STATE_MACHINE] Step 3: Creating Agora stream...');
      console.log('Calling agoraService.createLiveStream()...');
      
      // Wrap service call in try-catch with detailed error logging
      let agoraResult;
      try {
        // Double-check right before calling
        if (typeof agoraService.createLiveStream !== 'function') {
          throw new Error('createLiveStream became undefined right before call');
        }
        
        agoraResult = await agoraService.createLiveStream();
        console.log('✅ [STATE_MACHINE] createLiveStream() call completed');
      } catch (serviceError: any) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const errorMsg = `Service call failed: ${serviceError.message || 'Unknown error'}`;
        console.error('❌ [STATE_MACHINE] Exception calling createLiveStream:', serviceError);
        console.error('Error name:', serviceError.name);
        console.error('Error message:', serviceError.message);
        console.error('Error stack:', serviceError.stack);
        setErrorState(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!agoraResult) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const errorMsg = 'No response from stream creation service';
        console.error('❌ [STATE_MACHINE] agoraResult is null/undefined');
        setErrorState(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('📡 [STATE_MACHINE] Agora result:', agoraResult);

      if (!agoraResult.success || !agoraResult.data) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const errorMsg = agoraResult.error || 'Failed to create Agora stream';
        console.error('❌ [STATE_MACHINE] Agora service returned failure:', errorMsg);
        setErrorState(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('✅ [STATE_MACHINE] Agora stream created successfully');

      console.log('🔍 [STATE_MACHINE] Step 4: Creating database stream record...');
      const { data: stream, error: dbError } = await supabase
        .from('streams')
        .insert({
          broadcaster_id: user.id,
          title,
          status: 'live',
          cloudflare_stream_id: agoraResult.data.uid,
          playback_url: agoraResult.data.playback?.hls || null,
          ingest_url: agoraResult.data.rtmps?.url || null,
          stream_key: agoraResult.data.rtmps?.streamKey || null,
          content_label: contentLabel,
          viewer_count: 0,
        })
        .select()
        .single();

      if (dbError || !stream) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.error('❌ [STATE_MACHINE] Database error:', dbError);
        setErrorState('Failed to create stream record');
        return { success: false, error: 'Failed to create stream record' };
      }

      console.log('✅ [STATE_MACHINE] Stream record created:', stream.id);

      const data: StreamData = {
        streamId: stream.id,
        cloudflareStreamId: agoraResult.data.uid,
        rtmpsUrl: agoraResult.data.rtmps?.url || '',
        rtmpsStreamKey: agoraResult.data.rtmps?.streamKey || '',
        playbackUrl: agoraResult.data.playback?.hls || '',
      };

      setStreamData(data);
      setState('READY');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log('✅ [STATE_MACHINE] Stream ready');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true, streamId: stream.id };
    } catch (error: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('❌ [STATE_MACHINE] Error in startStream:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setErrorState(error.message || 'Failed to start stream');
      return { success: false, error: error.message };
    }
  }, [setErrorState]);

  const endStream = useCallback(async (streamId: string, saveReplay: boolean) => {
    console.log('🛑 [STATE_MACHINE] Ending stream...');
    setState('ENDING');

    try {
      const { error: updateError } = await supabase
        .from('streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', streamId);

      if (updateError) {
        console.error('❌ [STATE_MACHINE] Error updating stream:', updateError);
        setErrorState('Failed to end stream');
        return { success: false, error: 'Failed to end stream' };
      }

      setState('ENDED');
      console.log('✅ [STATE_MACHINE] Stream ended successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [STATE_MACHINE] Error in endStream:', error);
      setErrorState(error.message || 'Failed to end stream');
      return { success: false, error: error.message };
    }
  }, [setErrorState]);

  const resetState = useCallback(() => {
    setState('IDLE');
    setStreamData(null);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Add console log to verify provider is rendering
  React.useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [LiveStreamStateMachineProvider] Mounted and ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return () => {
      console.log('👋 [LiveStreamStateMachineProvider] Unmounting');
    };
  }, []);

  return (
    <LiveStreamStateMachineContext.Provider
      value={{
        state,
        streamData,
        error,
        startStream,
        endStream,
        resetState,
      }}
    >
      {children}
    </LiveStreamStateMachineContext.Provider>
  );
}

/**
 * useLiveStreamStateMachine Hook
 * 
 * CRITICAL: This hook can only be used within components that are
 * wrapped by LiveStreamStateMachineProvider (mounted in app/_layout.tsx)
 * 
 * Usage:
 * const { state, startStream, endStream } = useLiveStreamStateMachine();
 */
export function useLiveStreamStateMachine() {
  const context = useContext(LiveStreamStateMachineContext);
  if (!context) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [useLiveStreamStateMachine] CONTEXT ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('useLiveStreamStateMachine must be used within LiveStreamStateMachineProvider');
    console.error('Check that LiveStreamStateMachineProvider is mounted in app/_layout.tsx');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error('useLiveStreamStateMachine must be used within LiveStreamStateMachineProvider');
  }
  return context;
}

// Legacy export alias for backward compatibility (DEPRECATED)
// This allows old code using LiveStreamStateProvider to still work
export const LiveStreamStateProvider = LiveStreamStateMachineProvider;

// Verify exports are not undefined
if (typeof LiveStreamStateMachineProvider === 'undefined') {
  console.error('❌ CRITICAL: LiveStreamStateMachineProvider is undefined at export time!');
}

if (typeof useLiveStreamStateMachine === 'undefined') {
  console.error('❌ CRITICAL: useLiveStreamStateMachine is undefined at export time!');
}
