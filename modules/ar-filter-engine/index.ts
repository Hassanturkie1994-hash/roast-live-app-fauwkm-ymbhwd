
/**
 * AR Filter Engine - React Native Interface
 * 
 * This module provides a TypeScript interface to the native AR filter engine.
 * It handles communication between React Native and the native iOS/Android implementations.
 * 
 * Architecture:
 * - iOS: ARKit + SceneKit + Metal
 * - Android: CameraX + ML Kit + OpenGL ES
 * 
 * Features:
 * - Face effects (big eyes, big nose, glasses, masks)
 * - Camera filters (color grading, glow, warm/cool)
 * - Real-time face tracking
 * - Modular filter system
 * - Preloaded filters (no runtime allocation)
 * - Live filter switching
 * 
 * Usage:
 * ```typescript
 * import { ARFilterEngine } from '@/modules/ar-filter-engine';
 * 
 * // Start the engine
 * await ARFilterEngine.start();
 * 
 * // Enable a filter
 * await ARFilterEngine.enableFilter('big_eyes');
 * 
 * // Disable a filter
 * await ARFilterEngine.disableFilter('big_eyes');
 * 
 * // Set filter parameter
 * await ARFilterEngine.setFilterParameter('big_eyes', 'intensity', 1.5);
 * 
 * // Get available filters
 * const filters = await ARFilterEngine.getAvailableFilters();
 * 
 * // Stop the engine
 * await ARFilterEngine.stop();
 * ```
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'ar-filter-engine' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go (native modules require a development build)\n';

const ARFilterEngineModule = NativeModules.ARFilterEngineModule
  ? NativeModules.ARFilterEngineModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const eventEmitter = new NativeEventEmitter(ARFilterEngineModule);

// MARK: - Types

export interface Filter {
  id: string;
  name: string;
  type: 'face' | 'camera';
}

export interface FilterParameter {
  name: string;
  type: 'number' | 'boolean' | 'string';
  min?: number;
  max?: number;
  default: any;
}

export type FilterEventType = 
  | 'onFilterEngineReady'
  | 'onFilterEngineError'
  | 'onFaceDetected'
  | 'onFaceLost';

export interface FilterEngineEvent {
  type: FilterEventType;
  data?: any;
}

// MARK: - AR Filter Engine API

export class ARFilterEngine {
  private static listeners: Map<FilterEventType, Set<(event: FilterEngineEvent) => void>> = new Map();
  private static isStarted = false;

  /**
   * Start the AR filter engine
   * Initializes face tracking and filter system
   */
  static async start(): Promise<void> {
    try {
      console.log('🚀 [ARFilterEngine] Starting native filter engine...');
      
      const result = await ARFilterEngineModule.start();
      
      if (result.success) {
        this.isStarted = true;
        console.log('✅ [ARFilterEngine] Native filter engine started successfully');
      } else {
        throw new Error('Failed to start filter engine');
      }
    } catch (error) {
      console.error('❌ [ARFilterEngine] Error starting filter engine:', error);
      throw error;
    }
  }

  /**
   * Stop the AR filter engine
   * Releases all resources
   */
  static async stop(): Promise<void> {
    try {
      console.log('🛑 [ARFilterEngine] Stopping native filter engine...');
      
      const result = await ARFilterEngineModule.stop();
      
      if (result.success) {
        this.isStarted = false;
        console.log('✅ [ARFilterEngine] Native filter engine stopped successfully');
      } else {
        throw new Error('Failed to stop filter engine');
      }
    } catch (error) {
      console.error('❌ [ARFilterEngine] Error stopping filter engine:', error);
      throw error;
    }
  }

  /**
   * Enable a filter
   * @param filterId - The ID of the filter to enable
   */
  static async enableFilter(filterId: string): Promise<void> {
    try {
      console.log(`🎨 [ARFilterEngine] Enabling filter: ${filterId}`);
      
      const result = await ARFilterEngineModule.enableFilter(filterId);
      
      if (result.success) {
        console.log(`✅ [ARFilterEngine] Filter enabled: ${filterId}`);
      } else {
        throw new Error(`Failed to enable filter: ${filterId}`);
      }
    } catch (error) {
      console.error(`❌ [ARFilterEngine] Error enabling filter ${filterId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a filter
   * @param filterId - The ID of the filter to disable
   */
  static async disableFilter(filterId: string): Promise<void> {
    try {
      console.log(`🎨 [ARFilterEngine] Disabling filter: ${filterId}`);
      
      const result = await ARFilterEngineModule.disableFilter(filterId);
      
      if (result.success) {
        console.log(`✅ [ARFilterEngine] Filter disabled: ${filterId}`);
      } else {
        throw new Error(`Failed to disable filter: ${filterId}`);
      }
    } catch (error) {
      console.error(`❌ [ARFilterEngine] Error disabling filter ${filterId}:`, error);
      throw error;
    }
  }

  /**
   * Set a filter parameter
   * @param filterId - The ID of the filter
   * @param parameter - The parameter name
   * @param value - The parameter value
   */
  static async setFilterParameter(
    filterId: string,
    parameter: string,
    value: number | boolean | string
  ): Promise<void> {
    try {
      console.log(`⚙️ [ARFilterEngine] Setting filter parameter: ${filterId}.${parameter} = ${value}`);
      
      const result = await ARFilterEngineModule.setFilterParameter(filterId, parameter, value);
      
      if (result.success) {
        console.log(`✅ [ARFilterEngine] Filter parameter set: ${filterId}.${parameter}`);
      } else {
        throw new Error(`Failed to set filter parameter: ${filterId}.${parameter}`);
      }
    } catch (error) {
      console.error(`❌ [ARFilterEngine] Error setting filter parameter ${filterId}.${parameter}:`, error);
      throw error;
    }
  }

  /**
   * Get all available filters
   * @returns Array of available filters
   */
  static async getAvailableFilters(): Promise<Filter[]> {
    try {
      console.log('📋 [ARFilterEngine] Getting available filters...');
      
      const result = await ARFilterEngineModule.getAvailableFilters();
      
      if (result.filters) {
        console.log(`✅ [ARFilterEngine] Found ${result.filters.length} filters`);
        return result.filters;
      } else {
        throw new Error('Failed to get available filters');
      }
    } catch (error) {
      console.error('❌ [ARFilterEngine] Error getting available filters:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   * @param eventType - The event type to listen for
   * @param callback - The callback function
   */
  static addEventListener(
    eventType: FilterEventType,
    callback: (event: FilterEngineEvent) => void
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Subscribe to native event
    eventEmitter.addListener(eventType, (data) => {
      callback({ type: eventType, data });
    });
    
    console.log(`✅ [ARFilterEngine] Added listener for ${eventType}`);
  }

  /**
   * Remove event listener
   * @param eventType - The event type
   * @param callback - The callback function to remove
   */
  static removeEventListener(
    eventType: FilterEventType,
    callback: (event: FilterEngineEvent) => void
  ): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
        eventEmitter.removeAllListeners(eventType);
      }
    }
    
    console.log(`✅ [ARFilterEngine] Removed listener for ${eventType}`);
  }

  /**
   * Check if the engine is started
   */
  static isEngineStarted(): boolean {
    return this.isStarted;
  }
}

// MARK: - Predefined Filters

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

// MARK: - Export

export default ARFilterEngine;
