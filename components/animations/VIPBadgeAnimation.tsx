
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface VIPBadgeAnimationProps {
  badgeName: string;
  badgeColor: string;
}

export default function VIPBadgeAnimation({ badgeName, badgeColor }: VIPBadgeAnimationProps) {
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shine sweeps every 4 seconds
    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 0],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <IconSymbol
          ios_icon_name="heart.fill"
          android_material_icon_name="favorite"
          size={10}
          color={colors.text}
        />
        <Text style={styles.badgeText}>{badgeName}</Text>

        {/* Shine effect */}
        <Animated.View
          style={[
            styles.shine,
            {
              opacity: shineOpacity,
              transform: [{ translateX: shineTranslateX }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text,
  },
  shine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ skewX: '-20deg' }],
  },
});