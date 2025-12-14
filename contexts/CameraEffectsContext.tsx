
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

/**
 * CameraEffectsContext
 * 
 * Centralized state management for camera filters and effects.
 * Ensures persistence across screens and during live streaming.
 * 
 * CRITICAL: This state is NOT tied to component lifecycle.
 * Filters and effects persist when:
 * - Navigating from pre-live setup to broadcaster
 * - Changing filters/effects during live
 * - Leaving and re-entering broadcaster screen
 */

export interface FilterConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  // Color matrix values for subtle color grading
  temperature?: number; // -1 to 1 (cool to warm)
  tint?: number; // -1 to 1 (green to magenta)
  contrast?: number; // 0.5 to 2 (low to high)
  saturation?: number; // 0 to 2 (grayscale to vivid)
  brightness?: number; // -1 to 1 (dark to bright)
  // Overlay color for blend mode effects
  overlayColor?: string;
  overlayOpacity?: number;
  blendMode?: 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'color';
}

export interface EffectConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  particleCount: number;
  duration: number;
  colors: string[];
  emoji?: string;
  direction: 'up' | 'down' | 'float';
  maxOpacity: number;
}

interface CameraEffectsContextType {
  // Active states
  activeFilter: FilterConfig | null;
  activeEffect: EffectConfig | null;
  filterIntensity: number;
  
  // Filter management
  setActiveFilter: (filter: FilterConfig | null) => void;
  setFilterIntensity: (intensity: number) => void;
  clearFilter: () => void;
  
  // Effect management
  setActiveEffect: (effect: EffectConfig | null) => void;
  clearEffect: () => void;
  
  // Bulk operations
  clearAll: () => void;
  restoreState: (filter: FilterConfig | null, effect: EffectConfig | null, intensity: number) => void;
  
  // State checks
  hasActiveFilter: () => boolean;
  hasActiveEffect: () => boolean;
  hasAnyActive: () => boolean;
}

const CameraEffectsContext = createContext<CameraEffectsContextType | undefined>(undefined);

export function CameraEffectsProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilterState] = useState<FilterConfig | null>(null);
  const [activeEffect, setActiveEffectState] = useState<EffectConfig | null>(null);
  const [filterIntensity, setFilterIntensityState] = useState<number>(1.0);

  const setActiveFilter = useCallback((filter: FilterConfig | null) => {
    console.log('🎨 [CameraEffects] Setting active filter:', filter?.name || 'None');
    setActiveFilterState(filter);
  }, []);

  const setFilterIntensity = useCallback((intensity: number) => {
    console.log('🎚️ [CameraEffects] Setting filter intensity:', intensity);
    setFilterIntensityState(Math.max(0, Math.min(1, intensity)));
  }, []);

  const clearFilter = useCallback(() => {
    console.log('🧹 [CameraEffects] Clearing filter');
    setActiveFilterState(null);
  }, []);

  const setActiveEffect = useCallback((effect: EffectConfig | null) => {
    console.log('✨ [CameraEffects] Setting active effect:', effect?.name || 'None');
    setActiveEffectState(effect);
  }, []);

  const clearEffect = useCallback(() => {
    console.log('🧹 [CameraEffects] Clearing effect');
    setActiveEffectState(null);
  }, []);

  const clearAll = useCallback(() => {
    console.log('🧹 [CameraEffects] Clearing all filters and effects');
    setActiveFilterState(null);
    setActiveEffectState(null);
    setFilterIntensityState(1.0);
  }, []);

  const restoreState = useCallback((
    filter: FilterConfig | null,
    effect: EffectConfig | null,
    intensity: number
  ) => {
    console.log('🔄 [CameraEffects] Restoring state:', {
      filter: filter?.name,
      effect: effect?.name,
      intensity,
    });
    setActiveFilterState(filter);
    setActiveEffectState(effect);
    setFilterIntensityState(intensity);
  }, []);

  const hasActiveFilter = useCallback(() => {
    return activeFilter !== null;
  }, [activeFilter]);

  const hasActiveEffect = useCallback(() => {
    return activeEffect !== null;
  }, [activeEffect]);

  const hasAnyActive = useCallback(() => {
    return activeFilter !== null || activeEffect !== null;
  }, [activeFilter, activeEffect]);

  return (
    <CameraEffectsContext.Provider
      value={{
        activeFilter,
        activeEffect,
        filterIntensity,
        setActiveFilter,
        setFilterIntensity,
        clearFilter,
        setActiveEffect,
        clearEffect,
        clearAll,
        restoreState,
        hasActiveFilter,
        hasActiveEffect,
        hasAnyActive,
      }}
    >
      {children}
    </CameraEffectsContext.Provider>
  );
}

