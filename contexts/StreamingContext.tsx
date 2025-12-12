
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StreamingContextType {
  isStreaming: boolean;
  startStream: () => void;
  stopStream: () => void;
  viewerCount: number;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

export function StreamingProvider({ children }: { children: ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const startStream = () => {
    console.log('Starting stream');
    setIsStreaming(true);
  };

  const stopStream = () => {
    console.log('Stopping stream');
    setIsStreaming(false);
  };

  return (
    <StreamingContext.Provider value={{ isStreaming, startStream, stopStream, viewerCount }}>
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
