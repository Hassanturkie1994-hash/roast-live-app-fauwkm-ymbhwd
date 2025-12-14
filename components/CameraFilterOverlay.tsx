
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface CameraFilterOverlayProps {
  filter: string | null;
  intensity: number;
}

/**
 * CameraFilterOverlay
 * 
 * Applies real-time visual filters to the camera preview using color overlays.
 * This is a simplified implementation that uses color tints and opacity.
 * 
 * For production, you would use:
 * - expo-gl with custom shaders
 * - react-native-vision-camera with frame processors
 * - WebGL filters
 */
export default function CameraFilterOverlay({ filter, intensity }: CameraFilterOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (filter) {
      Animated.timing(fadeAnim, {
        toValue: intensity,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [filter, intensity, fadeAnim]);

  if (!filter || filter === 'none') {
    return null;
  }

  const getFilterStyle = () => {
    switch (filter) {
      case 'warm':
        return {
          backgroundColor: 'rgba(255, 140, 66, 0.3)',
          mixBlendMode: 'multiply' as const,
        };
      case 'cool':
        return {
          backgroundColor: 'rgba(74, 144, 226, 0.25)',
          mixBlendMode: 'multiply' as const,
        };
      case 'vintage':
        return {
          backgroundColor: 'rgba(212, 165, 116, 0.35)',
          mixBlendMode: 'overlay' as const,
        };
      case 'dramatic':
        return {
          backgroundColor: 'rgba(139, 71, 137, 0.3)',
          mixBlendMode: 'multiply' as const,
        };
      case 'bright':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          mixBlendMode: 'screen' as const,
        };
      case 'noir':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          mixBlendMode: 'multiply' as const,
        };
      case 'vivid':
        return {
          backgroundColor: 'rgba(255, 23, 68, 0.2)',
          mixBlendMode: 'overlay' as const,
        };
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const filterStyle = getFilterStyle();

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        filterStyle,
        {
          opacity: fadeAnim,
          pointerEvents: 'none',
        },
      ]}
    />
  );
}
