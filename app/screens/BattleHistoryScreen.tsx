
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { supabase } from '@/app/integrations/supabase/client';

interface BattleRecord {
  id: string;
  format: string;
  winner_team: 'team_a' | 'team_b' | 'draw' | null;
  team_a_score: number;
  team_b_score: number;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  was_winner: boolean;
  reward_amount_sek: number;
}

export default function BattleHistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [battles, setBattles] = useState<BattleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBattles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    loadBattleHistory();
  }, []);

  const loadBattleHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get battle rewards for this user
      const { data: rewards, error } = await supabase
        .from('battle_rewards')
        .select(`
          *,
          battle_matches (
            id,
            format,
            winner_team,
            team_a_score,
            team_b_score,
            started_at,
            ended_at,
            duration_minutes
          )
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading battle history:', error);
        return;
      }

      const battleRecords: BattleRecord[] = rewards.map((reward: any) => ({
        id: reward.match_id,
        format: reward.battle_matches.format,
        winner_team: reward.battle_matches.winner_team,
        team_a_score: reward.battle_matches.team_a_score,
        team_b_score: reward.battle_matches.team_b_score,
        started_at: reward.battle_matches.started_at,
        ended_at: reward.battle_matches.ended_at,
        duration_minutes: reward.battle_matches.duration_minutes,
        was_winner: reward.is_winner,
        reward_amount_sek: reward.reward_amount_sek,
      }));

      setBattles(battleRecords);

      // Calculate stats
      const totalBattles = battleRecords.length;
      const wins = battleRecords.filter((b) => b.was_winner).length;
      const draws = battleRecords.filter((b) => b.winner_team === 'draw').length;
      const losses = totalBattles - wins - draws;
      const totalEarnings = battleRecords.reduce((sum, b) => sum + b.reward_amount_sek, 0);

      setStats({
        totalBattles,
        wins,
        losses,
        draws,
        totalEarnings,
      });
    } catch (error) {
      console.error('Error loading battle history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResultColor = (battle: BattleRecord) => {
    if (battle.winner_team === 'draw') return colors.textSecondary;
    return battle.was_winner ? '#4CAF50' : '#F44336';
  };

  const getResultText = (battle: BattleRecord) => {
    if (battle.winner_team === 'draw') return 'DRAW';
    return battle.was_winner ? 'VICTORY' : 'DEFEAT';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Battle History</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading battles...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Overview */}
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Battle Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalBattles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Battles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.wins}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.losses}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Losses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.textSecondary }]}>{stats.draws}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Draws</Text>
              </View>
            </View>
            <View style={[styles.earningsRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>Total Earnings</Text>
              <Text style={[styles.earningsValue, { color: colors.brandPrimary }]}>
                {stats.totalEarnings.toLocaleString()} SEK
              </Text>
            </View>
          </View>

          {/* Battle List */}
          {battles.length === 0 ? (
            <View style={styles.emptyState}>
              <UnifiedRoastIcon name="flame" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No battle history yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Join a battle to start building your record
              </Text>
            </View>
          ) : (
            <View style={styles.battleList}>
              {battles.map((battle) => (
                <View key={battle.id} style={[styles.battleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.battleHeader}>
                    <View style={[styles.resultBadge, { backgroundColor: getResultColor(battle) }]}>
                      <Text style={styles.resultText}>{getResultText(battle)}</Text>
                    </View>
                    <View style={[styles.formatBadge, { backgroundColor: colors.backgroundAlt }]}>
                      <Text style={[styles.formatText, { color: colors.text }]}>{battle.format.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}>
                      <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Team A</Text>
                      <Text style={[styles.scoreValue, { color: colors.text }]}>{battle.team_a_score}</Text>
                    </View>
                    <Text style={[styles.vs, { color: colors.textSecondary }]}>VS</Text>
                    <View style={styles.scoreItem}>
                      <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Team B</Text>
                      <Text style={[styles.scoreValue, { color: colors.text }]}>{battle.team_b_score}</Text>
                    </View>
                  </View>

                  <View style={styles.battleFooter}>
                    <View style={styles.battleInfo}>
                      <UnifiedRoastIcon name="history" size={14} color={colors.textSecondary} />
                      <Text style={[styles.battleInfoText, { color: colors.textSecondary }]}>
                        {battle.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.battleInfo}>
                      <UnifiedRoastIcon name="lava-wallet" size={14} color={colors.brandPrimary} />
                      <Text style={[styles.battleInfoText, { color: colors.brandPrimary }]}>
                        +{battle.reward_amount_sek} SEK
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.battleDate, { color: colors.textSecondary }]}>
                    {new Date(battle.ended_at).toLocaleDateString()} at {new Date(battle.ended_at).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  battleList: {
    gap: 12,
  },
  battleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  vs: {
    fontSize: 16,
    fontWeight: '700',
  },
  battleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  battleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  battleInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  battleDate: {
    fontSize: 11,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
