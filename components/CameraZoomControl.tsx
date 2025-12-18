
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface CameraZoomControlProps {
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * CameraZoomControl - Manual Gesture-Based Zoom
 * 
 * CRITICAL CHANGES:
 * - Removed fixed zoom presets (0.5x / 1x / 2x)
 * - Implemented single-finger vertical swipe gesture
 * - Swipe up → zoom in
 * - Swipe down → zoom out
 * - Smooth, linear, and responsive
 * - Maps directly to device's native camera zoom range
 * - No artificial limits other than hardware-supported zoom range
 * - Zoom changes do NOT reinitialize or interrupt the live stream
 */
export default function CameraZoomControl({
  currentZoom,
  onZoomChange,
  minZoom = 0,
  maxZoom = 1,
}: CameraZoomControlProps) {
  const zoomIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show zoom indicator temporarily when zooming
  const showZoomIndicator = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    Animated.timing(zoomIndicatorOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    hideTimeoutRef.current = setTimeout(() => {
      Animated.timing(zoomIndicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  // Create pan responder for vertical swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        showZoomIndicator();
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate zoom change based on vertical movement
        // Negative dy = swipe up = zoom in
        // Positive dy = swipe down = zoom out
        const sensitivity = 0.002; // Adjust for smoother/faster zoom
        const zoomDelta = -gestureState.dy * sensitivity;
        
        // Calculate new zoom value
        let newZoom = currentZoom + zoomDelta;
        
        // Clamp to device zoom range
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
        
        // Update zoom
        onZoomChange(newZoom);
        
        showZoomIndicator();
      },
      onPanResponderRelease: () => {
        // Zoom indicator will auto-hide after timeout
      },
    })
  ).current;

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Calculate zoom percentage for display
  const zoomPercentage = Math.round(((currentZoom - minZoom) / (maxZoom - minZoom)) * 100);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Zoom indicator - only visible when actively zooming */}
      <Animated.View
        style={[
          styles.zoomIndicator,
          {
            opacity: zoomIndicatorOpacity,
          },
        ]}
      >
        <View style={styles.zoomBar}>
          <View style={[styles.zoomFill, { height: `${zoomPercentage}%` }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: 200,
    bottom: 200,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  zoomIndicator: {
    width: 40,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBar: {
    width: 8,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  zoomFill: {
    width: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 4,
  },
});
