
import { useMemo } from 'react';
import sv from '@/constants/translations';

/**
 * Translation hook for Swedish localization
 * Usage: const t = useTranslation();
 * Then: t.auth.login.title
 */
export function useTranslation() {
  return useMemo(() => sv, []);
}

/**
 * Helper function to replace placeholders in translation strings
 * Example: formatTranslation('Hello {name}!', { name: 'World' }) => 'Hello World!'
 */
export function formatTranslation(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export default useTranslation;
