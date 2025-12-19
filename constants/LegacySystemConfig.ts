
/**
 * LEGACY SYSTEM SHUTDOWN CONFIGURATION
 * 
 * CRITICAL: This is a HARD KILL SWITCH for all legacy systems.
 * 
 * When LEGACY_SYSTEMS_ENABLED = false:
 * - Legacy systems MUST NOT initialize
 * - Legacy UI components MUST NOT mount
 * - Legacy realtime channels MUST NOT subscribe
 * - Legacy tables MUST NOT be accessed
 * 
 * This is NOT a soft hide - this is a HARD SHUTDOWN.
 */

export const LEGACY_SYSTEMS_ENABLED = false;

/**
 * Legacy System Identifiers
 * 
 * These are the systems that are PERMANENTLY DISABLED.
 */
export const LEGACY_SYSTEMS = {
  // Old Gift System (REPLACED by Roast Gift System)
  OLD_GIFT_ENGINE: 'old_gift_engine',
  OLD_GIFT_TRANSACTIONS: 'old_gift_transactions',
  OLD_GIFT_UI: 'old_gift_ui',
  OLD_GIFT_ANIMATIONS: 'old_gift_animations',
  
  // Old VIP Club (REPLACED by Unified VIP Club)
  OLD_VIP_CLUB: 'old_vip_club',
  OLD_VIP_BADGES: 'old_vip_badges',
  OLD_VIP_LEVELS: 'old_vip_levels',
  
  // Old Ranking System (REPLACED by Roast Season Rankings)
  OLD_RANKING_SYSTEM: 'old_ranking_system',
  OLD_LEADERBOARD: 'old_leaderboard',
  OLD_CREATOR_STATS: 'old_creator_stats',
  
  // Old Battle Logic (REPLACED by Roast Battle System)
  OLD_BATTLE_ENGINE: 'old_battle_engine',
  OLD_BATTLE_MATCHMAKING: 'old_battle_matchmaking',
  
  // Old Chat Badges (REPLACED by Roast Chat Badges)
  OLD_CHAT_BADGES: 'old_chat_badges',
  OLD_BADGE_SYSTEM: 'old_badge_system',
} as const;

/**
 * Legacy Realtime Channels
 * 
 * These channels are BLOCKED from subscribing.
 */
export const LEGACY_REALTIME_CHANNELS = [
  'gifts:',
  'old_vip:',
  'old_ranking:',
  'old_battle:',
  'old_badges:',
  'legacy_',
] as const;

/**
 * Legacy Database Tables
 * 
 * These tables are BLOCKED from access.
 * They should be dropped or permission-blocked at the Supabase level.
 */
export const LEGACY_DATABASE_TABLES = [
  'gift_events',
  'gift_transactions',
  'gifts',
  'old_vip_members',
  'old_vip_clubs',
  'old_rankings',
  'old_leaderboards',
  'old_battle_matches',
  'old_chat_badges',
] as const;

/**
 * Event Whitelist - SINGLE SOURCE OF TRUTH
 * 
 * ONLY these systems are allowed to emit events.
 * Any event from other sources MUST be dropped.
 */
export const ALLOWED_EVENT_SOURCES = [
  'RoastGiftEngine',
  'RoastBattleManager',
  'RoastSeasonEngine',
  'RoastVIPEngine',
  'RoastChatBadgeSystem',
  'RoastLevelingSystem',
] as const;

/**
 * Throw error if legacy system attempts to initialize
 */
export function assertLegacySystemDisabled(systemName: string): void {
  if (!LEGACY_SYSTEMS_ENABLED) {
    const error = new Error(
      `🚨 LEGACY SYSTEM BLOCKED: "${systemName}" attempted to initialize but LEGACY_SYSTEMS_ENABLED = false. ` +
      `This is a HARD SHUTDOWN. Legacy systems are permanently disabled.`
    );
    console.error(error.message);
    throw error;
  }
}

/**
 * Log error if legacy UI component attempts to mount
 */
export function logLegacyUIMount(componentName: string): void {
  if (!LEGACY_SYSTEMS_ENABLED) {
    console.error(
      `🚨 LEGACY UI BLOCKED: "${componentName}" attempted to mount but LEGACY_SYSTEMS_ENABLED = false. ` +
      `This component should be removed from the codebase.`
    );
  }
}

/**
 * Block legacy realtime channel subscription
 */
export function isLegacyRealtimeChannel(channelName: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    for (const legacyPrefix of LEGACY_REALTIME_CHANNELS) {
      if (channelName.startsWith(legacyPrefix)) {
        console.error(
          `🚨 LEGACY CHANNEL BLOCKED: "${channelName}" is a legacy realtime channel. ` +
          `Subscription blocked.`
        );
        return true;
      }
    }
  }
  return false;
}

/**
 * Block legacy database table access
 */
export function isLegacyDatabaseTable(tableName: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    if (LEGACY_DATABASE_TABLES.includes(tableName as any)) {
      console.error(
        `🚨 LEGACY TABLE BLOCKED: "${tableName}" is a legacy database table. ` +
        `Access blocked. This table should be dropped or permission-blocked.`
      );
      return true;
    }
  }
  return false;
}

/**
 * Validate event source
 */
export function isAllowedEventSource(source: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    const allowed = ALLOWED_EVENT_SOURCES.includes(source as any);
    if (!allowed) {
      console.warn(
        `⚠️ EVENT DROPPED: Event from "${source}" was dropped. ` +
        `Only events from ${ALLOWED_EVENT_SOURCES.join(', ')} are allowed.`
      );
    }
    return allowed;
  }
  return true;
}

/**
 * Build-time legacy detection
 * 
 * This function should be called during build to detect legacy system references.
 * If any legacy systems are found, the build should fail.
 */
export function detectLegacySystems(): {
  hasLegacySystems: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // This is a runtime check - build-time checks would be in a separate script
  // For now, we log warnings
  
  if (LEGACY_SYSTEMS_ENABLED) {
    violations.push('LEGACY_SYSTEMS_ENABLED is set to true - should be false');
  }
  
  return {
    hasLegacySystems: violations.length > 0,
    violations,
  };
}

/**
 * Clear legacy persisted state
 * 
 * This function clears all legacy state from AsyncStorage/MMKV.
 */
export async function clearLegacyPersistedState(): Promise<void> {
  console.log('🗑️ Clearing legacy persisted state...');
  
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const legacyKeys = [
      'legacy_gift_state',
      'legacy_vip_state',
      'legacy_ranking_state',
      'legacy_battle_state',
      'legacy_badge_state',
      'old_gift_cache',
      'old_vip_cache',
      'old_ranking_cache',
    ];
    
    for (const key of legacyKeys) {
      try {
        await AsyncStorage.default.removeItem(key);
        console.log(`✅ Cleared legacy key: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clear legacy key: ${key}`, error);
      }
    }
    
    console.log('✅ Legacy persisted state cleared');
  } catch (error) {
    console.error('❌ Error clearing legacy persisted state:', error);
  }
}
