
import { useEffect, useState } from 'react';

export function useStreamConnection(streamId?: string) {
  const [connected, setConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

  useEffect(() => {
    if (streamId) {
      console.log('Connecting to stream:', streamId);
      setConnected(true);
    }

    return () => {
      console.log('Disconnecting from stream');
      setConnected(false);
    };
  }, [streamId]);

  return {
    connected,
    connectionQuality
  };
}
