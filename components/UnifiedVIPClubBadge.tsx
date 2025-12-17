
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { unifiedVIPClubService, VIPBadgeData } from '@/app/services/unifiedVIPClubService';

interface UnifiedVIPClubBadgeProps {
  creatorId: string;
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showLevel?: boolean;
}

export default function UnifiedVIPClubBadge({ 
  creatorId, 
  userId, 
  size = 'medium',
  showLevel = true,
}: UnifiedVIPClubBadgeProps) {
  const [badgeData, setBadgeData] = useState<VIPBadgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const shineAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchBadgeData = async () => {
      setIsLoading(true);
      try {
        const data = await unifiedVIPClubService.getVIPBadgeData(creatorId, userId);
        setBadgeData(data);
      } catch (error) {
        console.error('Error fetching VIP badge data:', error);
        setBadgeData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadgeData();
  }, [creatorId, userId]);

  useEffect(() => {
    if (!badgeData?.isMember || !badgeData.vipLevel) return;

    const level = badgeData.vipLevel;
    
    // More animation intensity for higher levels
    const animationSpeed = Math.max(500, 2000 - (level * 75)); // Faster at higher levels
    const glowIntensity = Math.min(1, level / 20); // Max glow at level 20

    // Shine animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: animationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: animationSpeed,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation (more intense at higher levels)
    if (level >= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1 + (level / 100), // Bigger pulse at higher levels
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glow animation (only for high levels)
    if (level >= 15) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: glowIntensity,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [badgeData, shineAnim, scaleAnim, glowAnim]);

  if (isLoading || !badgeData?.isMember) {
    return null;
  }

  const { badgeName, badgeColor, vipLevel } = badgeData;

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 9,
      levelFontSize: 7,
      borderRadius: 4,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 11,
      levelFontSize: 8,
      borderRadius: 6,
    },
    large: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 13,
      levelFontSize: 10,
      borderRadius: 8,
    },
  };

  const currentSize = sizeStyles[size];

  // Convert level number to superscript
  const getSuperscript = (num: number): string => {
    const superscripts: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    };
    return num.toString().split('').map(d => superscripts[d] || d).join('');
  };

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const glowOpacity = glowAnim;

  // Determine if badge should have premium effects
  const isPremium = vipLevel && vipLevel >= 15;
  const isElite = vipLevel && vipLevel === 20;

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect for high-level badges */}
      {isPremium && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: glowOpacity,
              backgroundColor: badgeColor,
              borderRadius: currentSize.borderRadius,
              transform: [{ scale: 1.2 }],
            },
          ]}
        />
      )}

      <LinearGradient
        colors={
          isElite
            ? [badgeColor || '#FF1493', '#FFD700', badgeColor || '#FF1493']
            : [badgeColor || '#FF1493', badgeColor || '#FF1493']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
            borderRadius: currentSize.borderRadius,
          },
        ]}
      >
        {/* Shine overlay */}
        <Animated.View
          style={[
            styles.shineOverlay,
            {
              transform: [{ translateX: shineTranslateX }],
              opacity: vipLevel && vipLevel >= 10 ? 0.3 : 0.15,
            },
          ]}
        />

        <Text
          style={[
            styles.badgeText,
            {
              fontSize: currentSize.fontSize,
              textShadowColor: isElite ? '#FFD700' : 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: isElite ? 4 : 2,
            },
          ]}
        >
          {badgeName?.toUpperCase()}
          {showLevel && vipLevel && (
            <Text style={[styles.levelText, { fontSize: currentSize.levelFontSize }]}>
              {getSuperscript(vipLevel)}
            </Text>
          )}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeText: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  levelText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
});
