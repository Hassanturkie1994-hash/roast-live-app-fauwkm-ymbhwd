
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/IconSymbol';

export interface ARFilterEngine {
  applyFilter(filterName: string): void;
  clearFilter(): void;
}

interface ARViewProps {
  style?: any;
  onFilterEngineReady?: (engine: ARFilterEngine) => void;
}

/**
 * ARView Component
 * 
 * Provides AR filter functionality using expo-camera as a fallback.
 * This is a placeholder implementation until a full AR SDK (DeepAR, Banuba) is integrated.
 * 
 * Features:
 * - Camera preview
 * - Filter interface (placeholder)
 * - Permission handling
 * 
 * Usage:
 * ```tsx
 * <ARView 
 *   style={styles.arView}
 *   onFilterEngineReady={(engine) => {
 *     engine.applyFilter('big_eyes');
 *   }}
 * />
 * ```
 */
export const ARView: React.FC<ARViewProps> = ({ style, onFilterEngineReady }) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);

  useEffect(() => {
    // Create filter engine interface
    const filterEngine: ARFilterEngine = {
      applyFilter: (filterName: string) => {
        console.log(`🎨 [ARView] Applying filter: ${filterName}`);
        setCurrentFilter(filterName);
        // TODO: Implement actual filter logic with AR SDK
      },
      clearFilter: () => {
        console.log('🎨 [ARView] Clearing filter');
        setCurrentFilter(null);
        // TODO: Implement actual filter clearing with AR SDK
      },
    };

    if (onFilterEngineReady) {
      onFilterEngineReady(filterEngine);
    }
  }, [onFilterEngineReady]);

  if (!permission) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.message}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, style]}>
        <IconSymbol
          ios_icon_name="camera.fill"
          android_material_icon_name="camera"
          size={48}
          color="#FFFFFF"
        />
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
      />
      
      {currentFilter && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>Filter: {currentFilter}</Text>
        </View>
      )}

      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>
          AR Filter Engine (Placeholder)
        </Text>
        <Text style={styles.watermarkSubtext}>
          Integrate DeepAR or Banuba for full AR features
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#A40028',
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  watermark: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  watermarkSubtext: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ARView;
