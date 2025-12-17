
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
 */
export function LiveStreamStateMachineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>('IDLE');
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setErrorState = useCallback((errorMessage: string) => {
    console.error('❌ [STATE_MACHINE] Error:', errorMessage);
    setError(errorMessage);
    setState('ERROR');
  }, []);

  const startStream = useCallback(async (title: string, contentLabel: string) => {
    console.log('🚀 [STATE_MACHINE] Starting stream creation...');
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setErrorState('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📡 [STATE_MACHINE] Creating Cloudflare stream...');
      const cloudflareResult = await cloudflareService.createLiveStream();

      if (!cloudflareResult.success || !cloudflareResult.data) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setErrorState(cloudflareResult.error || 'Failed to create Cloudflare stream');
        return { success: false, error: cloudflareResult.error };
      }

      console.log('✅ [STATE_MACHINE] Cloudflare stream created');

      console.log('💾 [STATE_MACHINE] Creating database stream record...');
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
      return { success: true, streamId: stream.id };
    } catch (error: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('❌ [STATE_MACHINE] Error in startStream:', error);
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
    console.log('✅ [LiveStreamStateMachineProvider] Mounted and ready');
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

// Verify export is not undefined
if (typeof LiveStreamStateMachineProvider === 'undefined') {
  console.error('❌ CRITICAL: LiveStreamStateMachineProvider is undefined at export time!');
}

export function useLiveStreamStateMachine() {
  const context = useContext(LiveStreamStateMachineContext);
  if (!context) {
    throw new Error('useLiveStreamStateMachine must be used within LiveStreamStateMachineProvider');
  }
  return context;
}

// Legacy export alias for backward compatibility (DEPRECATED)
// This allows old code using LiveStreamStateProvider to still work
export const LiveStreamStateProvider = LiveStreamStateMachineProvider;
