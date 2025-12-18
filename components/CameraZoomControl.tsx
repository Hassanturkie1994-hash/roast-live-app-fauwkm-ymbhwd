
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';

export type ZoomLevel = 0.5 | 1 | 2;

interface CameraZoomControlProps {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  position?: 'top' | 'bottom';
}

const ZOOM_LEVELS: ZoomLevel[] = [0.5, 1, 2];

export default function CameraZoomControl({
  currentZoom,
  onZoomChange,
  position = 'bottom',
}: CameraZoomControlProps) {
  return (
    <View style={[styles.container, position === 'top' ? styles.topPosition : styles.bottomPosition]}>
      <View style={styles.zoomBar}>
        {ZOOM_LEVELS.map((zoom) => {
          const isActive = currentZoom === zoom;
          
          return (
            <TouchableOpacity
              key={zoom}
              style={[styles.zoomButton, isActive && styles.zoomButtonActive]}
              onPress={() => onZoomChange(zoom)}
              activeOpacity={0.7}
            >
              <Text style={[styles.zoomText, isActive && styles.zoomTextActive]}>
                {zoom}x
              </Text>
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
  zoomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
  },
});
