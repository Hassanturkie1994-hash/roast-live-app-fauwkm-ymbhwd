
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PinnedCommentTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function PinnedCommentTimer({ expiresAt, onExpire }: PinnedCommentTimerProps) {
  const { colors } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      return remaining;
    };

    const totalDuration = calculateTimeRemaining();
    setTimeRemaining(totalDuration);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();

    // Pulse animation for the timer
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

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Update time remaining every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.timerBar}>
        <Animated.View
          style={[
            styles.timerProgress,
            {
              width: progressWidth,
              backgroundColor: colors.gradientEnd,
              shadowColor: colors.gradientEnd,
              shadowOpacity: glowOpacity,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      </View>
      <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeRemaining)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    elevation: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 40,
  },
});