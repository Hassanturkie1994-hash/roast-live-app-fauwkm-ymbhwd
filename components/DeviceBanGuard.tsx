
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { deviceBanService } from '@/app/services/deviceBanService';

/**
 * DeviceBanGuard Component
 * 
 * CRITICAL FIX: Properly exported as named export
 * 
 * Checks if the device is banned and redirects to access-restricted screen if so.
 * 
 * Usage:
 * import { DeviceBanGuard } from '@/components/DeviceBanGuard';
 * 
 * <DeviceBanGuard>
 *   <YourApp />
 * </DeviceBanGuard>
 */
export function DeviceBanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  const checkDeviceBan = useCallback(async () => {
    try {
      // Don't check on the access restricted screen itself
      if (pathname === '/access-restricted') {
        setChecking(false);
        return;
      }

      console.log('🔍 [DeviceBanGuard] Checking device ban status...');
      const { banned } = await deviceBanService.isDeviceBanned();
      
      if (banned) {
        console.log('🚫 [DeviceBanGuard] Device is banned, redirecting...');
        router.replace('/access-restricted' as any);
      } else {
        console.log('✅ [DeviceBanGuard] Device is not banned');
      }
      
      setChecking(false);
    } catch (error) {
      console.error('❌ [DeviceBanGuard] Error checking device ban:', error);
      // On error, allow access (fail open)
      setChecking(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkDeviceBan();
  }, [checkDeviceBan]);

  if (checking) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}

// Verify export is not undefined
if (typeof DeviceBanGuard === 'undefined') {
  console.error('❌ CRITICAL: DeviceBanGuard is undefined at export time!');
} else {
  console.log('✅ [DeviceBanGuard] Component exported successfully');
}
