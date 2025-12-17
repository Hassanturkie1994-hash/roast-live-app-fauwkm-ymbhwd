
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { unifiedVIPClubService, VIPClub } from '@/app/services/unifiedVIPClubService';
import { useAuth } from './AuthContext';

interface VIPClubContextType {
  myClub: VIPClub | null;
  loading: boolean;
  refreshClub: () => Promise<void>;
}

const VIPClubContext = createContext<VIPClubContextType | undefined>(undefined);

export function VIPClubProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [myClub, setMyClub] = useState<VIPClub | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClubs = useCallback(async () => {
    if (!user) {
      setMyClub(null);
      setLoading(false);
      return;
    }

    try {
      const club = await unifiedVIPClubService.getVIPClubByCreator(user.id);
      setMyClub(club);
    } catch (error) {
      console.error('Error loading VIP club:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const refreshClub = useCallback(async () => {
    setLoading(true);
    await loadClubs();
  }, [loadClubs]);

  return (
    <VIPClubContext.Provider value={{ myClub, loading, refreshClub }}>
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
