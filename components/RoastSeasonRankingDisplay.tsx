
/**
 * Roast Season Ranking Display Component
 * 
 * Displays user's current season ranking with tier badge and stats.
 * Shows leaderboard with top creators.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { roastRankingService, RoastRankingEntry, RoastRankTier } from '@/services/roastRankingService';
import { supabase } from '@/app/integrations/supabase/client';

interface RoastSeasonRankingDisplayProps {
  userId: string;
  showLeaderboard?: boolean;
  leaderboardLimit?: number;
}

export const RoastSeasonRankingDisplay: React.FC<RoastSeasonRankingDisplayProps> = ({
  userId,
  showLeaderboard = true,
  leaderboardLimit = 100,
}) => {
  const [loading, setLoading] = useState(true);
  const [userRanking, setUserRanking] = useState<RoastRankingEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<RoastRankingEntry[]>([]);
  const [tiers, setTiers] = useState<RoastRankTier[]>([]);
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);

  useEffect(() => {
    loadRankingData();
  }, [userId]);

  const loadRankingData = async () => {
    try {
      setLoading(true);

      // Get current season
      const season = await roastRankingService.getCurrentSeason();
      if (!season) {
        console.log('No active season');
        setLoading(false);
        return;
      }

      setCurrentSeasonId(season.id);

      // Get user's ranking
      const ranking = await roastRankingService.getUserRanking(userId);
      setUserRanking(ranking);

      // Get leaderboard
      if (showLeaderboard) {
        const rankings = await roastRankingService.getSeasonRankings(
          season.id,
          'global',
          leaderboardLimit
        );
        setLeaderboard(rankings);
      }

      // Get rank tiers
      const rankTiers = await roastRankingService.getRankTiers(season.id);
      setTiers(rankTiers);

      setLoading(false);
    } catch (error) {
      console.error('Error loading ranking data:', error);
      setLoading(false);
    }
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

  const formatScore = (score: number): string => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  if (!currentSeasonId) {
    return (
      <View style={styles.noSeasonContainer}>
        <Text style={styles.noSeasonText}>No active season</Text>
        <Text style={styles.noSeasonSubtext}>Check back soon for the next season!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User's Ranking Card */}
      {userRanking && (
        <View style={styles.userRankingCard}>
          <View style={styles.userRankingHeader}>
            <Text style={styles.userRankingTitle}>Your Season Ranking</Text>
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(userRanking.current_tier) }]}>
              <Text style={styles.tierBadgeText}>
                {getTierBadge(userRanking.current_tier)} {userRanking.current_tier || 'Unranked'}
              </Text>
            </View>
          </View>

          <View style={styles.userRankingStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={styles.statValue}>#{userRanking.rank}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{formatScore(userRanking.composite_score)}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Team Battles</Text>
              <Text style={styles.statValue}>
                {userRanking.team_battles_won}/{userRanking.team_battles_participated}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Win Rate</Text>
              <Text style={styles.statValue}>
                {userRanking.team_battles_participated > 0
                  ? `${Math.round((userRanking.team_battles_won / userRanking.team_battles_participated) * 100)}%`
                  : '0%'}
              </Text>
            </View>
          </View>

          <View style={styles.scoreBreakdown}>
            <Text style={styles.scoreBreakdownTitle}>Score Breakdown</Text>
            
            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Individual Gifts</Text>
              <Text style={styles.scoreBreakdownValue}>
                {formatScore(userRanking.individual_weighted_gift_score)}
              </Text>
            </View>

            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Team Contribution</Text>
              <Text style={styles.scoreBreakdownValue}>
                {formatScore(userRanking.team_contribution_score)}
              </Text>
            </View>

            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Unique Roasters</Text>
              <Text style={styles.scoreBreakdownValue}>
                {formatScore(userRanking.unique_roasters_impact)}
              </Text>
            </View>

            <View style={styles.scoreBreakdownItem}>
              <Text style={styles.scoreBreakdownLabel}>Hype Momentum</Text>
              <Text style={styles.scoreBreakdownValue}>
                {formatScore(userRanking.hype_momentum_score)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Rank Tiers */}
      {tiers.length > 0 && (
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>Rank Tiers</Text>
          {tiers.map((tier) => (
            <View
              key={tier.id}
              style={[
                styles.tierItem,
                userRanking?.current_tier === tier.tier_name && styles.tierItemActive,
              ]}
            >
              <View style={styles.tierItemLeft}>
                <Text style={styles.tierBadgeIcon}>{tier.badge_icon}</Text>
                <View>
                  <Text style={styles.tierName}>{tier.tier_name}</Text>
                  <Text style={styles.tierRange}>
                    {formatScore(tier.min_score)} - {tier.max_score ? formatScore(tier.max_score) : '∞'}
                  </Text>
                </View>
              </View>
              {userRanking?.current_tier === tier.tier_name && (
                <View style={styles.currentTierBadge}>
                  <Text style={styles.currentTierText}>Current</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Leaderboard */}
      {showLeaderboard && leaderboard.length > 0 && (
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Top {leaderboardLimit} Creators</Text>
          {leaderboard.map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.leaderboardItem,
                entry.creator_id === userId && styles.leaderboardItemHighlight,
              ]}
            >
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>#{entry.rank}</Text>
              </View>

              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardUsername}>
                  {(entry as any).profiles?.username || 'Unknown'}
                </Text>
                <Text style={styles.leaderboardTier}>
                  {getTierBadge(entry.current_tier)} {entry.current_tier || 'Unranked'}
                </Text>
              </View>

              <View style={styles.leaderboardScore}>
                <Text style={styles.leaderboardScoreValue}>
                  {formatScore(entry.composite_score)}
                </Text>
                <Text style={styles.leaderboardScoreLabel}>Score</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadRankingData}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Rankings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  noSeasonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  noSeasonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noSeasonSubtext: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  userRankingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  userRankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userRankingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userRankingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
  },
  scoreBreakdownTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreBreakdownLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  scoreBreakdownValue: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tiersSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tierItemActive: {
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  tierItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBadgeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tierName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierRange: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  currentTierBadge: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentTierText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaderboardSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  leaderboardItemHighlight: {
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardUsername: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leaderboardTier: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  leaderboardScore: {
    alignItems: 'flex-end',
  },
  leaderboardScoreValue: {
    color: '#FF1493',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardScoreLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
