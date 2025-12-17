
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
  rotation: Animated.Value;
}

/**
 * VisualEffectsOverlay
 * 
 * Renders animated visual effects over the camera preview.
 * Effects are GPU-optimized particle systems that layer on top of the camera feed.
 * 
 * CRITICAL: Effects MUST NOT block or tint the camera view.
 * They are decorative overlays only.
 */
export default function VisualEffectsOverlay({ effect }: VisualEffectsOverlayProps) {
  const particles = useRef<Particle[]>([]);
  const animationLoopRef = useRef<boolean>(false);

  const startEffect = useCallback(() => {
    console.log('🎨 [EFFECTS] Starting effect:', effect);
    
    // Create particles
    const particleCount = getParticleCount();
    particles.current = Array.from({ length: particleCount }, (_, i) => createParticle(i));

    // Start animation loop
    animationLoopRef.current = true;
    animateParticles();
  }, [effect]);

  useEffect(() => {
    if (effect && effect !== 'none') {
      startEffect();
    } else {
      stopEffect();
    }

    return () => {
      stopEffect();
    };
  }, [effect, startEffect]);

  const stopEffect = () => {
    console.log('🎨 [EFFECTS] Stopping effect');
    animationLoopRef.current = false;
    particles.current = [];
  };

  const createParticle = (id: number): Particle => {
    const startX = Math.random() * width;
    const startY = getStartY();
    
    return {
      id,
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      rotation: new Animated.Value(Math.random() * 360),
    };
  };

  const getStartY = () => {
    switch (effect) {
      case 'fire':
      case 'smoke':
        return height + 50; // Start from bottom
      case 'confetti':
        return -50; // Start from top
      default:
        return height + 50; // Default: start from bottom
    }
  };

  const getParticleCount = () => {
    switch (effect) {
      case 'fire':
        return 20; // More particles for fire effect
      case 'smoke':
        return 15;
      case 'sparkles':
      case 'stars':
        return 25;
      case 'hearts':
        return 15;
      case 'confetti':
        return 30;
      case 'lightning':
        return 8;
      default:
        return 15;
    }
  };

  const animateParticles = () => {
    if (!animationLoopRef.current) return;

    particles.current.forEach((particle, index) => {
      const delay = index * 150; // Stagger particle animations
      const duration = getDuration();
      const endY = getEndY();

      setTimeout(() => {
        if (!animationLoopRef.current) return;

        // Animate particle movement
        Animated.parallel([
          // Y movement (up or down depending on effect)
          Animated.timing(particle.y, {
            toValue: endY,
            duration,
            useNativeDriver: true,
          }),
          // Fade in and out
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: getMaxOpacity(),
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(duration - 800),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // X drift (horizontal movement)
          Animated.timing(particle.x, {
            toValue: particle.x._value + (Math.random() - 0.5) * 150,
            duration,
            useNativeDriver: true,
          }),
          // Rotation (for confetti and some effects)
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value + 360,
            duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset particle for continuous loop
          if (animationLoopRef.current) {
            particle.y.setValue(getStartY());
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
        animateParticles();
      }
    }, getDuration() + 500);
  };

  const getDuration = () => {
    switch (effect) {
      case 'fire':
        return 2500;
      case 'smoke':
        return 3500;
      case 'sparkles':
      case 'stars':
        return 3000;
      case 'hearts':
        return 3500;
      case 'confetti':
        return 2000;
      case 'lightning':
        return 800;
      default:
        return 3000;
    }
  };

  const getEndY = () => {
    switch (effect) {
      case 'fire':
      case 'smoke':
        return -100; // Move upward
      case 'confetti':
        return height + 50; // Fall downward
      default:
        return -100; // Default: move upward
    }
  };

  const getMaxOpacity = () => {
    switch (effect) {
      case 'smoke':
        return 0.4; // Smoke is more transparent
      case 'lightning':
        return 0.9; // Lightning is bright
      default:
        return 0.7; // Default opacity
    }
  };

  const getParticleColor = () => {
    switch (effect) {
      case 'fire':
        return ['#FF4500', '#FF6347', '#FFA500', '#FFD700'];
      case 'sparkles':
        return ['#FFD700', '#FFFFFF', '#FFF8DC', '#FFFFE0'];
      case 'hearts':
        return ['#FF1744', '#FF4081', '#F50057', '#C51162'];
      case 'stars':
        return ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'];
      case 'confetti':
        return ['#FF1744', '#00E676', '#2979FF', '#FFD600', '#FF6D00'];
      case 'smoke':
        return ['#CCCCCC', '#AAAAAA', '#999999', '#BBBBBB'];
      case 'lightning':
        return ['#00FFFF', '#FFFFFF', '#E0FFFF', '#AFEEEE'];
      default:
        return ['#FFFFFF'];
    }
  };

  const getParticleShape = () => {
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

  const colors = getParticleColor();
  const shape = getParticleShape();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map((particle, index) => {
        const color = colors[index % colors.length];
        
        return (
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
            {/* Render particle as colored circle or emoji */}
            {effect === 'confetti' || effect === 'lightning' ? (
              <View 
                style={[
                  styles.particleCircle, 
                  { backgroundColor: color }
                ]} 
              />
            ) : (
              <Animated.Text style={[styles.particleEmoji, { color }]}>
                {shape}
              </Animated.Text>
            )}
          </Animated.View>
        );
      })}
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
