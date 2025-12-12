
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';

export type ConnectionStatus = 'excellent' | 'good' | 'unstable' | 'reconnecting' | 'disconnected';

interface UseStreamConnectionProps {
  isStreaming: boolean;
  onReconnectSuccess?: () => void;
  onReconnectFailed?: () => void;
}

interface UseStreamConnectionReturn {
  connectionStatus: ConnectionStatus;
  reconnectAttempt: number;
  isReconnecting: boolean;
  startReconnect: () => void;
  stopReconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 6;
const RECONNECT_INTERVAL = 2500; // 2.5 seconds

export function useStreamConnection({
  isStreaming,
  onReconnectSuccess,
  onReconnectFailed,
}: UseStreamConnectionProps): UseStreamConnectionReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('excellent');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor network status
  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        setConnectionStatus('disconnected');
        return false;
      }

      // Simulate connection quality check (in real implementation, use WebRTC stats)
      const quality = Math.random();
      if (quality > 0.8) {
        setConnectionStatus('excellent');
      } else if (quality > 0.5) {
        setConnectionStatus('good');
      } else {
        setConnectionStatus('unstable');
      }

      return true;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }, []);

  // Start reconnection attempts
  const startReconnect = useCallback(() => {
    if (isReconnecting) return;

    console.log('🔄 Starting reconnection attempts...');
    setIsReconnecting(true);
    setReconnectAttempt(0);
    setConnectionStatus('reconnecting');

    let attempt = 0;

    const attemptReconnect = async () => {
      attempt++;
      setReconnectAttempt(attempt);
      console.log(`🔄 Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);

      const isConnected = await checkNetworkStatus();

      if (isConnected && connectionStatus !== 'disconnected') {
        // Reconnection successful
        console.log('✅ Reconnection successful!');
        setIsReconnecting(false);
        setReconnectAttempt(0);
        setConnectionStatus('good');
        
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        Alert.alert('✅ Reconnected', 'Connection restored successfully', [{ text: 'OK' }]);
        onReconnectSuccess?.();
        return;
      }

      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        // Max attempts reached
        console.log('❌ Reconnection failed after max attempts');
        setIsReconnecting(false);
        setReconnectAttempt(0);
        setConnectionStatus('disconnected');
        
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        Alert.alert(
          '❌ Connection Failed',
          'You are offline—end the stream or retry manually',
          [
            { text: 'Retry', onPress: startReconnect },
            { text: 'End Stream', onPress: onReconnectFailed, style: 'destructive' },
          ]
        );
        return;
      }
    };

    // First attempt immediately
    attemptReconnect();

    // Then schedule subsequent attempts
    reconnectTimerRef.current = setInterval(attemptReconnect, RECONNECT_INTERVAL);
  }, [isReconnecting, connectionStatus, checkNetworkStatus, onReconnectSuccess, onReconnectFailed]);

  // Stop reconnection attempts
  const stopReconnect = useCallback(() => {
    console.log('🛑 Stopping reconnection attempts');
    setIsReconnecting(false);
    setReconnectAttempt(0);
    
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Monitor network status while streaming
  useEffect(() => {
    if (!isStreaming) {
      stopReconnect();
      setConnectionStatus('excellent');
      return;
    }

    // Check network status periodically
    networkCheckTimerRef.current = setInterval(checkNetworkStatus, 5000);

    return () => {
      if (networkCheckTimerRef.current) {
        clearInterval(networkCheckTimerRef.current);
        networkCheckTimerRef.current = null;
      }
    };
  }, [isStreaming, checkNetworkStatus, stopReconnect]);

  // Auto-start reconnect when connection is lost
  useEffect(() => {
    if (isStreaming && connectionStatus === 'disconnected' && !isReconnecting) {
      startReconnect();
    }
  }, [isStreaming, connectionStatus, isReconnecting, startReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
      }
      if (networkCheckTimerRef.current) {
        clearInterval(networkCheckTimerRef.current);
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