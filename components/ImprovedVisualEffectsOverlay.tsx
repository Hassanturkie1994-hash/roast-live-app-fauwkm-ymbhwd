
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { EffectConfig } from '@/contexts/CameraEffectsContext';

const { width, height } = Dimensions.get('window');

interface ImprovedVisualEffectsOverlayProps {
  effect: EffectConfig | null;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

/**
 * ImprovedVisualEffectsOverlay
 * 
 * Snapchat-style particle effects with:
 * - GPU-optimized animations
 * - Smooth 60 FPS performance
 * - Layered on top of camera (never blocks view)
 * - Dynamic particle systems
 * - Configurable behaviors
 */
export default function ImprovedVisualEffectsOverlay({
  effect,
}: ImprovedVisualEffectsOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationLoopRef = useRef<boolean>(false);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    if (effect) {
      console.log('✨ [Effects] Starting effect:', effect.name);
      startEffect(effect);
    } else {
      console.log('✨ [Effects] Stopping effect');
      stopEffect();
    }

    return () => {
      stopEffect();
    };
  }, [effect]);

  const startEffect = (effectConfig: EffectConfig) => {
    // Create initial particles
    const newParticles = Array.from(
      { length: effectConfig.particleCount },
      (_, i) => createParticle(i, effectConfig)
    );
    
    setParticles(newParticles);
    animationLoopRef.current = true;
    
    // Start animation loop
    animateParticles(newParticles, effectConfig);
  };

  const stopEffect = () => {
    animationLoopRef.current = false;
    setParticles([]);
    particleIdCounter.current = 0;
  };

  const createParticle = (index: number, effectConfig: EffectConfig): Particle => {
    const startX = Math.random() * width;
    const startY = getStartY(effectConfig.direction);
    const color = effectConfig.colors[index % effectConfig.colors.length];
    
    return {
      id: particleIdCounter.current++,
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      rotation: new Animated.Value(Math.random() * 360),
      color,
    };
  };

  const getStartY = (direction: 'up' | 'down' | 'float'): number => {
    switch (direction) {
      case 'up':
        return height + 50; // Start from bottom
      case 'down':
        return -50; // Start from top
      case 'float':
        return Math.random() * height; // Random position
      default:
        return height + 50;
    }
  };

  const getEndY = (direction: 'up' | 'down' | 'float', startY: number): number => {
    switch (direction) {
      case 'up':
        return -100; // Move upward
      case 'down':
        return height + 50; // Fall downward
      case 'float':
        return startY + (Math.random() - 0.5) * 200; // Float around
      default:
        return -100;
    }
  };

  const animateParticles = (particleList: Particle[], effectConfig: EffectConfig) => {
    if (!animationLoopRef.current) return;

    particleList.forEach((particle, index) => {
      const delay = index * (effectConfig.duration / effectConfig.particleCount);
      
      setTimeout(() => {
        if (!animationLoopRef.current) return;

        const startY = particle.y._value;
        const endY = getEndY(effectConfig.direction, startY);
        const xDrift = (Math.random() - 0.5) * 150;

        // Animate particle
        Animated.parallel([
          // Y movement
          Animated.timing(particle.y, {
            toValue: endY,
            duration: effectConfig.duration,
            useNativeDriver: true,
          }),
          // X drift
          Animated.timing(particle.x, {
            toValue: particle.x._value + xDrift,
            duration: effectConfig.duration,
            useNativeDriver: true,
          }),
          // Fade in and out
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: effectConfig.maxOpacity,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(effectConfig.duration - 800),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Rotation
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value + 360,
            duration: effectConfig.duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset particle for continuous loop
          if (animationLoopRef.current) {
            particle.y.setValue(getStartY(effectConfig.direction));
            particle.x.setValue(Math.random() * width);
            particle.opacity.setValue(0);
            particle.rotation.setValue(Math.random() * 360);
          }
        });
      }, delay);
    });

    // Continue loop
    setTimeout(() => {
      if (animationLoopRef.current) {
        animateParticles(particleList, effectConfig);
      }
    }, effectConfig.duration + 500);
  };

  if (!effect) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          {effect.emoji ? (
            <Animated.Text style={[styles.particleEmoji, { color: particle.color }]}>
              {effect.emoji}
            </Animated.Text>
          ) : (
            <View style={[styles.particleCircle, { backgroundColor: particle.color }]} />
          )}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
  particleEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  particleCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
