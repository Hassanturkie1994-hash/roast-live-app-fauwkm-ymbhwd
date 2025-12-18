
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '@/styles/commonStyles';
import { RoastGift, CinematicTimeline, CinematicKeyframe } from '@/constants/RoastGiftManifest';

const { width, height } = Dimensions.get('window');

interface CinematicGiftOverlayProps {
  gift: RoastGift;
  senderName: string;
  onComplete: () => void;
}

export default function CinematicGiftOverlay({
  gift,
  senderName,
  onComplete,
}: CinematicGiftOverlayProps) {
  const [currentKeyframe, setCurrentKeyframe] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  
  const isMountedRef = useRef(true);
  const timelineRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 [CinematicGift] Starting:', gift.giftId);

    // Start cinematic sequence
    startCinematicSequence();

    return () => {
      isMountedRef.current = false;
      // Clear all timeouts
      timelineRef.current.forEach(clearTimeout);
    };
  }, []);

  const startCinematicSequence = () => {
    // Fade in fullscreen overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Execute timeline if available
    if (gift.cinematicTimeline && !useFallback) {
      executeTimeline(gift.cinematicTimeline);
    } else {
      // Default cinematic sequence or fallback
      executeDefaultSequence();
    }

    // Schedule completion
    const completionTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        fadeOut();
      }
    }, gift.cinematicTimeline?.duration || 5000);
    
    timelineRef.current.push(completionTimeout);
  };

  const executeTimeline = (timeline: CinematicTimeline) => {
    timeline.keyframes.forEach((keyframe) => {
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          executeKeyframe(keyframe);
        }
      }, keyframe.time);
      
      timelineRef.current.push(timeout);
    });
  };

  const executeKeyframe = (keyframe: CinematicKeyframe) => {
    console.log('🎬 [CinematicGift] Executing keyframe:', keyframe.action);
    
    switch (keyframe.action) {
      case 'zoom':
        executeZoom(keyframe.params.level, keyframe.params.duration);
        break;
      case 'flash':
        executeFlash(keyframe.params.color, keyframe.params.intensity);
        break;
      case 'filter':
        executeFilter(keyframe.params.type, keyframe.params.intensity);
        break;
      case 'shake':
        executeShake(keyframe.params.intensity, keyframe.params.duration);
        break;
      case 'text':
        executeText(keyframe.params.text, keyframe.params.size, keyframe.params.color);
        break;
      case 'sound':
        // Sound is handled by native module
        console.log('🔊 [CinematicGift] Sound:', keyframe.params.sound);
        break;
    }
  };

  const executeZoom = (level: number, duration: number) => {
    Animated.timing(zoomAnim, {
      toValue: level,
      duration: duration,
      useNativeDriver: true,
    }).start();
  };

  const executeFlash = (color: string, intensity: number) => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: intensity,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const executeFilter = (type: string, intensity: number) => {
    Animated.timing(filterAnim, {
      toValue: intensity,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const executeShake = (intensity: number, duration: number) => {
    const shakeSequence = [];
    const steps = Math.floor(duration / 50);
    
    for (let i = 0; i < steps; i++) {
      shakeSequence.push(
        Animated.timing(shakeAnim, {
          toValue: intensity * (i % 2 === 0 ? 1 : -1),
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
  };

  const executeText = (text: string, size: number, color: string) => {
    setDisplayText(text);
    
    Animated.sequence([
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(textOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayText('');
    });
  };

  const executeDefaultSequence = () => {
    // Default cinematic: zoom + shake + text
    setTimeout(() => executeZoom(1.5, 2000), 0);
    setTimeout(() => executeShake(15, 1000), 1000);
    setTimeout(() => executeText('ROASTED!', 72, '#FFD700'), 2000);
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (isMountedRef.current) {
        console.log('✅ [CinematicGift] Completed:', gift.giftId);
        onComplete();
      }
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: zoomAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* Background blur */}
      <BlurView intensity={80} style={StyleSheet.absoluteFillObject} tint="dark" />
      
      {/* Flash overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#FF0000',
            opacity: flashAnim,
          },
        ]}
      />
      
      {/* Filter overlay (grayscale, red tint, etc.) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#000000',
            opacity: filterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      />
      
      {/* Gift info */}
      <View style={styles.giftInfo}>
        <Text style={styles.giftEmoji}>{gift.emoji}</Text>
        <Text style={styles.giftName}>{gift.displayName}</Text>
        <Text style={styles.senderInfo}>
          from <Text style={styles.senderName}>{senderName}</Text>
        </Text>
        <Text style={styles.giftPrice}>{gift.priceSEK} kr</Text>
      </View>
      
      {/* Dynamic text overlay */}
      {displayText && (
        <Animated.View
          style={[
            styles.textOverlay,
            {
              opacity: textOpacityAnim,
            },
          ]}
        >
          <Text style={styles.dynamicText}>{displayText}</Text>
        </Animated.View>
      )}
      
      {/* Cinematic bars */}
      <View style={styles.cinematicBars}>
        <View style={styles.topBar} />
        <View style={styles.bottomBar} />
      </View>
      
      {/* Fallback indicator */}
      {useFallback && (
        <View style={styles.fallbackIndicator}>
          <Text style={styles.fallbackText}>Performance Mode</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  giftInfo: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 120,
    marginBottom: 20,
  },
  giftName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  senderInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  senderName: {
    color: colors.gradientEnd,
    fontWeight: '700',
  },
  giftPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
  },
  textOverlay: {
    position: 'absolute',
    top: height * 0.5,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dynamicText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 15,
    textTransform: 'uppercase',
  },
  cinematicBars: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    height: 80,
    backgroundColor: '#000000',
  },
  bottomBar: {
    height: 80,
    backgroundColor: '#000000',
  },
  fallbackIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
