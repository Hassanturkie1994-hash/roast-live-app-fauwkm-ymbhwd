
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';

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
  isCreatingStream: boolean;
  
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
  cancelStreamCreation: () => void;
  
  // State checks
  canGoLive: () => boolean;
  isInSetup: () => boolean;
  isCreatingStreamState: () => boolean;
  isLive: () => boolean;
  hasError: () => boolean;
}

const LiveStreamStateContext = createContext<LiveStreamStateContextType | undefined>(undefined);

const STREAM_CREATION_TIMEOUT = 30000; // 30 seconds

export function LiveStreamStateProvider({ children }: { children: ReactNode }) {
  const [currentState, setCurrentState] = useState<LiveStreamState>('IDLE');
  const [previousState, setPreviousState] = useState<LiveStreamState | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  
  const streamCreationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamCreationAttemptRef = useRef<boolean>(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (streamCreationTimeoutRef.current) {
        clearTimeout(streamCreationTimeoutRef.current);
      }
    };
  }, []);

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
    if (currentState === 'IDLE' || currentState === 'STREAM_ENDED' || currentState === 'ERROR') {
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
    
    // Prevent duplicate stream creation calls
    if (streamCreationAttemptRef.current) {
      console.warn('⚠️ [STATE MACHINE] Stream creation already in progress, ignoring duplicate call');
      return;
    }
    
    if (validStates.includes(currentState)) {
      streamCreationAttemptRef.current = true;
      setIsCreatingStream(true);
      transitionTo('STREAM_CREATING');
      
      // Set timeout for stream creation
      streamCreationTimeoutRef.current = setTimeout(() => {
        if (currentState === 'STREAM_CREATING') {
          console.error('❌ [STATE MACHINE] Stream creation timed out after 30 seconds');
          setIsCreatingStream(false);
          streamCreationAttemptRef.current = false;
          setError('Stream creation timed out. Please check your connection and try again.');
        }
      }, STREAM_CREATION_TIMEOUT);
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot start stream creation from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const streamCreated = useCallback(() => {
    // Clear timeout
    if (streamCreationTimeoutRef.current) {
      clearTimeout(streamCreationTimeoutRef.current);
      streamCreationTimeoutRef.current = null;
    }
    
    if (currentState === 'STREAM_CREATING') {
      setIsCreatingStream(false);
      streamCreationAttemptRef.current = false;
      transitionTo('STREAM_READY');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot mark stream as ready from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const cancelStreamCreation = useCallback(() => {
    // Clear timeout
    if (streamCreationTimeoutRef.current) {
      clearTimeout(streamCreationTimeoutRef.current);
      streamCreationTimeoutRef.current = null;
    }
    
    setIsCreatingStream(false);
    streamCreationAttemptRef.current = false;
    
    if (currentState === 'STREAM_CREATING') {
      console.log('🔄 [STATE MACHINE] Stream creation cancelled by user');
      transitionTo('PRE_LIVE_SETUP');
    }
  }, [currentState, transitionTo]);

  const startBroadcasting = useCallback(() => {
    if (currentState === 'STREAM_READY' || currentState === 'STREAM_CREATING') {
      // Clear any pending timeouts
      if (streamCreationTimeoutRef.current) {
        clearTimeout(streamCreationTimeoutRef.current);
        streamCreationTimeoutRef.current = null;
      }
      setIsCreatingStream(false);
      streamCreationAttemptRef.current = false;
      transitionTo('BROADCASTING');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot start broadcasting from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const endStream = useCallback(() => {
    // Clear any pending timeouts
    if (streamCreationTimeoutRef.current) {
      clearTimeout(streamCreationTimeoutRef.current);
      streamCreationTimeoutRef.current = null;
    }
    
    setIsCreatingStream(false);
    streamCreationAttemptRef.current = false;
    
    if (currentState === 'BROADCASTING' || currentState === 'STREAM_READY' || currentState === 'STREAM_CREATING') {
      transitionTo('STREAM_ENDED');
    } else {
      console.warn(`⚠️ [STATE MACHINE] Cannot end stream from ${currentState}`);
    }
  }, [currentState, transitionTo]);

  const setError = useCallback((errorMessage: string) => {
    console.error(`❌ [STATE MACHINE] Error: ${errorMessage}`);
    
    // Clear any pending timeouts
    if (streamCreationTimeoutRef.current) {
      clearTimeout(streamCreationTimeoutRef.current);
      streamCreationTimeoutRef.current = null;
    }
    
    setIsCreatingStream(false);
    streamCreationAttemptRef.current = false;
    setErrorState(errorMessage);
    transitionTo('ERROR');
  }, [transitionTo]);

  const resetToIdle = useCallback(() => {
    console.log('🔄 [STATE MACHINE] Resetting to IDLE');
    
    // Clear any pending timeouts
    if (streamCreationTimeoutRef.current) {
      clearTimeout(streamCreationTimeoutRef.current);
      streamCreationTimeoutRef.current = null;
    }
    
    setIsCreatingStream(false);
    streamCreationAttemptRef.current = false;
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

  const isCreatingStreamState = useCallback(() => {
    return currentState === 'STREAM_CREATING';
  }, [currentState]);

  const isLive = useCallback(() => {
    return currentState === 'BROADCASTING';
  }, [currentState]);

  const hasError = useCallback(() => {
    return currentState === 'ERROR';
  }, [currentState]);

  useEffect(() => {
    console.log('✅ [LiveStreamStateProvider] Mounted and ready');
  }, []);

  return (
    <LiveStreamStateContext.Provider
      value={{
        currentState,
        previousState,
        error,
        isCreatingStream,
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
        cancelStreamCreation,
        canGoLive,
        isInSetup,
        isCreatingStreamState,
        isLive,
        hasError,
      }}
    >
      {children}
    </LiveStreamStateContext.Provider>
  );
}

export function useLiveStreamState() {
  const context = useContext(LiveStreamStateContext);
  if (context === undefined) {
    throw new Error('useLiveStreamState must be used within a LiveStreamStateProvider');
  }
  return context;
}
