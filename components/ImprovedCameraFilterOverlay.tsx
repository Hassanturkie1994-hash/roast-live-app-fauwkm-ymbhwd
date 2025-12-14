
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { FilterConfig } from '@/contexts/CameraEffectsContext';

interface ImprovedCameraFilterOverlayProps {
  filter: FilterConfig | null;
  intensity: number;
}

/**
 * ImprovedCameraFilterOverlay
 * 
 * Snapchat-style camera filter implementation with:
 * - Subtle color grading (NOT full-screen overlays)
 * - Smooth transitions between filters
 * - Adjustable intensity
 * - Camera feed always visible
 * 
 * IMPORTANT: This uses blend modes and subtle overlays to simulate
 * color grading. For true color matrix filtering, you would need:
 * - expo-gl with custom shaders
 * - react-native-vision-camera with frame processors
 * - WebGL filters
 */
export default function ImprovedCameraFilterOverlay({
  filter,
  intensity,
}: ImprovedCameraFilterOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previousFilter = useRef<FilterConfig | null>(null);

  useEffect(() => {
    if (filter) {
      // Smooth fade in
      Animated.timing(fadeAnim, {
        toValue: intensity,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      previousFilter.current = filter;
    } else {
      // Smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        previousFilter.current = null;
      });
    }
  }, [filter, intensity, fadeAnim]);

  if (!filter) {
    return null;
  }

  // Calculate final opacity based on filter config and intensity
  const finalOpacity = (filter.overlayOpacity || 0.1) * intensity;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: filter.overlayColor || 'transparent',
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, finalOpacity],
          }),
          // @ts-expect-error - mixBlendMode is supported on web and some native platforms
          mixBlendMode: filter.blendMode || 'overlay',
        },
      ]}
      pointerEvents="none"
    />
  );
}
