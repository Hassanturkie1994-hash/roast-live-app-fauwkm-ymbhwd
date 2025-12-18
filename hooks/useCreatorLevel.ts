
/**
 * useCreatorLevel Hook
 * 
 * React hook for accessing creator level data and subscribing to updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { creatorLevelingService, CreatorLevel, CreatorPerk, CreatorUnlockedPerk } from '@/services/creatorLevelingService';

export function useCreatorLevel(creatorId: string) {
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<CreatorLevel | null>(null);
  const [allPerks, setAllPerks] = useState<CreatorPerk[]>([]);
  const [unlockedPerks, setUnlockedPerks] = useState<CreatorUnlockedPerk[]>([]);
  const [equippedPerks, setEquippedPerks] = useState<CreatorUnlockedPerk[]>([]);
  const [progress, setProgress] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get creator level
      const levelData = await creatorLevelingService.getCreatorLevel(creatorId);
      setLevel(levelData);

      if (levelData) {
        const prog = creatorLevelingService.getLevelProgress(
          levelData.current_xp,
          levelData.xp_to_next_level
        );
        setProgress(prog);
      }

      // Get all perks
      const perksData = await creatorLevelingService.getAllPerks();
      setAllPerks(perksData);

      // Get unlocked perks
      const unlockedData = await creatorLevelingService.getUnlockedPerks(creatorId);
      setUnlockedPerks(unlockedData);

      // Get equipped perks
      const equippedData = await creatorLevelingService.getEquippedPerks(creatorId);
      setEquippedPerks(equippedData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading creator level:', error);
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    loadData();

    // Subscribe to level updates
    const unsubscribeLevel = creatorLevelingService.subscribeToLevelUpdates(
      creatorId,
      (updatedLevel: CreatorLevel) => {
        setLevel(updatedLevel);
        const prog = creatorLevelingService.getLevelProgress(
          updatedLevel.current_xp,
          updatedLevel.xp_to_next_level
        );
        setProgress(prog);
      }
    );

    // Subscribe to perk unlocks
    const unsubscribePerks = creatorLevelingService.subscribeToPerkUnlocks(
      creatorId,
      () => {
        loadData(); // Reload all data when new perk unlocked
      }
    );

    return () => {
      unsubscribeLevel();
      unsubscribePerks();
    };
  }, [creatorId, loadData]);

  const equipPerk = useCallback(async (perkId: string) => {
    const success = await creatorLevelingService.equipPerk(creatorId, perkId);
    if (success) {
      await loadData();
    }
    return success;
  }, [creatorId, loadData]);

  const unequipPerk = useCallback(async (perkId: string) => {
    const success = await creatorLevelingService.unequipPerk(creatorId, perkId);
    if (success) {
      await loadData();
    }
    return success;
  }, [creatorId, loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    level,
    allPerks,
    unlockedPerks,
    equippedPerks,
    progress,
    equipPerk,
    unequipPerk,
    refresh,
  };
}
