
/**
 * useStreamConnection Hook
 * 
 * Monitors stream connection status and handles reconnection logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface UseStreamConnectionOptions {
  isStreaming: boolean;
  onReconnectSuccess?: () => void;
  onReconnectFailed?: () => void;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useStreamConnection(options: UseStreamConnectionOptions) {
  const {
    isStreaming,
    onReconnectSuccess,
    onReconnectFailed,
    maxReconnectAttempts = 3,
    reconnectDelay = 2000,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startReconnect = useCallback(() => {
    if (reconnectAttempt >= maxReconnectAttempts) {
      console.log('❌ [useStreamConnection] Max reconnect attempts reached');
      setConnectionStatus('disconnected');
      setIsReconnecting(false);
      onReconnectFailed?.();
      return;
    }

    console.log(`🔄 [useStreamConnection] Reconnecting... (attempt ${reconnectAttempt + 1}/${maxReconnectAttempts})`);
    setConnectionStatus('reconnecting');
    setIsReconnecting(true);
    setReconnectAttempt(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      // Simulate reconnection
      const success = Math.random() > 0.3; // 70% success rate

      if (success) {
        console.log('✅ [useStreamConnection] Reconnected successfully');
        setConnectionStatus('connected');
        setIsReconnecting(false);
        setReconnectAttempt(0);
        onReconnectSuccess?.();
      } else {
        startReconnect();
      }
    }, reconnectDelay);
  }, [reconnectAttempt, maxReconnectAttempts, reconnectDelay, onReconnectSuccess, onReconnectFailed]);

  const stopReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsReconnecting(false);
    setReconnectAttempt(0);
  }, []);

  useEffect(() => {
    if (isStreaming) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
      stopReconnect();
    }
  }, [isStreaming, stopReconnect]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    reconnectAttempt,
    isReconnecting,
    startReconnect,
    stopReconnect,
  };
}
