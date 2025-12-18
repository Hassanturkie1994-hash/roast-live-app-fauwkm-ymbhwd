
import { useState, useEffect, useCallback } from 'react';
import { unifiedVIPClubService, VIPClubMember, VIPClub } from '@/app/services/unifiedVIPClubService';
import { vipLevelService } from '@/app/services/vipLevelService';

/**
 * useVIPMembership Hook
 * 
 * Hook for accessing VIP membership data for a specific creator.
 * 
 * Returns:
 * - membership: VIP membership details
 * - club: VIP club details
 * - isLoading: Loading state
 * - isMember: Whether user is a VIP member
 * - progress: Progress to next level (0-100)
 * - loyaltyStreak: Days since joined
 * - sekToNextLevel: SEK needed for next level
 * - refresh: Function to refresh data
 */
export function useVIPMembership(creatorId: string, userId: string) {
  const [membership, setMembership] = useState<VIPClubMember | null>(null);
  const [club, setClub] = useState<VIPClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loyaltyStreak, setLoyaltyStreak] = useState(0);
  const [sekToNextLevel, setSekToNextLevel] = useState(0);

  const loadData = useCallback(async () => {
    if (!creatorId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load club
      const clubData = await unifiedVIPClubService.getVIPClubByCreator(creatorId);
      setClub(clubData);

      if (!clubData) {
        setIsMember(false);
        setMembership(null);
        setIsLoading(false);
        return;
      }

      // Load membership
      const memberData = await unifiedVIPClubService.getVIPMemberDetails(clubData.id, userId);
      setMembership(memberData);
      setIsMember(!!memberData);

      if (memberData) {
        // Calculate progress
        const currentLevelBase = ((memberData.vip_level - 1) * 25000) / 19;
        const nextLevelBase = (memberData.vip_level * 25000) / 19;
        const levelRange = nextLevelBase - currentLevelBase;
        const currentProgress = memberData.total_gifted_sek - currentLevelBase;
        const progressPercent = Math.min(100, Math.max(0, (currentProgress / levelRange) * 100));
        setProgress(progressPercent);

        // Calculate loyalty streak
        const joined = new Date(memberData.joined_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joined.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setLoyaltyStreak(diffDays);

        // Calculate SEK to next level
        const sekNeeded = vipLevelService.calculateSEKForNextLevel(
          memberData.vip_level,
          memberData.total_gifted_sek
        );
        setSekToNextLevel(sekNeeded);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading VIP membership:', error);
      setIsLoading(false);
    }
  }, [creatorId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    membership,
    club,
    isLoading,
    isMember,
    progress,
    loyaltyStreak,
    sekToNextLevel,
    refresh,
  };
}
