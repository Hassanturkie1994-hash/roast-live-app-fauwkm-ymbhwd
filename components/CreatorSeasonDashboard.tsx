
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useSeasonRanking } from '@/hooks/useSeasonRanking';

interface CreatorSeasonDashboardProps {
  creatorId: string;
}

export default function CreatorSeasonDashboard({ creatorId }: CreatorSeasonDashboardProps) {
  const { currentSeason, ranking, isLoading } = useSeasonRanking(creatorId);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadDashboardData = useCallback(async () => {
    console.log('Loading dashboard data for creator:', creatorId);
    setDashboardData({
      rank: ranking?.rank || 0,
      score: ranking?.composite_score || 0,
      battlesWon: ranking?.battles_won || 0,
      totalGifts: ranking?.total_gifts_received_sek || 0,
    });
  }, [creatorId, ranking]);

  const subscribeToUpdates = useCallback(() => {
    console.log('Subscribing to season updates for creator:', creatorId);
    return () => {
      console.log('Unsubscribing from season updates');
    };
  }, [creatorId]);

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, [loadDashboardData, subscribeToUpdates]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="trophy.fill"
          android_material_icon_name="emoji_events"
          size={32}
          color="#FFD700"
        />
        <Text style={styles.headerTitle}>Season {currentSeason?.season_number || 1}</Text>
      </View>

      {dashboardData && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>#{dashboardData.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.battlesWon}</Text>
            <Text style={styles.statLabel}>Battles Won</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.totalGifts} kr</Text>
            <Text style={styles.statLabel}>Total Gifts</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
