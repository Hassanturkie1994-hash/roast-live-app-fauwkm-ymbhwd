
import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Custom hook to ensure services are properly integrated with component lifecycle
 * Prevents memory leaks and ensures cleanup on unmount
 */
export function useServiceIntegration() {
  const isMountedRef = useRef(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    isMountedRef.current = true;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
    });

    return () => {
      isMountedRef.current = false;
      subscription.remove();
    };
  }, []);

  const safeExecute = useCallback(async <T,>(
    fn: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    if (!isMountedRef.current) {
      console.log('⚠️ Component unmounted, skipping service call');
      return fallback;
    }

    try {
      const result = await fn();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted during service call');
        return fallback;
      }

      return result;
    } catch (error) {
      console.error('❌ Service call error:', error);
      if (isMountedRef.current) {
        return fallback;
      }
      return undefined;
    }
  }, []);

  return {
    isMounted: isMountedRef.current,
    appState: appState.current,
    safeExecute,
  };
}

/**
 * Hook to safely handle async operations with loading and error states
 */
export function useAsyncOperation<T>() {
  const { safeExecute } = useServiceIntegration();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await safeExecute(operation);
      
      if (result !== undefined) {
        onSuccess?.(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [safeExecute]);

  return {
    isLoading,
    error,
    execute,
    clearError: () => setError(null),
  };
}
