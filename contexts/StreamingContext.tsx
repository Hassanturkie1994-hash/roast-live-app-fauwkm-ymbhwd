
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { fanClubService } from '@/app/services/fanClubService';

interface StreamingContextType {
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  streamStartTime: Date | null;
  startStreamTimer: () => void;
  stopStreamTimer: (userId: string) => Promise<void>;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

/**
 * StreamingProvider - Manages global streaming state and timer
 * 
 * CRITICAL: This component MUST be exported as a named export
 * and imported with curly braces: import { StreamingProvider } from '...'
 */
export function StreamingProvider({ children }: { children: ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<Date | null>(null);
  
  // FIX ISSUE 2: Use platform-safe timer type instead of NodeJS.Timeout
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startStreamTimer = () => {
    console.log('⏱️ [StreamingProvider] Starting stream timer');
    setStreamStartTime(new Date());
  };

  const stopStreamTimer = async (userId: string) => {
    if (streamStartTime) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - streamStartTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours

      console.log(`⏱️ [StreamingProvider] Stream duration: ${durationHours.toFixed(2)} hours`);

      try {
        // Update streaming hours in database
        await fanClubService.updateStreamingHours(userId, durationHours);
        console.log('✅ [StreamingProvider] Streaming hours updated successfully');
      } catch (error) {
        console.error('❌ [StreamingProvider] Failed to update streaming hours:', error);
      }

      setStreamStartTime(null);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    const currentTimer = timerRef.current;
    return () => {
      if (currentTimer) {
        clearInterval(currentTimer);
      }
    };
  }, []);

  // Add console log to verify provider is rendering
  useEffect(() => {
    console.log('✅ [StreamingProvider] Mounted and ready');
  }, []);

  return (
    <StreamingContext.Provider
      value={{
        isStreaming,
        setIsStreaming,
        streamStartTime,
        startStreamTimer,
        stopStreamTimer,
      }}
    >
      {children}
    </StreamingContext.Provider>
  );
}

// Verify export is not undefined
if (typeof StreamingProvider === 'undefined') {
  console.error('❌ CRITICAL: StreamingProvider is undefined at export time!');
}

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
}
