
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

export function StreamingProvider({ children }: { children: ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startStreamTimer = () => {
    setStreamStartTime(new Date());
  };

  const stopStreamTimer = async (userId: string) => {
    if (streamStartTime) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - streamStartTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours

      console.log(`Stream duration: ${durationHours.toFixed(2)} hours`);

      // Update streaming hours in database
      await fanClubService.updateStreamingHours(userId, durationHours);

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

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
}