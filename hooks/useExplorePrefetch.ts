
import { useEffect } from 'react';

export function useExplorePrefetch() {
  useEffect(() => {
    // Prefetch explore content
    console.log('Prefetching explore content');
  }, []);

  return {
    prefetch: () => {
      console.log('Prefetch triggered');
    }
  };
}
