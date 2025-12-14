
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface CameraFilterOverlayProps {
  filter: string | null;
  intensity: number;
}

/**
 * CameraFilterOverlay
 * 
 * Applies real-time visual filters to the camera preview using proper color grading.
 * 
 * IMPORTANT: This is a VISUAL OVERLAY implementation that simulates color grading.
 * For true color matrix filtering, you would need:
 * - expo-gl with custom shaders
 * - react-native-vision-camera with frame processors
 * - WebGL filters
 * 
 * This implementation uses subtle gradient overlays with proper blend modes
 * to simulate color grading WITHOUT hiding the camera feed.
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
    // All filters use VERY LOW opacity to ensure the camera feed remains visible
    // These are subtle color grading adjustments, NOT solid overlays
    switch (filter) {
      case 'warm':
        // Warm filter: Slightly increase warm tones (orange/yellow)
        return {
          backgroundColor: 'rgba(255, 140, 66, 0.08)', // Very subtle warm overlay
          mixBlendMode: 'overlay' as const, // Overlay preserves highlights and shadows
        };
      case 'cool':
        // Cool filter: Slightly increase cool tones (blue)
        return {
          backgroundColor: 'rgba(74, 144, 226, 0.06)', // Very subtle cool overlay
          mixBlendMode: 'overlay' as const,
        };
      case 'vintage':
        // Vintage filter: Reduced saturation + warm sepia tone
        return {
          backgroundColor: 'rgba(212, 165, 116, 0.10)', // Subtle sepia
          mixBlendMode: 'soft-light' as const, // Soft-light for gentle color shift
        };
      case 'dramatic':
        // Dramatic filter: Increased contrast with purple tint
        return {
          backgroundColor: 'rgba(139, 71, 137, 0.07)', // Very subtle purple
          mixBlendMode: 'overlay' as const,
        };
      case 'bright':
        // Bright filter: Lighten the image
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)', // Very subtle white overlay
          mixBlendMode: 'screen' as const, // Screen mode brightens
        };
      case 'noir':
        // Noir filter: Black and white effect (simulated)
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.15)', // Subtle darkening
          mixBlendMode: 'color' as const, // Color mode desaturates
        };
      case 'vivid':
        // Vivid filter: Increased saturation
        return {
          backgroundColor: 'rgba(255, 23, 68, 0.06)', // Very subtle red overlay
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
