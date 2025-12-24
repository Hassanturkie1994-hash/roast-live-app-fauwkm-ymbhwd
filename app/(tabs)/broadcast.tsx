
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BROADCAST SCREEN (FALLBACK)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is a FALLBACK that re-exports the web implementation.
 * 
 * PLATFORM RESOLUTION ORDER:
 * 1. broadcast.native.tsx (iOS/Android)
 * 2. broadcast.web.tsx (Web)
 * 3. broadcast.tsx (Fallback - uses web implementation)
 * 
 * This ensures that if the platform-specific file is not found,
 * we default to the safe web implementation instead of crashing.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export { default } from './broadcast.web';
