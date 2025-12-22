
/**
 * AR Filter Engine - Main Export
 * 
 * This module provides AR filter functionality for the Roast Live app.
 * It uses expo-camera as a fallback until a full AR SDK is integrated.
 * 
 * Architecture:
 * - ARView: React component for camera preview with AR filters
 * - ARFilterEngine: TypeScript interface for filter management
 * 
 * Future Integration:
 * - DeepAR SDK for iOS/Android
 * - Banuba SDK for iOS/Android
 * - Custom Metal/OpenGL shaders
 * 
 * Usage:
 * ```tsx
 * import { ARView } from '@/modules/ar-filter-engine';
 * 
 * function BroadcastScreen() {
 *   const [filterEngine, setFilterEngine] = useState<ARFilterEngine | null>(null);
 * 
 *   return (
 *     <ARView 
 *       style={styles.camera}
 *       onFilterEngineReady={setFilterEngine}
 *     />
 *   );
 * }
 * ```
 */

export { ARView, ARFilterEngine } from './ARView';

// Filter definitions
export const FACE_FILTERS = {
  BIG_EYES: 'big_eyes',
  BIG_NOSE: 'big_nose',
  GLASSES: 'glasses',
  MASK: 'mask',
  SKIN_SMOOTHING: 'skin_smoothing',
} as const;

export const CAMERA_FILTERS = {
  COLOR_GRADING: 'color_grading',
  GLOW: 'glow',
  WARM: 'warm_filter',
  COOL: 'cool_filter',
} as const;

export const ALL_FILTERS = {
  ...FACE_FILTERS,
  ...CAMERA_FILTERS,
} as const;

export type FaceFilterType = typeof FACE_FILTERS[keyof typeof FACE_FILTERS];
export type CameraFilterType = typeof CAMERA_FILTERS[keyof typeof CAMERA_FILTERS];
export type FilterType = FaceFilterType | CameraFilterType;
