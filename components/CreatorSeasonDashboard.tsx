
/**
 * Creator Season Dashboard Component
 * 
 * Creator-side protections for Roast Ranking Seasons.
 * 
 * Rules:
 * - No penalties for going offline
 * - No forced participation
 * - Rankings are opt-in by going live
 * 
 * Burnout prevention:
 * - Daily score caps
 * - Soft diminishing returns after long sessions
 * - Cooldown suggestions in UI
 * 
 * Transparency:
 * - Creators see rank movement
 * - Creators do NOT see exact formulas
 * - Creators see top contributors (optional)
 * 
 * Season reset:
 * - Old ranks archived
 * - New season starts clean
 * - Prestige history preserved
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { LinearGradient } from 'expo-linear-gradient';

interface CreatorSeasonDashboardProps {
  creatorId: string;
}

interface SeasonProgress {
  season_id: string;
  season_name: string;
  season_score: number;
  rank_tier: string | null;
  current_rank: number;
  total_creators: number;
  percentile: number;
  next_tier_threshold: number;
  progress_to_next_tier: number;
}

interface TopContributor {
  roaster_id: string;
  username: string;
  total_gifts_sek: number;
  first_gift_at: string;
}

interface DailyStats {
  today_score: number;
  daily_cap: number;
  cap_reached: boolean;
  session_duration_minutes: number;
  diminishing_returns_active: boolean;
  suggested_cooldown_minutes: number;
}

export const CreatorSeasonDashboard: React.FC<CreatorSeasonDashboardProps> = ({
  creatorId,
}) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [showTopContributors, setShowTopContributors] = useState(false);
  const [pastSeasons, setPastSeasons] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    subscribeToUpdates();
  }, [creatorId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load season progress
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_creator_season_progress', { p_creator_id: creatorId });

      if (!progressError && progressData && progressData.length > 0) {
        setProgress(progressData[0] as SeasonProgress);
      }

      // Load daily stats (placeholder - would be calculated server-side)
      setDailyStats({
        today_score: 450,
        daily_cap: 1000,
        cap_reached: false,
        session_duration_minutes: 120,
        diminishing_returns_active: false,
        suggested_cooldown_minutes: 0,
      });

      // Load past seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('roast_seasonal_rewards')
        .select('*')
        .eq('creator_id', creatorId)
        .order('granted_at', { ascending: false })
        .limit(5);

      if (!seasonsError && seasonsData) {
        setPastSeasons(seasonsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const loadTopContributors = async () => {
    if (!progress) return;

    try {
      const { data, error } = await supabase
        .from('roast_ranking_unique_roasters')
        .select('roaster_id, total_gifts_sek, first_gift_at, profiles!roaster_id(username)')
        .eq('season_id', progress.season_id)
        .eq('creator_id', creatorId)
        .order('total_gifts_sek', { ascending: false })
        .limit(10);

      if (!error && data) {
        const contributors = data.map((item: any) => ({
          roaster_id: item.roaster_id,
          username: item.profiles?.username || 'Unknown',
          total_gifts_sek: item.total_gifts_sek,
          first_gift_at: item.first_gift_at,
        }));
        setTopContributors(contributors);
      }
    } catch (error) {
      console.error('Error loading top contributors:', error);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`creator_rank_updates:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_season_scores',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatScore = (score: number): string => {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.noSeasonContainer}>
        <Text style={styles.noSeasonText}>No Active Season</Text>
        <Text style={styles.noSeasonSubtext}>
          Rankings are opt-in by going live. Start streaming to participate!
        </Text>
      </View>
    );
  }

  const tierColor = getTierColor(progress.rank_tier);

  return (
    <ScrollView style={styles.container}>
      {/* Current Season Card */}
      <LinearGradient
        colors={[tierColor + '40', tierColor + '10']}
        style={styles.seasonCard}
      >
        <View style={styles.seasonHeader}>
          <View>
            <Text style={styles.seasonTitle}>{progress.season_name}</Text>
            <Text style={styles.seasonSubtitle}>Current Season</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierBadgeText}>
              {getTierIcon(progress.rank_tier)} {progress.rank_tier || 'Unranked'}
            </Text>
          </View>
        </View>

        <View style={styles.rankSection}>
          <View style={styles.rankItem}>
            <Text style={styles.rankLabel}>Your Rank</Text>
            <Text style={[styles.rankValue, { color: tierColor }]}>
              #{progress.current_rank}
            </Text>
            <Text style={styles.rankSubtext}>
              Top {Math.round(100 - progress.percentile)}%
            </Text>
          </View>

          <View style={styles.rankItem}>
            <Text style={styles.rankLabel}>Season Score</Text>
            <Text style={[styles.rankValue, { color: tierColor }]}>
              {formatScore(progress.season_score)}
            </Text>
            <Text style={styles.rankSubtext}>
              {formatScore(progress.next_tier_threshold - progress.season_score)} to next tier
            </Text>
          </View>
        </View>

        {/* Progress to Next Tier */}
        <View style={styles.tierProgressSection}>
          <Text style={styles.tierProgressLabel}>Progress to Next Tier</Text>
          <View style={styles.tierProgressBar}>
            <View
              style={[
                styles.tierProgressFill,
                {
                  width: `${progress.progress_to_next_tier}%`,
                  backgroundColor: tierColor,
                },
              ]}
            />
          </View>
          <Text style={styles.tierProgressText}>
            {Math.round(progress.progress_to_next_tier)}%
          </Text>
        </View>
      </LinearGradient>

      {/* Burnout Prevention */}
      {dailyStats && (
        <View style={styles.burnoutCard}>
          <Text style={styles.cardTitle}>Today&apos;s Activity</Text>
          
          <View style={styles.dailyCapSection}>
            <View style={styles.dailyCapHeader}>
              <Text style={styles.dailyCapLabel}>Daily Score</Text>
              <Text style={styles.dailyCapValue}>
                {formatScore(dailyStats.today_score)} / {formatScore(dailyStats.daily_cap)}
              </Text>
            </View>
            <View style={styles.dailyCapBar}>
              <View
                style={[
                  styles.dailyCapFill,
                  {
                    width: `${(dailyStats.today_score / dailyStats.daily_cap) * 100}%`,
                    backgroundColor: dailyStats.cap_reached ? '#FF6B6B' : '#4CAF50',
                  },
                ]}
              />
            </View>
            {dailyStats.cap_reached && (
              <Text style={styles.capReachedText}>
                ⚠️ Daily cap reached. Take a break!
              </Text>
            )}
          </View>

          {dailyStats.diminishing_returns_active && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⏱️ Diminishing returns active after {dailyStats.session_duration_minutes} minutes
              </Text>
            </View>
          )}

          {dailyStats.suggested_cooldown_minutes > 0 && (
            <View style={styles.cooldownBanner}>
              <Text style={styles.cooldownText}>
                💤 Suggested cooldown: {dailyStats.suggested_cooldown_minutes} minutes
              </Text>
              <Text style={styles.cooldownSubtext}>
                Your well-being matters! Take a break to maintain peak performance.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Top Contributors (Optional) */}
      <View style={styles.contributorsCard}>
        <TouchableOpacity
          style={styles.contributorsHeader}
          onPress={() => {
            setShowTopContributors(!showTopContributors);
            if (!showTopContributors && topContributors.length === 0) {
              loadTopContributors();
            }
          }}
        >
          <Text style={styles.cardTitle}>Top Contributors</Text>
          <Text style={styles.toggleIcon}>
            {showTopContributors ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showTopContributors && (
          <View style={styles.contributorsList}>
            {topContributors.length === 0 ? (
              <Text style={styles.noContributorsText}>
                No contributors yet this season
              </Text>
            ) : (
              topContributors.map((contributor, index) => (
                <View key={contributor.roaster_id} style={styles.contributorItem}>
                  <View style={styles.contributorRank}>
                    <Text style={styles.contributorRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.contributorInfo}>
                    <Text style={styles.contributorUsername}>
                      {contributor.username}
                    </Text>
                    <Text style={styles.contributorAmount}>
                      {contributor.total_gifts_sek} SEK
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* Prestige History */}
      {pastSeasons.length > 0 && (
        <View style={styles.prestigeCard}>
          <Text style={styles.cardTitle}>Prestige History</Text>
          {pastSeasons.map((season) => (
            <View key={season.id} style={styles.prestigeItem}>
              <View style={styles.prestigeIcon}>
                <Text style={styles.prestigeIconText}>{season.badge_icon}</Text>
              </View>
              <View style={styles.prestigeInfo}>
                <Text style={styles.prestigeTier}>{season.tier_name}</Text>
                <Text style={styles.prestigeRank}>
                  Rank #{season.final_rank} • {formatScore(season.final_score)} pts
                </Text>
              </View>
              {season.is_top_tier && (
                <View style={styles.topTierBadge}>
                  <Text style={styles.topTierText}>TOP 10</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          ℹ️ Rankings update automatically when you go live. No penalties for taking breaks!
        </Text>
      </View>
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
    marginBottom: 12,
  },
  noSeasonSubtext: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  seasonCard: {
    borderRadius: 20,
    padding: 24,
    margin: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  seasonTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  seasonSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tierBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  rankItem: {
    alignItems: 'center',
  },
  rankLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 8,
  },
  rankValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankSubtext: {
    color: '#CCCCCC',
    fontSize: 11,
  },
  tierProgressSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  tierProgressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tierProgressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  tierProgressText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'right',
  },
  burnoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dailyCapSection: {
    marginBottom: 16,
  },
  dailyCapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dailyCapLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  dailyCapValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dailyCapBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dailyCapFill: {
    height: '100%',
    borderRadius: 4,
  },
  capReachedText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cooldownBanner: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 12,
  },
  cooldownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cooldownSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  contributorsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  contributorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  contributorsList: {
    marginTop: 16,
  },
  noContributorsText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contributorRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contributorRankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contributorAmount: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  prestigeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  prestigeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  prestigeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prestigeIconText: {
    fontSize: 24,
  },
  prestigeInfo: {
    flex: 1,
  },
  prestigeTier: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prestigeRank: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  topTierBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topTierText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
