
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';

interface LiveBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showPulse?: boolean;
}

export default function LiveBadge({ size = 'medium', showPulse = true }: LiveBadgeProps) {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (showPulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [showPulse, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  const sizeStyles = {
    small: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 10 },
    medium: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 12 },
    large: { paddingVertical: 8, paddingHorizontal: 20, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View style={showPulse ? animatedStyle : undefined}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.badge,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>LIVE</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});