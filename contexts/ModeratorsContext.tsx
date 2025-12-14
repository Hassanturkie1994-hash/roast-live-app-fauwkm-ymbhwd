
import React, { createContext, useContext, useState, useCallback } from 'react';
import { moderationService } from '@/app/services/moderationService';
import { useAuth } from './AuthContext';

interface Moderator {
  id: string;
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string | null;
}

interface ModeratorsContextType {
  moderators: Moderator[];
  isLoading: boolean;
  refreshModerators: () => Promise<void>;
  addModerator: (userId: string) => Promise<boolean>;
  removeModerator: (userId: string) => Promise<boolean>;
}

const ModeratorsContext = createContext<ModeratorsContextType | undefined>(undefined);

export function ModeratorsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshModerators = useCallback(async () => {
    if (!user) {
      console.log('⚠️ [ModeratorsContext] No user, skipping refresh');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📥 [ModeratorsContext] Refreshing moderators for user:', user.id);

      const result = await moderationService.getModerators(user.id);
      
      const formattedModerators = result.map((mod: any) => ({
        id: mod.id,
        user_id: mod.user_id,
        display_name: mod.profiles?.display_name || 'Unknown',
        username: mod.profiles?.username || 'unknown',
        avatar_url: mod.profiles?.avatar_url,
      }));

      setModerators(formattedModerators);
      console.log('✅ [ModeratorsContext] Loaded', formattedModerators.length, 'moderators');
    } catch (error) {
      console.error('❌ [ModeratorsContext] Error refreshing moderators:', error);
      setModerators([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addModerator = useCallback(async (userId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ [ModeratorsContext] No user, cannot add moderator');
      return false;
    }

    try {
      console.log('➕ [ModeratorsContext] Adding moderator:', userId);
      
      // Use idempotent addModerator service
      const result = await moderationService.addModerator(user.id, userId, user.id);
      
      if (result.success) {
        // Refresh moderators list to sync with database
        await refreshModerators();
        console.log('✅ [ModeratorsContext] Moderator added successfully');
        return true;
      } else {
        console.error('❌ [ModeratorsContext] Failed to add moderator:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [ModeratorsContext] Exception adding moderator:', error);
      return false;
    }
  }, [user, refreshModerators]);

  const removeModerator = useCallback(async (userId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ [ModeratorsContext] No user, cannot remove moderator');
      return false;
    }

    try {
      console.log('➖ [ModeratorsContext] Removing moderator:', userId);
      
      const result = await moderationService.removeModerator(user.id, userId, user.id);
      
      if (result.success) {
        // Refresh moderators list to sync with database
        await refreshModerators();
        console.log('✅ [ModeratorsContext] Moderator removed successfully');
        return true;
      } else {
        console.error('❌ [ModeratorsContext] Failed to remove moderator:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [ModeratorsContext] Exception removing moderator:', error);
      return false;
    }
  }, [user, refreshModerators]);

  return (
    <ModeratorsContext.Provider
      value={{
        moderators,
        isLoading,
        refreshModerators,
        addModerator,
        removeModerator,
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
