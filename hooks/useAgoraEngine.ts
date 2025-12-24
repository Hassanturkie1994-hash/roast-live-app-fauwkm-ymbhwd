
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AGORA ENGINE HOOK (FALLBACK)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is a FALLBACK that re-exports the web stub implementation.
 * 
 * PLATFORM RESOLUTION ORDER:
 * 1. useAgoraEngine.native.ts (iOS/Android)
 * 2. useAgoraEngine.web.ts (Web)
 * 3. useAgoraEngine.ts (Fallback - uses web stub)
 * 
 * This ensures that if the platform-specific file is not found,
 * we default to the safe web stub instead of crashing.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export { useAgoraEngine } from './useAgoraEngine.web';
