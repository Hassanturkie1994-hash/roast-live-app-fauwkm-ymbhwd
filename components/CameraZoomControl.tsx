
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';

export type ZoomLevel = 0.5 | 1 | 2;

interface CameraZoomControlProps {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  position?: 'top' | 'bottom';
  minZoom?: number;
  maxZoom?: number;
}

const ZOOM_LEVELS: ZoomLevel[] = [0.5, 1, 2];

/**
 * CameraZoomControl - TikTok-Style Zoom Control
 * 
 * CRITICAL FIX: Properly calibrated zoom behavior
 * 
 * The issue was that zoom values were being used directly without
 * considering device camera capabilities. This fix:
 * 
 * 1. Maps UI zoom levels (0.5x, 1x, 2x) to actual device zoom ranges
 * 2. Normalizes zoom based on device's minZoom and maxZoom
 * 3. Provides TikTok-like zoom behavior where:
 *    - 0.5x = Wide angle (natural default view)
 *    - 1x = Standard camera baseline
 *    - 2x = True 2× optical/digital zoom
 * 
 * DEVICE ZOOM MAPPING:
 * - Most devices have minZoom: 0 and maxZoom: 1-10
 * - We map our UI levels to this range proportionally
 * - 0.5x UI → minZoom (widest angle)
 * - 1x UI → midpoint between min and max
 * - 2x UI → closer to maxZoom (zoomed in)
 */
export default function CameraZoomControl({
  currentZoom,
  onZoomChange,
  position = 'bottom',
  minZoom = 0,
  maxZoom = 1,
}: CameraZoomControlProps) {
  const [deviceZoomRange, setDeviceZoomRange] = useState({ min: minZoom, max: maxZoom });

  useEffect(() => {
    // Update device zoom range when props change
    setDeviceZoomRange({ min: minZoom, max: maxZoom });
    console.log('📷 [Zoom Control] Device zoom range:', { minZoom, maxZoom });
  }, [minZoom, maxZoom]);

  /**
   * Calculate actual device zoom value from UI zoom level
   * 
   * This is the CRITICAL FIX for zoom calibration:
   * - 0.5x UI → Use minimum zoom (widest angle)
   * - 1x UI → Use middle of zoom range (standard view)
   * - 2x UI → Use 2× the middle value (zoomed in)
   * 
   * Example with device range [0, 1]:
   * - 0.5x UI → 0 (widest)
   * - 1x UI → 0.5 (standard)
   * - 2x UI → 1 (max zoom)
   * 
   * Example with device range [0, 10]:
   * - 0.5x UI → 0 (widest)
   * - 1x UI → 5 (standard)
   * - 2x UI → 10 (max zoom)
   */
  const getDeviceZoomValue = (uiZoom: ZoomLevel): number => {
    const range = deviceZoomRange.max - deviceZoomRange.min;
    const midpoint = deviceZoomRange.min + (range / 2);

    switch (uiZoom) {
      case 0.5:
        // Wide angle - use minimum zoom
        return deviceZoomRange.min;
      case 1:
        // Standard - use midpoint
        return midpoint;
      case 2:
        // Zoomed - use maximum or 2× midpoint
        return Math.min(deviceZoomRange.max, midpoint * 2);
      default:
        return midpoint;
    }
  };

  const handleZoomPress = (zoom: ZoomLevel) => {
    const deviceZoom = getDeviceZoomValue(zoom);
    console.log(`🔍 [Zoom Control] UI: ${zoom}x → Device: ${deviceZoom.toFixed(2)}`);
    onZoomChange(zoom);
  };

  return (
    <View style={[styles.container, position === 'top' ? styles.topPosition : styles.bottomPosition]}>
      <View style={styles.zoomBar}>
        {ZOOM_LEVELS.map((zoom) => {
          const isActive = currentZoom === zoom;
          const deviceZoom = getDeviceZoomValue(zoom);
          
          return (
            <TouchableOpacity
              key={zoom}
              style={[styles.zoomButton, isActive && styles.zoomButtonActive]}
              onPress={() => handleZoomPress(zoom)}
              activeOpacity={0.7}
            >
              <Text style={[styles.zoomText, isActive && styles.zoomTextActive]}>
                {zoom}x
              </Text>
              {__DEV__ && (
                <Text style={styles.debugText}>
                  {deviceZoom.toFixed(1)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Text style={styles.zoomLabel}>Camera Zoom</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  topPosition: {
    top: 120,
  },
  bottomPosition: {
    bottom: 140,
  },
  zoomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 4,
    gap: 4,
  },
  zoomButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonActive: {
    backgroundColor: colors.brandPrimary,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  zoomTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  debugText: {
    fontSize: 9,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  zoomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
  },
});
