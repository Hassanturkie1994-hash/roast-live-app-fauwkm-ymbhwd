
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { deviceBanService } from '@/app/services/deviceBanService';

export function DeviceBanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDeviceBan();
  }, [pathname]);

  const checkDeviceBan = async () => {
    // Don't check on the access restricted screen itself
    if (pathname === '/access-restricted') {
      setChecking(false);
      return;
    }

    const { banned } = await deviceBanService.isDeviceBanned();
    
    if (banned) {
      router.replace('/access-restricted' as any);
    }
    
    setChecking(false);
  };

  if (checking) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}