export function useCameraEffects() {
  const context = useContext(CameraEffectsContext);
  if (context === undefined) {
    throw new Error('useCameraEffects must be used within a CameraEffectsProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER PRESETS - Snapchat-Style Subtle Color Grading
// ═══════════════════════════════════════════════════════════════════════════

export const FILTER_PRESETS: FilterConfig[] = [
  {
    id: 'warm',
    name: 'Warm',
    icon: '🌅',
    description: 'Warmer skin tones',
    temperature: 0.15,
    saturation: 1.05,
    overlayColor: 'rgba(255, 140, 66, 0.06)',
    overlayOpacity: 0.06,
    blendMode: 'overlay',
  },
  {
    id: 'cool',
    name: 'Cool',
    icon: '❄️',
    description: 'Cooler blue tones',
    temperature: -0.12,
    saturation: 1.03,
    overlayColor: 'rgba(74, 144, 226, 0.05)',
    overlayOpacity: 0.05,
    blendMode: 'overlay',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: '📷',
    description: 'Sepia retro look',
    saturation: 0.85,
    contrast: 0.95,
    overlayColor: 'rgba(212, 165, 116, 0.08)',
    overlayOpacity: 0.08,
    blendMode: 'soft-light',
  },
  {
    id: 'bright',
    name: 'Bright',
    icon: '☀️',
    description: 'Brighten image',
    brightness: 0.12,
    saturation: 1.08,
    overlayColor: 'rgba(255, 255, 255, 0.06)',
    overlayOpacity: 0.06,
    blendMode: 'screen',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    icon: '🎭',
    description: 'High contrast',
    contrast: 1.15,
    saturation: 1.1,
    overlayColor: 'rgba(139, 71, 137, 0.05)',
    overlayOpacity: 0.05,
    blendMode: 'overlay',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    icon: '🌈',
    description: 'Boost saturation',
    saturation: 1.25,
    contrast: 1.05,
    overlayColor: 'rgba(255, 23, 68, 0.04)',
    overlayOpacity: 0.04,
    blendMode: 'overlay',
  },
  {
    id: 'soft',
    name: 'Soft',
    icon: '🌸',
    description: 'Soft and dreamy',
    saturation: 0.92,
    contrast: 0.92,
    brightness: 0.05,
    overlayColor: 'rgba(255, 192, 203, 0.06)',
    overlayOpacity: 0.06,
    blendMode: 'soft-light',
  },
  {
    id: 'noir',
    name: 'Noir',
    icon: '🎬',
    description: 'Black & white',
    saturation: 0,
    contrast: 1.1,
    overlayColor: 'rgba(0, 0, 0, 0.08)',
    overlayOpacity: 0.08,
    blendMode: 'color',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// EFFECT PRESETS - Snapchat-Style Animated Particles
// ═══════════════════════════════════════════════════════════════════════════

export const EFFECT_PRESETS: EffectConfig[] = [
  {
    id: 'fire',
    name: 'Roast Flames',
    icon: '🔥',
    description: 'Animated flame particles',
    particleCount: 20,
    duration: 2500,
    colors: ['#FF4500', '#FF6347', '#FFA500', '#FFD700'],
    emoji: '🔥',
    direction: 'up',
    maxOpacity: 0.8,
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    icon: '✨',
    description: 'Magical sparkles',
    particleCount: 25,
    duration: 3000,
    colors: ['#FFD700', '#FFFFFF', '#FFF8DC', '#FFFFE0'],
    emoji: '✨',
    direction: 'float',
    maxOpacity: 0.7,
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: '❤️',
    description: 'Floating hearts',
    particleCount: 15,
    duration: 3500,
    colors: ['#FF1744', '#FF4081', '#F50057', '#C51162'],
    emoji: '❤️',
    direction: 'up',
    maxOpacity: 0.7,
  },
  {
    id: 'stars',
    name: 'Stars',
    icon: '⭐',
    description: 'Twinkling stars',
    particleCount: 25,
    duration: 3000,
    colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'],
    emoji: '⭐',
    direction: 'float',
    maxOpacity: 0.7,
  },
  {
    id: 'confetti',
    name: 'Confetti',
    icon: '🎉',
    description: 'Celebration burst',
    particleCount: 30,
    duration: 2000,
    colors: ['#FF1744', '#00E676', '#2979FF', '#FFD600', '#FF6D00'],
    emoji: '🎉',
    direction: 'down',
    maxOpacity: 0.8,
  },
  {
    id: 'snow',
    name: 'Snow',
    icon: '❄️',
    description: 'Falling snowflakes',
    particleCount: 20,
    duration: 4000,
    colors: ['#FFFFFF', '#E0F7FA', '#B2EBF2'],
    emoji: '❄️',
    direction: 'down',
    maxOpacity: 0.6,
  },
  {
    id: 'lightning',
    name: 'Lightning',
    icon: '⚡',
    description: 'Electric bolts',
    particleCount: 8,
    duration: 800,
    colors: ['#00FFFF', '#FFFFFF', '#E0FFFF', '#AFEEEE'],
    emoji: '⚡',
    direction: 'float',
    maxOpacity: 0.9,
  },
];
