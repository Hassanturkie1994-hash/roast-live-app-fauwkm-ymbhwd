
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { colors } from '@/styles/commonStyles';
import { GiftTier, getAnimationDuration } from '@/app/services/giftService';

const { width, height } = Dimensions.get('window');

interface GiftAnimationOverlayProps {
  giftName: string;
  giftEmoji: string;
  senderUsername: string;
  amount: number;
  tier: GiftTier;
  onAnimationComplete: () => void;
}

export default function GiftAnimationOverlay({
  giftName,
  giftEmoji,
  senderUsername,
  amount,
  tier,
  onAnimationComplete,
}: GiftAnimationOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0.5)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Particle animations for tier B and C
  const particles = useRef(
    Array.from({ length: tier === 'C' ? 12 : tier === 'B' ? 6 : 0 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;
  
  // Glow pulse for tier B and C
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Shake effect for tier B and C
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const duration = getAnimationDuration(tier);

  // Play sound effect based on gift emoji
  const playSoundEffect = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Map gift emojis to sound frequencies/types
      const soundMap: { [key: string]: { frequency: number; type: 'success' | 'notification' | 'celebration' } } = {
        '🔥': { frequency: 800, type: 'celebration' },
        '🤡': { frequency: 400, type: 'notification' },
        '🎤': { frequency: 600, type: 'success' },
        '💨': { frequency: 300, type: 'notification' },
        '😂': { frequency: 500, type: 'success' },
        '🥵': { frequency: 700, type: 'celebration' },
        '🌶️': { frequency: 750, type: 'celebration' },
        '💣': { frequency: 200, type: 'celebration' },
        '🧯': { frequency: 450, type: 'notification' },
        '🧱': { frequency: 250, type: 'notification' },
        '🧀': { frequency: 550, type: 'success' },
        '🚮': { frequency: 350, type: 'notification' },
        '🤬': { frequency: 650, type: 'celebration' },
        '⚡': { frequency: 900, type: 'celebration' },
        '🪞': { frequency: 600, type: 'success' },
        '📢': { frequency: 700, type: 'celebration' },
        '💎': { frequency: 1000, type: 'celebration' },
        '🥇': { frequency: 950, type: 'celebration' },
        '🍿': { frequency: 500, type: 'success' },
        '🎯': { frequency: 800, type: 'celebration' },
        '🚀': { frequency: 1100, type: 'celebration' },
        '🥊': { frequency: 600, type: 'celebration' },
        '🔊': { frequency: 850, type: 'celebration' },
        '🎭': { frequency: 750, type: 'celebration' },
        '👑': { frequency: 1000, type: 'celebration' },
        '🐐': { frequency: 950, type: 'celebration' },
        '🧨': { frequency: 1200, type: 'celebration' },
        '🕶️': { frequency: 900, type: 'celebration' },
      };

      const soundConfig = soundMap[giftEmoji] || { frequency: 600, type: 'success' };
      
      // Use system sounds based on tier and type
      let soundUri: string;
      
      if (tier === 'C') {
        // Premium tier - celebration sound
        soundUri = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
      } else if (tier === 'B') {
        // Medium tier - success sound
        soundUri = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';
      } else {
        // Cheap tier - notification sound
        soundUri = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: true, volume: tier === 'C' ? 1.0 : tier === 'B' ? 0.8 : 0.6 }
      );

      soundRef.current = sound;

      // Unload sound after animation completes
      setTimeout(async () => {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }, duration + 500);
    } catch (error) {
      console.error('Error playing sound effect:', error);
    }
  };

  useEffect(() => {
    // Play sound effect
    playSoundEffect();

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
            friction: tier === 'C' ? 6 : 8,
            tension: tier === 'C' ? 50 : 40,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(emojiScaleAnim, {
            toValue: tier === 'C' ? 1.3 : tier === 'B' ? 1.1 : 1,
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
            toValue: tier === 'C' ? -100 : -50,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Glow pulse for tier B and C
    if (tier === 'B' || tier === 'C') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    // Shake effect for tier B and C
    if (tier === 'B' || tier === 'C') {
      animations.push(
        Animated.loop(
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
            Animated.delay(tier === 'C' ? 500 : 1000),
          ])
        )
      );
    }

    // Particle animations
    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = tier === 'C' ? 150 : 100;
      const delay = index * (tier === 'C' ? 50 : 100);

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
              duration: tier === 'C' ? 1200 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.sin(angle) * distance,
              duration: tier === 'C' ? 1200 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotate, {
              toValue: 360,
              duration: tier === 'C' ? 1200 : 1000,
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
      if (finished) {
        onAnimationComplete();
      }
    });

    // Cleanup
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, [tier, duration]);

  const renderParticles = () => {
    if (tier === 'A') return null;

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
        <Text style={[styles.particleEmoji, tier === 'C' && styles.particleEmojiLarge]}>
          {tier === 'C' ? '✨' : '💫'}
        </Text>
      </Animated.View>
    ));
  };

  const renderFullScreenEffect = () => {
    if (tier !== 'C') return null;

    return (
      <Animated.View
        style={[
          styles.fullScreenOverlay,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF1493', '#E30052']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    );
  };

  const getGlowColor = () => {
    switch (tier) {
      case 'C':
        return '#FFD700';
      case 'B':
        return colors.gradientEnd;
      default:
        return colors.gradientStart;
    }
  };

  const getBorderColor = () => {
    switch (tier) {
      case 'C':
        return '#FFD700';
      case 'B':
        return colors.gradientEnd;
      default:
        return colors.gradientStart;
    }
  };

  const getShadowOpacity = () => {
    return tier === 'B' || tier === 'C' ? 0.6 : 0.3;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderFullScreenEffect()}
      {renderParticles()}
      
      <Animated.View
        style={[
          styles.giftNotification,
          tier === 'C' && styles.giftNotificationPremium,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
              { translateX: tier === 'B' || tier === 'C' ? shakeAnim : 0 },
            ],
            borderColor: getBorderColor(),
            shadowColor: getGlowColor(),
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: getShadowOpacity(),
            shadowRadius: 24,
            elevation: 12,
          },
        ]}
      >
        {tier === 'C' && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnim,
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
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
          <Text style={[styles.giftEmoji, tier === 'C' && styles.giftEmojiLarge]}>
            {giftEmoji}
          </Text>
        </Animated.View>
        
        <View style={styles.giftTextContainer}>
          {tier === 'C' ? (
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF1493']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.textGradientContainer}
            >
              <Text style={[styles.giftText, styles.giftTextPremium]}>
                <Text style={styles.senderNamePremium}>{senderUsername}</Text>
                {' sent '}
                <Text style={styles.giftNamePremium}>{giftName}</Text>
              </Text>
              <Text style={[styles.giftAmount, styles.giftAmountPremium]}>
                worth {amount} kr!
              </Text>
            </LinearGradient>
          ) : (
            <>
              <Text style={[styles.giftText, tier === 'B' && styles.giftTextMedium]}>
                <Text style={[styles.senderName, tier === 'B' && styles.senderNameMedium]}>
                  {senderUsername}
                </Text>
                {' sent '}
                <Text style={[styles.giftName, tier === 'B' && styles.giftNameMedium]}>
                  {giftName}
                </Text>
              </Text>
              <Text style={[styles.giftAmount, tier === 'B' && styles.giftAmountMedium]}>
                worth {amount} kr!
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {tier === 'C' && (
        <Animated.View
          style={[
            styles.confettiContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {[...Array(30)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FF1493'][
                    Math.floor(Math.random() * 6)
                  ],
                  width: Math.random() * 8 + 6,
                  height: Math.random() * 8 + 6,
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
                        outputRange: ['0deg', `${Math.random() * 1080}deg`],
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
    fontSize: 20,
  },
  particleEmojiLarge: {
    fontSize: 28,
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
  giftNotificationPremium: {
    padding: 20,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 4,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glowRingGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  giftEmojiContainer: {
    marginRight: 16,
  },
  giftEmoji: {
    fontSize: 48,
  },
  giftEmojiLarge: {
    fontSize: 64,
  },
  giftTextContainer: {
    flex: 1,
  },
  textGradientContainer: {
    borderRadius: 8,
    padding: 4,
  },
  giftText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  giftTextMedium: {
    fontSize: 17,
    fontWeight: '700',
  },
  giftTextPremium: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  senderName: {
    color: colors.gradientEnd,
    fontWeight: '700',
  },
  senderNameMedium: {
    color: colors.gradientEnd,
    fontWeight: '800',
  },
  senderNamePremium: {
    color: '#FFD700',
    fontWeight: '900',
  },
  giftName: {
    color: '#FFD700',
    fontWeight: '700',
  },
  giftNameMedium: {
    color: '#FFD700',
    fontWeight: '800',
  },
  giftNamePremium: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  giftAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  giftAmountMedium: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gradientEnd,
  },
  giftAmountPremium: {
    fontSize: 17,
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
    borderRadius: 2,
  },
});