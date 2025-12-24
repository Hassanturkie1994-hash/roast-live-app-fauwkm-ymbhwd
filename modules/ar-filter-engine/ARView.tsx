
import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export interface ARFilterEngine {
  applyFilter(filterName: string): void;
  clearFilter(): void;
}

interface ARViewProps {
  style?: ViewStyle;
  onFilterEngineReady?: (engine: ARFilterEngine) => void;
}

/**
 * ARView Component
 * 
 * Provides AR filter functionality using expo-camera as a fallback
 * until a full AR SDK (DeepAR, Banuba) is integrated.
 * 
 * Features:
 * - Camera preview with AR filter support
 * - Filter management interface
 * - Platform-safe implementation (handles web gracefully)
 * 
 * Usage:
 * ```tsx
 * <ARView 
 *   style={styles.camera}
 *   onFilterEngineReady={(engine) => {
 *     engine.applyFilter('big_eyes');
 *   }}
 * />
 * ```
 */
export const ARView = forwardRef<ARFilterEngine, ARViewProps>(
  ({ style, onFilterEngineReady }, ref) => {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [currentFilter, setCurrentFilter] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // Create filter engine interface with useCallback to ensure stable reference
    const applyFilter = useCallback((filterName: string) => {
      console.log('🎨 [ARView] Applying filter:', filterName);
      setCurrentFilter(filterName);
      // TODO: Implement actual filter application when AR SDK is integrated
    }, []);

    const clearFilter = useCallback(() => {
      console.log('🎨 [ARView] Clearing filter');
      setCurrentFilter(null);
    }, []);

    const filterEngine: ARFilterEngine = {
      applyFilter,
      clearFilter,
    };

    // Expose filter engine via ref
    useImperativeHandle(ref, () => filterEngine, [applyFilter, clearFilter]);

    // Notify parent when filter engine is ready
    React.useEffect(() => {
      if (onFilterEngineReady) {
        onFilterEngineReady(filterEngine);
      }
    }, [onFilterEngineReady, filterEngine]);

    // Request camera permissions
    React.useEffect(() => {
      if (!cameraPermission?.granted && requestCameraPermission) {
        requestCameraPermission();
      }
    }, [cameraPermission, requestCameraPermission]);

    // Handle web platform - don't render native camera
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.container, style]}>
          <View style={styles.webPlaceholder}>
            {/* Web doesn't support native camera - show placeholder */}
          </View>
        </View>
      );
    }

    // Handle missing permissions
    if (!cameraPermission?.granted) {
      return (
        <View style={[styles.container, style]}>
          {/* Permission request UI handled by parent */}
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
        >
          {/* AR filter overlay will be rendered here when SDK is integrated */}
          {currentFilter && (
            <View style={styles.filterOverlay}>
              {/* Filter effects will be rendered here */}
            </View>
          )}
        </CameraView>
      </View>
    );
  }
);

ARView.displayName = 'ARView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: '#000000',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});
