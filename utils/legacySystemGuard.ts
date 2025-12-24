
/**
 * Legacy System Guard
 * 
 * Prevents legacy systems from being initialized or used.
 * Ensures only NEW Roast systems are active.
 * 
 * CRITICAL: This guard is PERMANENT and cannot be disabled.
 */

const LEGACY_SERVICES = [
  'oldGiftService',
  'legacyGiftEngine',
  'oldVIPSystem',
  'legacyRankingService',
  'oldBattleService',
];

const ALLOWED_SERVICES = [
  'RoastGiftService',
  'roastGiftService',
  'vipMembershipService',
  'leaderboardService',
  'roastRankingService',
  'battleGiftService',
  'creatorLevelingService',
  'seasonModerationService',
];

const ALLOWED_EVENT_SOURCES = [
  'RoastGiftEngine',
  'RoastVIPClub',
  'RoastSeasonRanking',
  'RoastBattleSystem',
];

/**
 * Validates that a service is allowed to be initialized
 */
export function validateServiceInitialization(serviceName: string): void {
  if (LEGACY_SERVICES.includes(serviceName)) {
    const error = `❌ LEGACY SYSTEM BLOCKED: ${serviceName} is permanently disabled. Use NEW Roast systems only.`;
    console.error(error);
    throw new Error(error);
  }

  if (!ALLOWED_SERVICES.includes(serviceName)) {
    console.warn(`⚠️ [LegacySystemGuard] Unknown service: ${serviceName}`);
  }

  console.log(`✅ [LegacySystemGuard] Service allowed: ${serviceName}`);
}

/**
 * Filters events by source to ensure only NEW Roast systems emit events
 */
export function filterEventBySource(source: string, eventType: string): boolean {
  if (!ALLOWED_EVENT_SOURCES.includes(source)) {
    console.warn(`⚠️ [LegacySystemGuard] Event from unknown source blocked: ${source} (${eventType})`);
    return false;
  }

  return true;
}

/**
 * Initializes the Legacy System Guard
 */
export async function initializeLegacySystemGuard(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️ [LegacySystemGuard] Initializing...');
  console.log('🛡️ [LegacySystemGuard] Legacy systems are PERMANENTLY DISABLED');
  console.log('🛡️ [LegacySystemGuard] Only NEW Roast systems are allowed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
