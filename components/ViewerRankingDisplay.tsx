
/**
 * Viewer Ranking Display Component
 * 
 * Displays creator rank badge during live, season progress bar,
 * rank-up animations, and battle win streak indicators.
 * 
 * Psychology rules:
 * - Rank progress is always visible
 * - Near-rank-up states are emphasized
 * - Viewers are nudged to "push creator over the edge"
 * 
 * Viewer actions:
 * - Gifting increases rank momentum
 * - Combo streaks boost hype, not raw score
 * - Battle wins cause rank spikes
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { roastRankingService, RoastRankingEntry, RoastRankTier } from '@/services/roastRankingService';
import { supabase } from '@/app/integrations/supabase/client';

interface ViewerRankingDisplayProps {
  creatorId: string;
  streamId?: string;
  showProgress?: boolean;
  showStreakIndicator?: boolean;
}

export const ViewerRankingDisplay: React.FC<ViewerRankingDisplayProps> = ({
  creatorId,
  streamId,
  showProgress = true,
  showStreakIndicator = true,
}) => {
  const [ranking, setRanking] = useState<RoastRankingEntry | null>(null);
  const [tiers, setTiers] = useState<RoastRankTier[]>([]);
  const [nextTier, setNextTier] = useState<RoastRankTier | null>(null);
  const [progressToNextTier, setProgressToNextTier] = useState(0);
  const [isNearRankUp, setIsNearRankUp] = useState(false);
  const [battleWinStreak, setBattleWinStreak] = useState(0);

  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadRankingData();
    
    // Subscribe to ranking updates
    const channel = supabase
      .channel(`creator_rank:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roast_ranking_entries',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          console.log('📡 [ViewerRankingDisplay] Ranking update received:', payload);
          if (payload.new) {
            handleRankingUpdate(payload.new as RoastRankingEntry);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  useEffect(() => {
    if (isNearRankUp) {
      // Start pulsing animation when near rank-up
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start glowing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isNearRankUp]);

  const loadRankingData = async () => {
    try {
      // Get current season
      const season = await roastRankingService.getCurrentSeason();
      if (!season) return;

      // Get creator's ranking
      const creatorRanking = await roastRankingService.getUserRanking(creatorId);
      if (creatorRanking) {
        setRanking(creatorRanking);
      }

      // Get rank tiers
      const rankTiers = await roastRankingService.getRankTiers(season.id);
      setTiers(rankTiers);

      // Calculate progress to next tier
      if (creatorRanking && rankTiers.length > 0) {
        calculateProgressToNextTier(creatorRanking, rankTiers);
      }

      // Calculate battle win streak
      if (creatorRanking) {
        calculateBattleWinStreak(creatorRanking);
      }
    } catch (error) {
      console.error('Error loading ranking data:', error);
    }
  };

  const handleRankingUpdate = (updatedRanking: RoastRankingEntry) => {
    const oldRanking = ranking;
    setRanking(updatedRanking);

    // Check if rank improved
    if (oldRanking && updatedRanking.rank < oldRanking.rank) {
      // Trigger rank-up animation
      triggerRankUpAnimation();
    }

    // Recalculate progress
    if (tiers.length > 0) {
      calculateProgressToNextTier(updatedRanking, tiers);
    }

    // Recalculate win streak
    calculateBattleWinStreak(updatedRanking);
  };

  const calculateProgressToNextTier = (ranking: RoastRankingEntry, tiers: RoastRankTier[]) => {
    const currentTier = tiers.find(t => t.tier_name === ranking.current_tier);
    if (!currentTier) return;

    const currentTierIndex = tiers.findIndex(t => t.tier_name === ranking.current_tier);
    if (currentTierIndex === -1 || currentTierIndex === tiers.length - 1) {
      // Already at max tier
      setNextTier(null);
      setProgressToNextTier(100);
      setIsNearRankUp(false);
      return;
    }

    const nextTierData = tiers[currentTierIndex + 1];
    setNextTier(nextTierData);

    // Calculate progress percentage
    const currentScore = ranking.composite_score;
    const tierMin = currentTier.min_score;
    const tierMax = nextTierData.min_score;
    const progress = ((currentScore - tierMin) / (tierMax - tierMin)) * 100;
    setProgressToNextTier(Math.min(100, Math.max(0, progress)));

    // Check if near rank-up (within 10%)
    setIsNearRankUp(progress >= 90);
  };

  const calculateBattleWinStreak = (ranking: RoastRankingEntry) => {
    // This would require fetching recent battle history
    // For now, use a simple calculation based on win rate
    const winRate = ranking.team_battles_participated > 0
      ? ranking.team_battles_won / ranking.team_battles_participated
      : 0;

    // Estimate streak (this is a placeholder)
    const estimatedStreak = Math.floor(winRate * 5);
    setBattleWinStreak(estimatedStreak);
  };

  const triggerRankUpAnimation = () => {
    // Trigger a celebration animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getTierColor = (tierName: string | null): string => {
    if (!tierName) return '#CCCCCC';
    const tier = tiers.find(t => t.tier_name === tierName);
    return tier?.badge_color || '#CCCCCC';
  };

  const getTierBadge = (tierName: string | null): string => {
    if (!tierName) return '🏅';
    const tier = tiers.find(t => t.tier_name === tierName);
    return tier?.badge_icon || '🏅';
  };

  if (!ranking) {
    return null;
  }

  const tierColor = getTierColor(ranking.current_tier);
  const tierBadge = getTierBadge(ranking.current_tier);

  return (
    <View style={styles.container}>
      {/* Rank Badge */}
      <Animated.View
        style={[
          styles.rankBadge,
          { 
            backgroundColor: tierColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.rankBadgeIcon}>{tierBadge}</Text>
        <Text style={styles.rankBadgeText}>#{ranking.rank}</Text>
      </Animated.View>

      {/* Season Progress Bar */}
      {showProgress && nextTier && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {ranking.current_tier || 'Unranked'} → {nextTier.tier_name}
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progressToNextTier)}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: `${progressToNextTier}%`,
                  backgroundColor: tierColor,
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ]}
            />
          </View>
          {isNearRankUp && (
            <View style={styles.nearRankUpBanner}>
              <Text style={styles.nearRankUpText}>🔥 Almost there! Keep gifting to rank up! 🔥</Text>
            </View>
          )}
        </View>
      )}

      {/* Battle Win Streak Indicator */}
      {showStreakIndicator && battleWinStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakIcon}>⚔️</Text>
          <Text style={styles.streakText}>{battleWinStreak} Win Streak</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  rankBadgeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressPercentage: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  nearRankUpBanner: {
    backgroundColor: '#FF1493',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  nearRankUpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
