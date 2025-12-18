
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { unifiedVIPClubService, VIPClub } from '@/app/services/unifiedVIPClubService';
import { useAuth } from './AuthContext';

interface VIPClubContextType {
  club: VIPClub | null;
  isLoading: boolean;
  canCreateClub: boolean;
  hoursStreamed: number;
  hoursNeeded: number;
  refreshClub: () => Promise<void>;
}

const VIPClubContext = createContext<VIPClubContextType | undefined>(undefined);

export function VIPClubProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [club, setClub] = useState<VIPClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreateClub, setCanCreateClub] = useState(false);
  const [hoursStreamed, setHoursStreamed] = useState(0);
  const [hoursNeeded] = useState(10);

  const loadClubData = useCallback(async () => {
    if (!user) {
      setClub(null);
      setCanCreateClub(false);
      setHoursStreamed(0);
      setIsLoading(false);
      return;
    }

    try {
      // Load club
      const clubData = await unifiedVIPClubService.getVIPClubByCreator(user.id);
      setClub(clubData);

      // Check eligibility
      const eligibility = await unifiedVIPClubService.canCreateVIPClub(user.id);
      setCanCreateClub(eligibility.canCreate);
      setHoursStreamed(eligibility.hoursStreamed);
    } catch (error) {
      console.error('Error loading VIP club data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  const refreshClub = useCallback(async () => {
    setIsLoading(true);
    await loadClubData();
  }, [loadClubData]);

  return (
    <VIPClubContext.Provider 
      value={{ 
        club, 
        isLoading, 
        canCreateClub, 
        hoursStreamed, 
        hoursNeeded, 
        refreshClub 
      }}
    >
      {children}
    </VIPClubContext.Provider>
  );
}

export function useVIPClub() {
  const context = useContext(VIPClubContext);
  if (!context) {
    throw new Error('useVIPClub must be used within VIPClubProvider');
  }
  return context;
}
