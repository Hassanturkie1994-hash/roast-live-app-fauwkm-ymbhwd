
import { useState, useEffect } from 'react';
import { Stream } from '../types';

export function useStreams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockStreams: Stream[] = [
        {
          id: '1',
          title: 'Epic Roast Battle 🔥',
          thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
          user: {
            id: '1',
            username: '@roastking',
            displayName: 'Roast King',
            followers: 5000,
            following: 200,
            verified: true,
          },
          viewers: 1234,
          isLive: true,
          category: 'Comedy',
        },
        {
          id: '2',
          title: 'Late Night Roasting',
          thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
          user: {
            id: '2',
            username: '@comedyqueen',
            displayName: 'Comedy Queen',
            followers: 8500,
            following: 150,
          },
          viewers: 856,
          isLive: true,
          category: 'Entertainment',
        },
      ];
      setStreams(mockStreams);
      setLoading(false);
    }, 1000);
  };

  const refreshStreams = () => {
    loadStreams();
  };

  return {
    streams,
    loading,
    refreshStreams,
  };
}
