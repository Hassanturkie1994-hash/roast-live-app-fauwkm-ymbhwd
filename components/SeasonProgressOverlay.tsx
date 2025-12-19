
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useSeasonRanking } from '@/hooks/useSeasonRanking';

interface SeasonProgressOverlayProps {
  creatorId: string;
  streamId: string;
}

export default function SeasonProgressOverlay({
  creatorId,
  streamId,
}: SeasonProgressOverlayProps) {
  const { currentSeason, ranking, isLoading } = useSeasonRanking(creatorId);
  const [progress, setProgress] = useState(0);
  const [isNearRankUp, setIsNearRankUp] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadProgress = useCallback(() => {
    if (ranking) {
      const currentScore = ranking.composite_score || 0;
      const nextRankScore = (ranking.rank - 1) * 1000;
      const progressPercent = (currentScore / nextRankScore) * 100;
      setProgress(Math.min(progressPercent, 100));
      setIsNearRankUp(progressPercent >= 90);
    }
  }, [ranking]);

  const subscribeToUpdates = useCallback(() => {
    console.log('Subscribing to season progress updates');
    return () => {
      console.log('Unsubscribing from season progress updates');
    };
  }, []);

  useEffect(() => {
    loadProgress();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, [loadProgress, subscribeToUpdates]);

  const startNearRankUpAnimation = useCallback(() => {
    if (isNearRankUp) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isNearRankUp, pulseAnim]);

  useEffect(() => {
    startNearRankUpAnimation();
  }, [startNearRankUpAnimation]);

  const animateProgressBar = useCallback(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    animateProgressBar();
  }, [animateProgressBar]);

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
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="trophy.fill"
          android_material_icon_name="emoji_events"
          size={16}
          color="#FFD700"
        />
        <Text style={styles.rank}>Rank #{ranking.rank}</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.score}>{ranking.composite_score} pts</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    minWidth: 120,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 3,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
