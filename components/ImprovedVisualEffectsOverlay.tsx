
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ImprovedVisualEffectsOverlayProps {
  effect: string | null;
  intensity: number;
}

export default function ImprovedVisualEffectsOverlay({
  effect,
  intensity,
}: ImprovedVisualEffectsOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startEffect = useCallback(() => {
    if (effect) {
      Animated.timing(fadeAnim, {
        toValue: intensity,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [effect, intensity, fadeAnim]);

  useEffect(() => {
    startEffect();
  }, [startEffect]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          opacity: fadeAnim,
          backgroundColor: effect === 'red_tint' ? '#FF0000' : 'transparent',
        },
      ]}
      pointerEvents="none"
    />
  );
}
