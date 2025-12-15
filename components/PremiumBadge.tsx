
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import { premiumSubscriptionService } from '@/app/services/premiumSubscriptionService';

interface PremiumBadgeProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

export default function PremiumBadge({ userId, size = 'medium', showAnimation = true }: PremiumBadgeProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const glowOpacity = useSharedValue(0.5);

  const checkPremiumStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const premium = await premiumSubscriptionService.isPremiumMember(userId);
      setIsPremium(premium);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  useEffect(() => {
    if (showAnimation && isPremium) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isPremium, showAnimation, glowOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  if (isLoading || !isPremium) {
    return null;
  }

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 9,
      iconSize: 10,
      borderRadius: 6,
      glowRadius: 6,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 11,
      iconSize: 12,
      borderRadius: 8,
      glowRadius: 8,
    },
    large: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 13,
      iconSize: 14,
      borderRadius: 10,
      glowRadius: 10,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.container}>
      {showAnimation && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              borderRadius: currentSize.glowRadius,
            },
            animatedGlowStyle,
          ]}
        />
      )}
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
            borderRadius: currentSize.borderRadius,
          },
        ]}
      >
        <IconSymbol
          ios_icon_name="crown.fill"
          android_material_icon_name="workspace_premium"
          size={currentSize.iconSize}
          color="#FFFFFF"
        />
        <Text
          style={[
            styles.badgeText,
            {
              fontSize: currentSize.fontSize,
            },
          ]}
        >
          PREMIUM
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  badgeText: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
