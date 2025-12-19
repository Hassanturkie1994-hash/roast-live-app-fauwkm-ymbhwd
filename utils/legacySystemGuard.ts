
/**
 * Legacy System Guard
 * 
 * Runtime guards to prevent legacy systems from initializing or executing.
 * 
 * This module provides:
 * 1. Runtime validation that legacy systems are disabled
 * 2. Event filtering to drop legacy events
 * 3. Realtime channel blocking
 * 4. Database table access blocking
 */

import {
  LEGACY_SYSTEMS_ENABLED,
  LEGACY_SYSTEMS,
  LEGACY_REALTIME_CHANNELS,
  LEGACY_DATABASE_TABLES,
  ALLOWED_EVENT_SOURCES,
  assertLegacySystemDisabled,
  logLegacyUIMount,
  isLegacyRealtimeChannel,
  isLegacyDatabaseTable,
  isAllowedEventSource,
  clearLegacyPersistedState,
} from '@/constants/LegacySystemConfig';

/**
 * Initialize Legacy System Guard
 * 
 * Call this at app startup to:
 * 1. Verify legacy systems are disabled
 * 2. Clear legacy persisted state
 * 3. Log startup status
 */
export async function initializeLegacySystemGuard(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️ [LEGACY GUARD] Initializing Legacy System Guard...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (LEGACY_SYSTEMS_ENABLED) {
    console.error('🚨 [LEGACY GUARD] CRITICAL: LEGACY_SYSTEMS_ENABLED = true');
    console.error('🚨 [LEGACY GUARD] Legacy systems should be PERMANENTLY DISABLED');
    console.error('🚨 [LEGACY GUARD] Set LEGACY_SYSTEMS_ENABLED = false in constants/LegacySystemConfig.ts');
    throw new Error('LEGACY SYSTEMS MUST BE DISABLED');
  }
  
  console.log('✅ [LEGACY GUARD] LEGACY_SYSTEMS_ENABLED = false');
  console.log('✅ [LEGACY GUARD] All legacy systems are HARD DISABLED');
  
  // Clear legacy persisted state
  await clearLegacyPersistedState();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [LEGACY GUARD] Legacy System Guard initialized');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Validate Service Initialization
 * 
 * Call this before initializing any service to ensure it's not a legacy system.
 */
export function validateServiceInitialization(serviceName: string): void {
  const legacyServiceNames = [
    'oldGiftService',
    'oldVIPService',
    'oldRankingService',
    'oldBattleService',
    'oldBadgeService',
    'legacyGiftEngine',
    'legacyVIPClub',
    'legacyRanking',
  ];
  
  if (legacyServiceNames.some(legacy => serviceName.toLowerCase().includes(legacy.toLowerCase()))) {
    assertLegacySystemDisabled(serviceName);
  }
}

/**
 * Filter Event by Source
 * 
 * Returns true if event should be processed, false if it should be dropped.
 */
export function filterEventBySource(eventSource: string, eventType: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    const allowed = isAllowedEventSource(eventSource);
    
    if (!allowed) {
      console.warn(
        `⚠️ [LEGACY GUARD] Event dropped: ${eventType} from ${eventSource}`
      );
    }
    
    return allowed;
  }
  
  return true;
}

/**
 * Validate Realtime Channel Subscription
 * 
 * Returns true if subscription is allowed, false if it should be blocked.
 */
export function validateRealtimeChannelSubscription(channelName: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    const isLegacy = isLegacyRealtimeChannel(channelName);
    
    if (isLegacy) {
      console.error(
        `🚨 [LEGACY GUARD] Realtime subscription BLOCKED: ${channelName}`
      );
      return false;
    }
  }
  
  return true;
}

/**
 * Validate Database Table Access
 * 
 * Returns true if access is allowed, false if it should be blocked.
 */
export function validateDatabaseTableAccess(tableName: string): boolean {
  if (!LEGACY_SYSTEMS_ENABLED) {
    const isLegacy = isLegacyDatabaseTable(tableName);
    
    if (isLegacy) {
      console.error(
        `🚨 [LEGACY GUARD] Database access BLOCKED: ${tableName}`
      );
      return false;
    }
  }
  
  return true;
}

/**
 * Validate UI Component Mount
 * 
 * Call this in useEffect of any component that might be legacy.
 */
export function validateUIComponentMount(componentName: string): void {
  const legacyComponentNames = [
    'OldGiftPage',
    'OldVIPPage',
    'OldRankingPage',
    'OldBattlePage',
    'OldBadgePage',
    'LegacyGiftSelector',
    'LegacyVIPPanel',
    'LegacyRankingDisplay',
  ];
  
  if (legacyComponentNames.some(legacy => componentName.includes(legacy))) {
    logLegacyUIMount(componentName);
  }
}

/**
 * Get Active Systems Report
 * 
 * Returns a report of which systems are active.
 */
export function getActiveSystemsReport(): {
  legacySystemsEnabled: boolean;
  activeSystems: string[];
  blockedSystems: string[];
} {
  return {
    legacySystemsEnabled: LEGACY_SYSTEMS_ENABLED,
    activeSystems: LEGACY_SYSTEMS_ENABLED ? [] : Array.from(ALLOWED_EVENT_SOURCES),
    blockedSystems: LEGACY_SYSTEMS_ENABLED ? [] : Object.values(LEGACY_SYSTEMS),
  };
}

/**
 * Export all validation functions
 */
export {
  assertLegacySystemDisabled,
  logLegacyUIMount,
  isLegacyRealtimeChannel,
  isLegacyDatabaseTable,
  isAllowedEventSource,
  clearLegacyPersistedState,
};
