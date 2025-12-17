
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { unifiedVIPClubService, VIPClub } from '@/app/services/unifiedVIPClubService';

interface VIPClubContextType {
  club: VIPClub | null;
  isLoading: boolean;
  error: string | null;
  refreshClub: () => Promise<void>;
  canCreateClub: boolean;
  hoursStreamed: number;
  hoursNeeded: number;
}

const VIPClubContext = createContext<VIPClubContextType | undefined>(undefined);

export function VIPClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [club, setClub] = useState<VIPClub | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreateClub, setCanCreateClub] = useState(false);
  const [hoursStreamed, setHoursStreamed] = useState(0);
  const [hoursNeeded, setHoursNeeded] = useState(10);

  const loadClub = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('📥 [VIPClubContext] Loading VIP club for user:', user.id);

      // Check eligibility
      const eligibility = await unifiedVIPClubService.canCreateVIPClub(user.id);
      setCanCreateClub(eligibility.canCreate);
      setHoursStreamed(eligibility.hoursStreamed);
      setHoursNeeded(eligibility.hoursNeeded);

      // Load club
      const clubData = await unifiedVIPClubService.getVIPClubByCreator(user.id);
      setClub(clubData);

      if (clubData) {
        console.log('✅ [VIPClubContext] Loaded VIP club:', clubData.club_name);
      } else {
        console.log('ℹ️ [VIPClubContext] No VIP club found for this creator');
      }
    } catch (err) {
      console.error('❌ [VIPClubContext] Error loading VIP club:', err);
      setError('Failed to load VIP club');
      setClub(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadClub();
    } else {
      setClub(null);
      setCanCreateClub(false);
      setHoursStreamed(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshClub = async () => {
    await loadClub();
  };

  return (
    <VIPClubContext.Provider
      value={{
        club,
        isLoading,
        error,
        refreshClub,
        canCreateClub,
        hoursStreamed,
        hoursNeeded,
      }}
    >
      {children}
    </VIPClubContext.Provider>
  );
}

export function useVIPClub() {
  const context = useContext(VIPClubContext);
  if (context === undefined) {
    throw new Error('useVIPClub must be used within a VIPClubProvider');
  }
  return context;
}
