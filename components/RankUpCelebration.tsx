
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width, height } = Dimensions.get('window');

interface RankUpCelebrationProps {
  newRank: number;
  onComplete: () => void;
}

export default function RankUpCelebration({ newRank, onComplete }: RankUpCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  const startCelebration = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      }, 2000);
    });
  }, [fadeAnim, scaleAnim, onComplete]);

  useEffect(() => {
    startCelebration();
  }, [startCelebration]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Rank Up!</Text>
      <Text style={styles.rank}>#{newRank}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  rank: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.brandPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});
