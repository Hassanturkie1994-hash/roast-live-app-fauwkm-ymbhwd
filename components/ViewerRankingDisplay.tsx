
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface ViewerRankingDisplayProps {
  streamId: string;
  userId: string;
}

export default function ViewerRankingDisplay({
  streamId,
  userId,
}: ViewerRankingDisplayProps) {
  const [ranking, setRanking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadRankingData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading viewer ranking data');
      setRanking({ rank: 1, score: 100 });
    } catch (error) {
      console.error('Error loading ranking data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRankingUpdate = useCallback((payload: any) => {
    console.log('Ranking update received:', payload);
    loadRankingData();
  }, [loadRankingData]);

  useEffect(() => {
    loadRankingData();

    const channel = supabase
      .channel(`viewer_ranking:${streamId}:${userId}`)
      .on('broadcast', { event: 'ranking_update' }, handleRankingUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, userId, loadRankingData, handleRankingUpdate]);

  useEffect(() => {
    if (ranking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [ranking, glowAnim, pulseAnim]);

  if (isLoading || !ranking) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <IconSymbol
        ios_icon_name="star.fill"
        android_material_icon_name="star"
        size={16}
        color="#FFD700"
      />
      <Text style={styles.rank}>#{ranking.rank}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
});
