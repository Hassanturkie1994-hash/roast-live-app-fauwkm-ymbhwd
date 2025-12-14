
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface VisualEffectsOverlayProps {
  effect: string | null;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

/**
 * VisualEffectsOverlay
 * 
 * Renders animated visual effects over the camera preview.
 * Effects include flames, sparkles, hearts, stars, confetti, smoke, and lightning.
 * 
 * These are GPU-friendly animated overlays that don't block the UI thread.
 */
export default function VisualEffectsOverlay({ effect }: VisualEffectsOverlayProps) {
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (effect && effect !== 'none') {
      startEffect();
    } else {
      stopEffect();
    }

    return () => {
      stopEffect();
    };
  }, [effect]);

  const startEffect = () => {
    // Create particles
    const particleCount = getParticleCount();
    particles.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(height + 50),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }));

    // Start animation loop
    animateParticles();
  };

  const stopEffect = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    particles.current = [];
  };

  const getParticleCount = () => {
    switch (effect) {
      case 'fire':
      case 'smoke':
        return 15;
      case 'sparkles':
      case 'stars':
        return 20;
      case 'hearts':
        return 12;
      case 'confetti':
        return 25;
      case 'lightning':
        return 5;
      default:
        return 10;
    }
  };

  const animateParticles = () => {
    particles.current.forEach((particle, index) => {
      const delay = index * 100;
      const duration = 2000 + Math.random() * 1000;

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -100,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(duration - 600),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.x, {
            toValue: particle.x._value + (Math.random() - 0.5) * 100,
            duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset particle
          particle.y.setValue(height + 50);
          particle.x.setValue(Math.random() * width);
          particle.opacity.setValue(0);
        });
      }, delay);
    });

    // Loop animation
    animationRef.current = setTimeout(() => {
      animateParticles();
    }, 3000);
  };

  const getParticleEmoji = () => {
    switch (effect) {
      case 'fire':
        return '🔥';
      case 'sparkles':
        return '✨';
      case 'hearts':
        return '❤️';
      case 'stars':
        return '⭐';
      case 'confetti':
        return '🎉';
      case 'smoke':
        return '💨';
      case 'lightning':
        return '⚡';
      default:
        return '✨';
    }
  };

  if (!effect || effect === 'none') {
    return null;
  }

  const emoji = getParticleEmoji();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.Text
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
});
