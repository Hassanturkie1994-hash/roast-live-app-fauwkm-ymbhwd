
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width, height } = Dimensions.get('window');

interface GiftPopupAnimationProps {
  giftName: string;
  emoji: string;
  senderName: string;
  price: number;
  tier: string;
  onAnimationComplete: () => void;
}

export default function GiftPopupAnimation({
  giftName,
  emoji,
  senderName,
  price,
  tier,
  onAnimationComplete,
}: GiftPopupAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 10 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const isMedium = tier === 'MID';
  const isExpensive = tier === 'HIGH' || tier === 'ULTRA';

  const startAnimation = useCallback(() => {
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

    if (isExpensive) {
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

      const shakeSequence = [];
      for (let i = 0; i < 6; i++) {
        shakeSequence.push(
          Animated.timing(shakeAnim, {
            toValue: i % 2 === 0 ? 5 : -5,
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

    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const duration = isExpensive ? 3000 : isMedium ? 2000 : 1500;
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
    fadeAnim,
    slideAnim,
    scaleAnim,
    shakeAnim,
    glowAnim,
    particles,
    isMedium,
    isExpensive,
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
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.giftName}>{giftName}</Text>
        <Text style={styles.senderInfo}>
          from <Text style={styles.senderName}>{senderName}</Text>
        </Text>
        <Text style={styles.price}>{price} kr</Text>
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
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  emoji: {
    fontSize: 64,
  },
  giftName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  senderInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  senderName: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
});
