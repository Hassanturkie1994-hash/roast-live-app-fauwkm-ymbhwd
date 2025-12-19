
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width, height } = Dimensions.get('window');

interface RoastGiftAnimationOverlayStandardProps {
  giftId: string;
  displayName: string;
  emoji: string;
  senderName: string;
  priceSEK: number;
  tier: string;
  animationType: string;
  onAnimationComplete: () => void;
}

export default function RoastGiftAnimationOverlayStandard({
  giftId,
  displayName,
  emoji,
  senderName,
  priceSEK,
  tier,
  animationType,
  onAnimationComplete,
}: RoastGiftAnimationOverlayStandardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const emojiScaleAnim = useRef(new Animated.Value(1)).current;
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const startAnimation = useCallback(() => {
    console.log(`🎁 [RoastGiftAnimation] Starting animation for ${giftId} (${tier})`);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (tier === 'HIGH' || tier === 'ULTRA') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (tier === 'ULTRA') {
      const shakeSequence = [];
      for (let i = 0; i < 10; i++) {
        shakeSequence.push(
          Animated.timing(shakeAnim, {
            toValue: i % 2 === 0 ? 10 : -10,
            duration: 50,
            useNativeDriver: true,
          })
        );
      }
      shakeSequence.push(
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        })
      );
      Animated.sequence(shakeSequence).start();
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScaleAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(emojiScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * distance,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * distance,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const duration = tier === 'ULTRA' ? 5000 : tier === 'HIGH' ? 3000 : 2000;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    }, duration);
  }, [
    giftId,
    tier,
    fadeAnim,
    slideAnim,
    scaleAnim,
    shakeAnim,
    glowAnim,
    emojiScaleAnim,
    particles,
    onAnimationComplete,
  ]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [{ scale: emojiScaleAnim }],
            },
          ]}
        >
          {emoji}
        </Animated.Text>
        <Text style={styles.giftName}>{displayName}</Text>
        <Text style={styles.senderInfo}>
          from <Text style={styles.senderName}>{senderName}</Text>
        </Text>
        <Text style={styles.price}>{priceSEK} kr</Text>
      </View>

      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
              ],
            },
          ]}
        />
      ))}
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
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  emoji: {
    fontSize: 80,
  },
  giftName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  senderInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  senderName: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
  },
});
