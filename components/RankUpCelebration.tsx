
/**
 * Rank-Up Celebration Component
 * 
 * Displays a full-screen celebration animation when a creator ranks up.
 * 
 * Features:
 * - Confetti animation
 * - Tier badge reveal
 * - Sound effects (via haptics)
 * - Auto-dismiss after 3 seconds
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

interface RankUpCelebrationProps {
  visible: boolean;
  newRank: number;
  newTier: string;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

export const RankUpCelebration: React.FC<RankUpCelebrationProps> = ({
  visible,
  newRank,
  newTier,
  onComplete,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const [confettiAnims] = useState(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (visible) {
      startCelebration();
    }
  }, [visible]);

  const startCelebration = () => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fade in overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scale in badge
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 5,
    }).start();

    // Animate confetti
    confettiAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.y, {
          toValue: height + 50,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: 360 * (2 + Math.random() * 2),
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }, 3000);
  };

  const getTierColor = (tierName: string): string => {
    const tierColors: Record<string, string> = {
      'Bronze Mouth': '#CD7F32',
      'Silver Tongue': '#C0C0C0',
      'Golden Roast': '#FFD700',
      'Diamond Disrespect': '#B9F2FF',
      'Legendary Menace': '#FF0000',
    };
    return tierColors[tierName] || '#FFD700';
  };

  const getTierIcon = (tierName: string): string => {
    const tierIcons: Record<string, string> = {
      'Bronze Mouth': '🥉',
      'Silver Tongue': '🥈',
      'Golden Roast': '🥇',
      'Diamond Disrespect': '💎',
      'Legendary Menace': '👑',
    };
    return tierIcons[tierName] || '🏅';
  };

  if (!visible) {
    return null;
  }

  const tierColor = getTierColor(newTier);
  const tierIcon = getTierIcon(newTier);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: anim.x,
              transform: [
                { translateY: anim.y },
                {
                  rotate: anim.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              backgroundColor: index % 3 === 0 ? '#FFD700' : index % 3 === 1 ? '#FF1493' : '#00FFFF',
            },
          ]}
        />
      ))}

      {/* Celebration Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.celebrationText}>🎉 RANK UP! 🎉</Text>
        
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierIcon}>{tierIcon}</Text>
        </View>

        <Text style={styles.newRankText}>#{newRank}</Text>
        <Text style={[styles.newTierText, { color: tierColor }]}>
          {newTier}
        </Text>

        <Text style={styles.congratsText}>
          Congratulations! Keep up the great work!
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  celebrationText: {
    color: '#FFD700',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  tierBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  tierIcon: {
    fontSize: 64,
  },
  newRankText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  newTierText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  congratsText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
});
