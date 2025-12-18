
/**
 * Season Admin Panel Component
 * 
 * Admin interface for managing Roast Ranking Seasons.
 * 
 * Features:
 * - Create new seasons
 * - End current season
 * - View season statistics
 * - Moderate rankings
 * - Grant/revoke rewards
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { roastRankingService, RoastRankingSeason } from '@/services/roastRankingService';
import { seasonModerationService } from '@/services/seasonModerationService';

export const SeasonAdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<RoastRankingSeason | null>(null);
  const [allSeasons, setAllSeasons] = useState<RoastRankingSeason[]>([]);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonDuration, setNewSeasonDuration] = useState('14');
  const [seasonStats, setSeasonStats] = useState<any>(null);

  useEffect(() => {
    loadSeasonData();
  }, []);

  const loadSeasonData = async () => {
    try {
      setLoading(true);

      // Load current season
      const season = await roastRankingService.getCurrentSeason();
      setCurrentSeason(season);

      // Load all seasons
      const { data: seasons, error } = await supabase
        .from('roast_ranking_seasons')
        .select('*')
        .order('season_number', { ascending: false });

      if (!error && seasons) {
        setAllSeasons(seasons as RoastRankingSeason[]);
      }

      // Load season stats
      if (season) {
        await loadSeasonStats(season.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading season data:', error);
      setLoading(false);
    }
  };

  const loadSeasonStats = async (seasonId: string) => {
    try {
      const { data, error } = await supabase
        .from('creator_season_scores')
        .select('season_score')
        .eq('season_id', seasonId);

      if (!error && data) {
        const totalCreators = data.length;
        const totalScore = data.reduce((sum, item) => sum + item.season_score, 0);
        const avgScore = totalCreators > 0 ? totalScore / totalCreators : 0;

        setSeasonStats({
          total_creators: totalCreators,
          total_score: totalScore,
          avg_score: avgScore,
        });
      }
    } catch (error) {
      console.error('Error loading season stats:', error);
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) {
      Alert.alert('Error', 'Please enter a season name');
      return;
    }

    const duration = parseInt(newSeasonDuration);
    if (isNaN(duration) || duration < 1 || duration > 90) {
      Alert.alert('Error', 'Duration must be between 1 and 90 days');
      return;
    }

    Alert.alert(
      'Create New Season',
      `This will end the current season and start "${newSeasonName}" for ${duration} days. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          style: 'destructive',
          onPress: async () => {
            const newSeason = await roastRankingService.createSeason(duration);
            if (newSeason) {
              // Update the name
              await supabase
                .from('roast_ranking_seasons')
                .update({ name: newSeasonName })
                .eq('id', newSeason.id);

              Alert.alert('Success', 'New season created!');
              setNewSeasonName('');
              setNewSeasonDuration('14');
              loadSeasonData();
            } else {
              Alert.alert('Error', 'Failed to create season');
            }
          },
        },
      ]
    );
  };

  const handleEndSeason = async () => {
    if (!currentSeason) return;

    Alert.alert(
      'End Season',
      'This will freeze rankings and grant rewards. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Season',
          style: 'destructive',
          onPress: async () => {
            await roastRankingService.endSeasonAndGrantRewards(currentSeason.id);
            Alert.alert('Success', 'Season ended and rewards granted!');
            loadSeasonData();
          },
        },
      ]
    );
  };

  const handleRecalculateRankings = async () => {
    if (!currentSeason) return;

    Alert.alert(
      'Recalculate Rankings',
      'This will recalculate all rankings for the current season. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalculate',
          onPress: async () => {
            await seasonModerationService.recalculateRankingsAfterModeration(currentSeason.id);
            Alert.alert('Success', 'Rankings recalculated!');
            loadSeasonData();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Current Season */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Season</Text>
        {currentSeason ? (
          <View style={styles.seasonCard}>
            <View style={styles.seasonCardHeader}>
              <View>
                <Text style={styles.seasonName}>{currentSeason.name || `Season ${currentSeason.season_number}`}</Text>
                <Text style={styles.seasonDates}>
                  {new Date(currentSeason.start_date).toLocaleDateString()} - {new Date(currentSeason.end_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: currentSeason.status === 'ACTIVE' ? '#4CAF50' : '#FF6B6B' }]}>
                <Text style={styles.statusText}>{currentSeason.status}</Text>
              </View>
            </View>

            {seasonStats && (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Creators</Text>
                  <Text style={styles.statValue}>{seasonStats.total_creators}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Avg Score</Text>
                  <Text style={styles.statValue}>{Math.round(seasonStats.avg_score)}</Text>
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRecalculateRankings}
              >
                <Text style={styles.actionButtonText}>🔄 Recalculate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleEndSeason}
              >
                <Text style={styles.actionButtonText}>🏁 End Season</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.noSeasonText}>No active season</Text>
        )}
      </View>

      {/* Create New Season */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create New Season</Text>
        <View style={styles.createSeasonForm}>
          <TextInput
            style={styles.input}
            placeholder="Season Name (e.g., Winter Roast 2024)"
            placeholderTextColor="#666666"
            value={newSeasonName}
            onChangeText={setNewSeasonName}
          />
          <TextInput
            style={styles.input}
            placeholder="Duration (days)"
            placeholderTextColor="#666666"
            value={newSeasonDuration}
            onChangeText={setNewSeasonDuration}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSeason}
          >
            <Text style={styles.createButtonText}>Create Season</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* All Seasons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Seasons</Text>
        {allSeasons.map((season) => (
          <View key={season.id} style={styles.seasonListItem}>
            <View>
              <Text style={styles.seasonListName}>
                {season.name || `Season ${season.season_number}`}
              </Text>
              <Text style={styles.seasonListDates}>
                {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: season.status === 'ACTIVE' ? '#4CAF50' : '#666666' }]}>
              <Text style={styles.statusText}>{season.status}</Text>
            </View>
          </View>
        ))}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  seasonCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  seasonName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seasonDates: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF1493',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noSeasonText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
  createSeasonForm: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seasonListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  seasonListName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seasonListDates: {
    color: '#CCCCCC',
    fontSize: 12,
  },
});
