
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { RoastGiftTier, getRoastGiftAnimationDuration } from '@/constants/RoastGiftManifest';

const { width, height } = Dimensions.get('window');

interface RoastGiftAnimationOverlayStandardProps {
  giftId: string;
  displayName: string;
  emoji: string;
  senderName: string;
  priceSEK: number;
  tier: RoastGiftTier;
  onAnimationComplete: () => void;
}

export default function RoastGiftAnimationOverlayStandard({
  giftId,
  displayName,
  emoji,
  senderName,
  priceSEK,
  tier,
  onAnimationComplete,
}: RoastGiftAnimationOverlayStandardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0.5)).current;
  const isMountedRef = useRef(true);
  
  // Particle animations for MID, HIGH, and ULTRA
  const particleCount = tier === 'ULTRA' ? 20 : tier === 'HIGH' ? 12 : tier === 'MID' ? 6 : 0;
  const particles = useRef(
    Array.from({ length: particleCount }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;
  
  // Glow pulse for MID, HIGH, and ULTRA
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Shake effect for HIGH and ULTRA
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const duration = getRoastGiftAnimationDuration(tier);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🔥 [RoastGift] Animation started:', { giftId, displayName, tier });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // Main animation sequence
    animations.push(
      Animated.sequence([
        // Fade in and scale up
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: tier === 'ULTRA' ? 5 : tier === 'HIGH' ? 6 : 8,
            tension: tier === 'ULTRA' ? 60 : tier === 'HIGH' ? 50 : 40,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(emojiScaleAnim, {
            toValue: tier === 'ULTRA' ? 1.5 : tier === 'HIGH' ? 1.3 : tier === 'MID' ? 1.1 : 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Hold
        Animated.delay(duration),
        // Fade out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: tier === 'ULTRA' ? -150 : tier === 'HIGH' ? -100 : -50,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Glow pulse for MID, HIGH, and ULTRA
    if (tier !== 'LOW') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: tier === 'ULTRA' ? 600 : 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: tier === 'ULTRA' ? 600 : 800,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    // Shake effect for HIGH and ULTRA
    if (tier === 'HIGH' || tier === 'ULTRA') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: tier === 'ULTRA' ? 15 : 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: tier === 'ULTRA' ? -15 : -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: tier === 'ULTRA' ? 15 : 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.delay(tier === 'ULTRA' ? 300 : 500),
          ])
        )
      );
    }

    // Particle animations
    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = tier === 'ULTRA' ? 200 : tier === 'HIGH' ? 150 : 100;
      const delay = index * (tier === 'ULTRA' ? 30 : tier === 'HIGH' ? 50 : 100);

      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: Math.cos(angle) * distance,
              duration: tier === 'ULTRA' ? 1500 : tier === 'HIGH' ? 1200 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.sin(angle) * distance,
              duration: tier === 'ULTRA' ? 1500 : tier === 'HIGH' ? 1200 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotate, {
              toValue: 360,
              duration: tier === 'ULTRA' ? 1500 : tier === 'HIGH' ? 1200 : 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations
    Animated.parallel(animations).start(({ finished }) => {
      if (finished && isMountedRef.current) {
        console.log('✅ [RoastGift] Animation completed:', giftId);
        onAnimationComplete();
      }
    });
  }, [tier, duration]);

  const renderParticles = () => {
    if (tier === 'LOW') return null;

    return particles.map((particle, index) => (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            opacity: particle.opacity,
            transform: [
              { translateX: particle.translateX },
              { translateY: particle.translateY },
              {
                rotate: particle.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.particleEmoji, tier === 'ULTRA' && styles.particleEmojiLarge]}>
          {tier === 'ULTRA' ? '🔥' : tier === 'HIGH' ? '💥' : '✨'}
        </Text>
      </Animated.View>
    ));
  };

  const renderFullScreenEffect = () => {
    if (tier !== 'ULTRA') return null;

    return (
      <Animated.View
        style={[
          styles.fullScreenOverlay,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#FF0000', '#FF6B6B', '#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    );
  };

  const getGlowColor = () => {
    switch (tier) {
      case 'ULTRA':
        return '#FFD700';
      case 'HIGH':
        return '#FF6B6B';
      case 'MID':
        return colors.gradientEnd;
      default:
        return colors.gradientStart;
    }
  };

  const getBorderColor = () => {
    switch (tier) {
      case 'ULTRA':
        return '#FFD700';
      case 'HIGH':
        return '#FF6B6B';
      case 'MID':
        return colors.gradientEnd;
      default:
        return colors.gradientStart;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderFullScreenEffect()}
      {renderParticles()}
      
      <Animated.View
        style={[
          styles.giftNotification,
          tier === 'ULTRA' && styles.giftNotificationUltra,
          tier === 'HIGH' && styles.giftNotificationHigh,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
              { translateX: tier === 'HIGH' || tier === 'ULTRA' ? shakeAnim : 0 },
            ],
            borderColor: getBorderColor(),
            shadowColor: getGlowColor(),
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: tier === 'LOW' ? 0.3 : 0.6,
            shadowRadius: tier === 'ULTRA' ? 32 : tier === 'HIGH' ? 24 : 16,
            elevation: tier === 'ULTRA' ? 16 : tier === 'HIGH' ? 12 : 8,
          },
        ]}
      >
        {tier === 'ULTRA' && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnim,
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.15],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowRingGradient}
            />
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.giftEmojiContainer,
            {
              transform: [{ scale: emojiScaleAnim }],
            },
          ]}
        >
          <Text style={[styles.giftEmoji, tier === 'ULTRA' && styles.giftEmojiUltra]}>
            {emoji}
          </Text>
        </Animated.View>
        
        <View style={styles.giftTextContainer}>
          <Text style={[styles.giftText, tier === 'ULTRA' && styles.giftTextUltra]}>
            <Text style={[styles.senderName, tier === 'ULTRA' && styles.senderNameUltra]}>
              {senderName}
            </Text>
            {' sent '}
            <Text style={[styles.giftName, tier === 'ULTRA' && styles.giftNameUltra]}>
              {displayName}
            </Text>
          </Text>
          <Text style={[styles.giftAmount, tier === 'ULTRA' && styles.giftAmountUltra]}>
            worth {priceSEK} kr! 🔥
          </Text>
        </View>
      </Animated.View>

      {tier === 'ULTRA' && (
        <Animated.View
          style={[
            styles.confettiContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {[...Array(40)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#FFA500', '#FF1493', '#00FF00', '#00FFFF'][
                    Math.floor(Math.random() * 6)
                  ],
                  width: Math.random() * 10 + 8,
                  height: Math.random() * 10 + 8,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, height + 50],
                      }),
                    },
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${Math.random() * 1440}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },
  particleEmoji: {
    fontSize: 24,
  },
  particleEmojiLarge: {
    fontSize: 32,
  },
  giftNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 16,
    paddingHorizontal: 24,
    maxWidth: width * 0.85,
    borderWidth: 3,
  },
  giftNotificationHigh: {
    padding: 18,
    paddingHorizontal: 26,
    borderRadius: 22,
    borderWidth: 3.5,
  },
  giftNotificationUltra: {
    padding: 22,
    paddingHorizontal: 30,
    borderRadius: 26,
    borderWidth: 4,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
  },
  glowRingGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  giftEmojiContainer: {
    marginRight: 16,
  },
  giftEmoji: {
    fontSize: 52,
  },
  giftEmojiUltra: {
    fontSize: 72,
  },
  giftTextContainer: {
    flex: 1,
  },
  giftText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  giftTextUltra: {
    fontSize: 20,
    fontWeight: '900',
  },
  senderName: {
    color: colors.gradientEnd,
    fontWeight: '700',
  },
  senderNameUltra: {
    color: '#FFD700',
    fontWeight: '900',
  },
  giftName: {
    color: '#FFD700',
    fontWeight: '700',
  },
  giftNameUltra: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  giftAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  giftAmountUltra: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    top: -50,
    borderRadius: 3,
  },
});
