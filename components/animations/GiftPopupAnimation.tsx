
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const { width, height } = Dimensions.get('window');

interface GiftPopupAnimationProps {
  giftName: string;
  senderUsername: string;
  amount: number;
  onAnimationComplete: () => void;
}

export default function GiftPopupAnimation({
  giftName,
  senderUsername,
  amount,
  onAnimationComplete,
}: GiftPopupAnimationProps) {
  // Main animations
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Particle animations
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Screen shake for expensive gifts
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isExpensive = amount >= 100;
  const isMedium = amount >= 50 && amount < 100;

  useEffect(() => {
    // Sequence: Slide in → Glow pulse → Hold → Fade out
    Animated.sequence([
      // 1. Slide into center with scale
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: width / 2,
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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Glow pulse effect
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
        ]),
        { iterations: 2 }
      ),
      
      // 3. Hold
      Animated.delay(1000),
      
      // 4. Fade away
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationComplete();
    });

    // Spark particle burst
    setTimeout(() => {
      particles.forEach((particle, index) => {
        const angle = (index / particles.length) * Math.PI * 2;
        const distance = isExpensive ? 150 : isMedium ? 100 : 80;
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;

        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      });
    }, 400);

    // Screen shake for expensive gifts
    if (isExpensive) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);
    }
  }, []);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.mainContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { translateX: -width / 2 },
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <View
            style={[
              styles.glow,
              {
                backgroundColor: isExpensive ? '#FFD700' : colors.gradientEnd,
              },
            ]}
          />
        </Animated.View>

        {/* Gift icon */}
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="gift.fill"
            android_material_icon_name="card_giftcard"
            size={isExpensive ? 64 : isMedium ? 48 : 40}
            color={isExpensive ? '#FFD700' : colors.gradientEnd}
          />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.text, isExpensive && styles.textExpensive]}>
            <Text style={styles.username}>{senderUsername}</Text>
            {' sent '}
            <Text style={styles.giftName}>{giftName}</Text>
          </Text>
          <Text style={[styles.amount, isExpensive && styles.amountExpensive]}>
            worth {amount} kr!
          </Text>
        </View>

        {/* Gold particles for expensive gifts */}
        {isExpensive && (
          <View style={styles.goldParticlesContainer}>
            {[...Array(12)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.goldParticle,
                  {
                    left: `${(i / 12) * 100}%`,
                    opacity: glowAnim,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Flame glow for expensive gifts */}
        {isExpensive && (
          <Animated.View
            style={[
              styles.flameGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Spark particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              opacity: particle.opacity,
              transform: [
                { translateX: width / 2 },
                { translateY: height / 2 },
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto_awesome"
            size={isExpensive ? 24 : 16}
            color={isExpensive ? '#FFD700' : colors.gradientEnd}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  mainContainer: {
    position: 'absolute',
    top: height / 2 - 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  iconContainer: {
    marginBottom: 16,
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textExpensive: {
    fontSize: 22,
    fontWeight: '800',
  },
  username: {
    color: colors.gradientEnd,
    fontWeight: '800',
  },
  giftName: {
    color: '#FFD700',
    fontWeight: '800',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gradientEnd,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  amountExpensive: {
    fontSize: 20,
    color: '#FFD700',
  },
  particle: {
    position: 'absolute',
  },
  goldParticlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  goldParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    top: '50%',
  },
  flameGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF4500',
    opacity: 0.3,
  },
});