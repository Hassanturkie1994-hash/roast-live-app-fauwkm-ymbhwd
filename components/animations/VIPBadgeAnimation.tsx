
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface VIPBadgeAnimationProps {
  badgeName: string;
  level: number;
  color: string;
}

export default function VIPBadgeAnimation({
  badgeName,
  level,
  color,
}: VIPBadgeAnimationProps) {
  const shineAnim = useRef(new Animated.Value(0)).current;

  const startShineAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shineAnim]);

  useEffect(() => {
    startShineAnimation();
  }, [startShineAnimation]);

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.badgeName}>{badgeName}</Text>
      <Text style={styles.level}>L{level}</Text>
      
      <Animated.View
        style={[
          styles.shine,
          {
            opacity: shineAnim,
            transform: [
              {
                translateX: shineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 100],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  level: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 30,
  },
});
