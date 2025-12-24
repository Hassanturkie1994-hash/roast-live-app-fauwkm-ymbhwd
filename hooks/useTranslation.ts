
/**
 * useTranslation Hook
 * 
 * Provides localization/translation functionality for the app.
 * Currently supports Swedish (sv) and English (en).
 */

import { useState, useEffect } from 'react';
import { translations } from '@/constants/translations';

type Language = 'en' | 'sv';

let currentLanguage: Language = 'en';

export function useTranslation() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = () => {
      forceUpdate(prev => prev + 1);
    };

    // Add event listener if needed
    return () => {
      // Cleanup
    };
  }, []);

  return translations[currentLanguage];
}

export function setLanguage(language: Language) {
  currentLanguage = language;
  console.log('🌍 [useTranslation] Language changed to:', language);
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function formatTranslation(template: string, params: Record<string, string | number>): string {
  let result = template;
  
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  
  return result;
}
