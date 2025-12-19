
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AIFaceFilter } from '@/components/AIFaceFilterSystem';

interface AIFaceEffectsContextType {
  activeEffect: AIFaceFilter | null;
  effectIntensity: number;
  setActiveEffect: (effect: AIFaceFilter | null) => void;
  setEffectIntensity: (intensity: number) => void;
  clearEffect: () => void;
  hasActiveEffect: () => boolean;
  isReady: boolean;
}

const AIFaceEffectsContext = createContext<AIFaceEffectsContextType | undefined>(undefined);

/**
 * AIFaceEffectsProvider
 * 
 * CRITICAL: This provider MUST be mounted in app/_layout.tsx at the root level
 * before any screens that use useAIFaceEffects hook.
 * 
 * Provider hierarchy (from _layout.tsx):
 * - AuthProvider
 * - LiveStreamStateMachineProvider
 * - StreamingProvider
 * - AIFaceEffectsProvider ← YOU ARE HERE
 * - CameraEffectsProvider
 * - ModeratorsProvider
 * - VIPClubProvider
 * - WidgetProvider
 */
export function AIFaceEffectsProvider({ children }: { children: ReactNode }) {
  const [activeEffect, setActiveEffectState] = useState<AIFaceFilter | null>(null);
  const [effectIntensity, setEffectIntensityState] = useState<number>(0.7);
  const [isReady, setIsReady] = useState(false);

  // Mark provider as ready after mount
  useEffect(() => {
    console.log('✅ [AIFaceEffectsProvider] Provider mounted and ready');
    setIsReady(true);
    
    return () => {
      console.log('👋 [AIFaceEffectsProvider] Provider unmounting');
    };
  }, []);

  const setActiveEffect = useCallback((effect: AIFaceFilter | null) => {
    console.log('🤖 [AI Face Effects] Setting active effect:', effect?.name || 'None');
    setActiveEffectState(effect);
    if (effect) {
      setEffectIntensityState(effect.intensity);
    }
  }, []);

  const setEffectIntensity = useCallback((intensity: number) => {
    console.log('🎚️ [AI Face Effects] Setting effect intensity:', intensity);
    setEffectIntensityState(Math.max(0, Math.min(1, intensity)));
  }, []);

  const clearEffect = useCallback(() => {
    console.log('🧹 [AI Face Effects] Clearing effect');
    setActiveEffectState(null);
  }, []);

  const hasActiveEffect = useCallback(() => {
    return activeEffect !== null;
  }, [activeEffect]);

  return (
    <AIFaceEffectsContext.Provider
      value={{
        activeEffect,
        effectIntensity,
        setActiveEffect,
        setEffectIntensity,
        clearEffect,
        hasActiveEffect,
        isReady,
      }}
    >
      {children}
    </AIFaceEffectsContext.Provider>
  );
}

/**
 * useAIFaceEffects Hook
 * 
 * CRITICAL: This hook can ONLY be used within components that are
 * wrapped by AIFaceEffectsProvider (mounted in app/_layout.tsx).
 * 
 * SAFETY: This hook will throw a descriptive error if called outside
 * of the provider context. This is intentional and should NOT be
 * suppressed with try-catch.
 * 
 * Usage:
 * const { activeEffect, setActiveEffect, isReady } = useAIFaceEffects();
 * 
 * if (!isReady) {
 *   return <LoadingState />;
 * }
 */
export function useAIFaceEffects() {
  const context = useContext(AIFaceEffectsContext);
  
  if (context === undefined) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [useAIFaceEffects] CONTEXT ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('useAIFaceEffects must be used within AIFaceEffectsProvider');
    console.error('Check that AIFaceEffectsProvider is mounted in app/_layout.tsx');
    console.error('Current component is trying to use the hook before provider is ready');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(
      'useAIFaceEffects must be used within AIFaceEffectsProvider. ' +
      'Ensure AIFaceEffectsProvider is mounted in app/_layout.tsx before this component renders.'
    );
  }
  
  return context;
}
