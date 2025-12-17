
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { cloudflareService } from '@/app/services/cloudflareService';
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
    console.log('🔍 [STATE_MACHINE] Verifying cloudflareService on mount...');
    
    if (!cloudflareService) {
      console.error('❌ [STATE_MACHINE] cloudflareService is undefined on mount!');
      serviceVerifiedRef.current = false;
      return;
    }

    if (typeof cloudflareService.createLiveStream !== 'function') {
      console.error('❌ [STATE_MACHINE] createLiveStream method is missing!');
      console.error('Available methods:', Object.keys(cloudflareService));
      serviceVerifiedRef.current = false;
      return;
    }

    // Call verification method if available
    if (typeof cloudflareService.verifyService === 'function') {
      const verified = cloudflareService.verifyService();
      serviceVerifiedRef.current = verified;
      
      if (verified) {
        console.log('✅ [STATE_MACHINE] cloudflareService verified successfully');
      } else {
        console.error('❌ [STATE_MACHINE] cloudflareService verification failed');
      }
    } else {
      // Manual verification
      serviceVerifiedRef.current = true;
      console.log('✅ [STATE_MACHINE] cloudflareService verified (manual check)');
    }
  }, []);

  const startStream = useCallback(async (title: string, contentLabel: string) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [STATE_MACHINE] Starting stream creation...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // CRITICAL FIX: Runtime safety guards
    console.log('🔍 [STATE_MACHINE] Step 1: Verifying cloudflareService...');
    
    // Check 1: Service exists
    if (!cloudflareService) {
      const errorMsg = 'Cloudflare service is not available. Please restart the app.';
      console.error('❌ [STATE_MACHINE] cloudflareService is undefined');
      console.error('Type of cloudflareService:', typeof cloudflareService);
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] cloudflareService exists');

    // Check 2: Service is an object
    if (typeof cloudflareService !== 'object') {
      const errorMsg = 'Cloudflare service is not properly initialized. Please restart the app.';
      console.error('❌ [STATE_MACHINE] cloudflareService is not an object');
      console.error('Type:', typeof cloudflareService);
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] cloudflareService is an object');

    // Check 3: createLiveStream method exists
    if (!cloudflareService.createLiveStream) {
      const errorMsg = 'Stream creation method is missing. Please restart the app.';
      console.error('❌ [STATE_MACHINE] createLiveStream property is missing');
      console.error('Available properties:', Object.keys(cloudflareService));
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] createLiveStream property exists');

    // Check 4: createLiveStream is a function
    if (typeof cloudflareService.createLiveStream !== 'function') {
      const errorMsg = 'Stream creation service is not properly configured. Please restart the app.';
      console.error('❌ [STATE_MACHINE] createLiveStream is not a function');
      console.error('Type:', typeof cloudflareService.createLiveStream);
      console.error('Available methods:', Object.keys(cloudflareService));
      setErrorState(errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log('✅ [STATE_MACHINE] createLiveStream is a function');

    // Check 5: Service was verified on mount
    if (!serviceVerifiedRef.current) {
      console.warn('⚠️ [STATE_MACHINE] Service was not verified on mount, attempting to verify now...');
      
      if (typeof cloudflareService.verifyService === 'function') {
        const verified = cloudflareService.verifyService();
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

      console.log('🔍 [STATE_MACHINE] Step 3: Creating Cloudflare stream...');
      console.log('Calling cloudflareService.createLiveStream()...');
      
      // CRITICAL FIX: Wrap service call in try-catch with detailed error logging
      let cloudflareResult;
      try {
        // Double-check right before calling
        if (typeof cloudflareService.createLiveStream !== 'function') {
          throw new Error('createLiveStream became undefined right before call');
        }
        
        cloudflareResult = await cloudflareService.createLiveStream();
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

      if (!cloudflareResult) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const errorMsg = 'No response from stream creation service';
        console.error('❌ [STATE_MACHINE] cloudflareResult is null/undefined');
        setErrorState(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('📡 [STATE_MACHINE] Cloudflare result:', cloudflareResult);

      if (!cloudflareResult.success || !cloudflareResult.data) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const errorMsg = cloudflareResult.error || 'Failed to create Cloudflare stream';
        console.error('❌ [STATE_MACHINE] Cloudflare service returned failure:', errorMsg);
        setErrorState(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('✅ [STATE_MACHINE] Cloudflare stream created successfully');

      console.log('🔍 [STATE_MACHINE] Step 4: Creating database stream record...');
      const { data: stream, error: dbError } = await supabase
        .from('streams')
        .insert({
          broadcaster_id: user.id,
          title,
          status: 'live',
          cloudflare_stream_id: cloudflareResult.data.uid,
          playback_url: cloudflareResult.data.playback?.hls || null,
          ingest_url: cloudflareResult.data.rtmps?.url || null,
          stream_key: cloudflareResult.data.rtmps?.streamKey || null,
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
        cloudflareStreamId: cloudflareResult.data.uid,
        rtmpsUrl: cloudflareResult.data.rtmps?.url || '',
        rtmpsStreamKey: cloudflareResult.data.rtmps?.streamKey || '',
        playbackUrl: cloudflareResult.data.playback?.hls || '',
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
