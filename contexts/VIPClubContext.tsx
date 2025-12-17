
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { creatorClubService, CreatorClub } from '@/app/services/creatorClubService';

interface VIPClubContextType {
  clubs: CreatorClub[];
  isLoading: boolean;
  error: string | null;
  selectedClubId: string | null;
  setSelectedClubId: (clubId: string | null) => void;
  refreshClubs: () => Promise<void>;
  getClubById: (clubId: string) => CreatorClub | undefined;
}

const VIPClubContext = createContext<VIPClubContextType | undefined>(undefined);

export function VIPClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<CreatorClub[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('📥 [VIPClubContext] Loading clubs for user:', user.id);

      const result = await creatorClubService.getCreatorClubs(user.id);

      if (result.success && result.data) {
        setClubs(result.data);
        console.log('✅ [VIPClubContext] Loaded', result.data.length, 'clubs');
        
        // Auto-select first active club if none selected
        if (!selectedClubId && result.data.length > 0) {
          setSelectedClubId(result.data[0].id);
          console.log('🎯 [VIPClubContext] Auto-selected first club:', result.data[0].id);
        }
      } else {
        console.warn('⚠️ [VIPClubContext] No clubs found or error:', result.error);
        setError(result.error || 'Failed to load clubs');
        setClubs([]);
      }
    } catch (err) {
      console.error('❌ [VIPClubContext] Error loading clubs:', err);
      setError('Failed to load clubs');
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedClubId]);

  // Load clubs when user changes
  useEffect(() => {
    if (user) {
      loadClubs();
    } else {
      setClubs([]);
      setSelectedClubId(null);
    }
  }, [user, loadClubs]);

  const refreshClubs = async () => {
    await loadClubs();
  };

  const getClubById = (clubId: string): CreatorClub | undefined => {
    return clubs.find(club => club.id === clubId);
  };

  return (
    <VIPClubContext.Provider
      value={{
        clubs,
        isLoading,
        error,
        selectedClubId,
        setSelectedClubId,
        refreshClubs,
        getClubById,
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
