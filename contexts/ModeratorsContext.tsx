
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { moderationService, Moderator } from '@/app/services/moderationService';

interface ModeratorsContextType {
  moderators: Moderator[];
  isLoading: boolean;
  error: string | null;
  selectedModeratorIds: string[];
  setSelectedModeratorIds: (ids: string[]) => void;
  refreshModerators: () => Promise<void>;
  addModerator: (userId: string) => Promise<boolean>;
  removeModerator: (userId: string) => Promise<boolean>;
  isModerator: (userId: string) => boolean;
}

const ModeratorsContext = createContext<ModeratorsContextType | undefined>(undefined);

export function ModeratorsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModeratorIds, setSelectedModeratorIds] = useState<string[]>([]);

  // Load moderators when user changes
  useEffect(() => {
    if (user) {
      loadModerators();
    } else {
      setModerators([]);
      setSelectedModeratorIds([]);
    }
  }, [user]);

  const loadModerators = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('📥 [ModeratorsContext] Loading moderators for user:', user.id);

      const result = await moderationService.getModerators(user.id);
      setModerators(result);
      
      const moderatorIds = result.map(m => m.user_id);
      setSelectedModeratorIds(moderatorIds);
      
      console.log('✅ [ModeratorsContext] Loaded', result.length, 'moderators');
    } catch (err) {
      console.error('❌ [ModeratorsContext] Error loading moderators:', err);
      setError('Failed to load moderators');
      setModerators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshModerators = async () => {
    await loadModerators();
  };

  const addModerator = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('➕ [ModeratorsContext] Adding moderator:', userId);
      const result = await moderationService.addModerator(user.id, userId, user.id);
      
      if (result.success) {
        await refreshModerators();
        return true;
      } else {
        setError(result.error || 'Failed to add moderator');
        return false;
      }
    } catch (err) {
      console.error('❌ [ModeratorsContext] Error adding moderator:', err);
      setError('Failed to add moderator');
      return false;
    }
  };

  const removeModerator = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('➖ [ModeratorsContext] Removing moderator:', userId);
      const result = await moderationService.removeModerator(user.id, userId, user.id);
      
      if (result.success) {
        await refreshModerators();
        return true;
      } else {
        setError(result.error || 'Failed to remove moderator');
        return false;
      }
    } catch (err) {
      console.error('❌ [ModeratorsContext] Error removing moderator:', err);
      setError('Failed to remove moderator');
      return false;
    }
  };

  const isModerator = (userId: string): boolean => {
    return selectedModeratorIds.includes(userId);
  };

  return (
    <ModeratorsContext.Provider
      value={{
        moderators,
        isLoading,
        error,
        selectedModeratorIds,
        setSelectedModeratorIds,
        refreshModerators,
        addModerator,
        removeModerator,
        isModerator,
      }}
    >
      {children}
    </ModeratorsContext.Provider>
  );
}

export function useModerators() {
  const context = useContext(ModeratorsContext);
  if (context === undefined) {
    throw new Error('useModerators must be used within a ModeratorsProvider');
  }
  return context;
}
