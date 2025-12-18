
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AIFaceFilter } from '@/components/AIFaceFilterSystem';

interface AIFaceEffectsContextType {
  activeEffect: AIFaceFilter | null;
  effectIntensity: number;
  setActiveEffect: (effect: AIFaceFilter | null) => void;
  setEffectIntensity: (intensity: number) => void;
  clearEffect: () => void;
  hasActiveEffect: () => boolean;
}

const AIFaceEffectsContext = createContext<AIFaceEffectsContextType | undefined>(undefined);

export function AIFaceEffectsProvider({ children }: { children: ReactNode }) {
  const [activeEffect, setActiveEffectState] = useState<AIFaceFilter | null>(null);
  const [effectIntensity, setEffectIntensityState] = useState<number>(0.7);

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
      }}
    >
      {children}
    </AIFaceEffectsContext.Provider>
  );
}

export function useAIFaceEffects() {
  const context = useContext(AIFaceEffectsContext);
  if (context === undefined) {
    throw new Error('useAIFaceEffects must be used within an AIFaceEffectsProvider');
  }
  return context;
}
