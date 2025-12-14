
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

/**
 * Live Stream State Machine
 * 
 * States:
 * - IDLE: No stream activity
 * - PRE_LIVE_SETUP: User is in pre-live setup screen
 * - CONTENT_LABEL_SELECTED: Content label has been selected
 * - PRACTICE_MODE_ACTIVE: Practice mode is enabled (optional)
 * - STREAM_CREATING: Creating Cloudflare stream (async, non-blocking)
 * - STREAM_READY: Stream created successfully
 * - BROADCASTING: Live stream is active
 * - STREAM_ENDED: Stream has ended
 * - ERROR: Error occurred during stream lifecycle
 */

export type LiveStreamState =
  | 'IDLE'
  | 'PRE_LIVE_SETUP'
  | 'CONTENT_LABEL_SELECTED'
  | 'PRACTICE_MODE_ACTIVE'
  | 'STREAM_CREATING'
  | 'STREAM_READY'
  | 'BROADCASTING'
  | 'STREAM_ENDED'
  | 'ERROR';

interface LiveStreamStateContextType {
  currentState: LiveStreamState;
  previousState: LiveStreamState | null;
  error: string | null;
  
  // State transitions
  enterPreLiveSetup: () => void;
  selectContentLabel: () => void;
  enablePracticeMode: () => void;
  disablePracticeMode: () => void;
  startStreamCreation: () => void;
  streamCreated: () => void;
  startBroadcasting: () => void;
  endStream: () => void;
  setError: (error: string) => void;
  resetToIdle: () => void;
  
  // State checks
  canGoLive: () => boolean;
  isInSetup: () => boolean;
  isCreatingStream: () => boolean;
  isLive: () => boolean;
  hasError: () => boolean;
}

const LiveStreamStateContext = createContext<LiveStreamStateContextType | undefined>(undefined);

/**
 * LiveStreamStateProvider - Manages the live stream state machine
 * 
 * CRITICAL: This component MUST be exported as a named export
 * FIX ISSUE 1: Renamed from LiveStreamStateMachineProvider to LiveStreamStateProvider
 * to match the import in _layout.tsx
 */
export function LiveStreamStateProvider({ children }: { children: ReactNode }) {
  const [currentState, setCurrentState] = useState<LiveStreamState>('IDLE');
  const [previousState, setPreviousState] = useState<LiveStreamState | null>(null);
  const [error, setErrorState] = useState<string | null>(null);

  const transitionTo = useCallback((newState: LiveStreamState) => {
    console.log(`🔄 [STATE MACHINE] ${currentState} → ${newState}`);
    setPreviousState(currentState);
    setCurrentState(newState);
    
    // Clear error when transitioning away from ERROR state
    if (currentState === 'ERROR' && newState !== 'ERROR') {
      setErrorState(null);
    }
  }, [currentState]);

  const enterPreLiveSetup = useCallback(() => {
    if (currentState === 'IDLE' || currentState === 'STREAM_ENDED') {
      transitionTo('PRE_LIVE_SETUP');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot enter PRE_LIVE_SETUP from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const selectContentLabel = useCallback(() => {
    if (currentState === 'PRE_LIVE_SETUP') {
      transitionTo('CONTENT_LABEL_SELECTED');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot select content label from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const enablePracticeMode = useCallback(() => {
    if (currentState === 'PRE_LIVE_SETUP' || currentState === 'CONTENT_LABEL_SELECTED') {
      transitionTo('PRACTICE_MODE_ACTIVE');
    }
  }, [currentState, transitionTo]);

  const disablePracticeMode = useCallback(() => {
    if (currentState === 'PRACTICE_MODE_ACTIVE') {
      transitionTo('CONTENT_LABEL_SELECTED');
    }
  }, [currentState, transitionTo]);

  const startStreamCreation = useCallback(() => {
    const validStates = ['CONTENT_LABEL_SELECTED', 'PRACTICE_MODE_ACTIVE', 'PRE_LIVE_SETUP'];
    if (validStates.includes(currentState)) {
      transitionTo('STREAM_CREATING');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot start stream creation from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const streamCreated = useCallback(() => {
    if (currentState === 'STREAM_CREATING') {
      transitionTo('STREAM_READY');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot mark stream as ready from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const startBroadcasting = useCallback(() => {
    if (currentState === 'STREAM_READY' || currentState === 'STREAM_CREATING') {
      transitionTo('BROADCASTING');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot start broadcasting from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const endStream = useCallback(() => {
    if (currentState === 'BROADCASTING' || currentState === 'STREAM_READY') {
      transitionTo('STREAM_ENDED');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot end stream from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const setError = useCallback((errorMessage: string) => {
    console.error(`❌ [STATE MACHINE] Error: ${errorMessage}`);
    setErrorState(errorMessage);
    transitionTo('ERROR');
  }, [transitionTo]);

  const resetToIdle = useCallback(() => {
    console.log('🔄 [STATE MACHINE] Resetting to IDLE');
    setErrorState(null);
    setPreviousState(null);
    setCurrentState('IDLE');
  }, []);

  // State checks
  const canGoLive = useCallback(() => {
    return currentState === 'CONTENT_LABEL_SELECTED' || currentState === 'PRACTICE_MODE_ACTIVE';
  }, [currentState]);

  const isInSetup = useCallback(() => {
    return ['PRE_LIVE_SETUP', 'CONTENT_LABEL_SELECTED', 'PRACTICE_MODE_ACTIVE'].includes(currentState);
  }, [currentState]);

  const isCreatingStream = useCallback(() => {
    return currentState === 'STREAM_CREATING';
  }, [currentState]);

  const isLive = useCallback(() => {
    return currentState === 'BROADCASTING';
  }, [currentState]);

  const hasError = useCallback(() => {
    return currentState === 'ERROR';
  }, [currentState]);

  // Add console log to verify provider is rendering
  useEffect(() => {
    console.log('✅ [LiveStreamStateProvider] Mounted and ready');
  }, []);

  return (
    <LiveStreamStateContext.Provider
      value={{
        currentState,
        previousState,
        error,
        enterPreLiveSetup,
        selectContentLabel,
        enablePracticeMode,
        disablePracticeMode,
        startStreamCreation,
        streamCreated,
        startBroadcasting,
        endStream,
        setError,
        resetToIdle,
        canGoLive,
        isInSetup,
        isCreatingStream,
        isLive,
        hasError,
      }}
    >
      {children}
    </LiveStreamStateContext.Provider>
  );
}

// Verify export is not undefined
if (typeof LiveStreamStateProvider === 'undefined') {
  console.error('❌ CRITICAL: LiveStreamStateProvider is undefined at export time!');
}

export function useLiveStreamState() {
  const context = useContext(LiveStreamStateContext);
  if (context === undefined) {
    throw new Error('useLiveStreamState must be used within a LiveStreamStateProvider');
  }
  return context;
}
