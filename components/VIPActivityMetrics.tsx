
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface VIPActivityMetricsProps {
  clubId: string;
}

export default function VIPActivityMetrics({ clubId }: VIPActivityMetricsProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await unifiedVIPClubService.getVIPClubStats(clubId);
      setStats(data);
    } catch (error) {
      console.error('Error loading VIP stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <IconSymbol
          ios_icon_name="person.2.fill"
          android_material_icon_name="people"
          size={24}
          color={colors.brandPrimary}
        />
        <Text style={styles.statValue}>{stats?.totalMembers || 0}</Text>
        <Text style={styles.statLabel}>Total Members</Text>
      </View>

      <View style={styles.statCard}>
        <IconSymbol
          ios_icon_name="gift.fill"
          android_material_icon_name="card_giftcard"
          size={24}
          color={colors.brandPrimary}
        />
        <Text style={styles.statValue}>{stats?.totalGifts || 0} kr</Text>
        <Text style={styles.statLabel}>Total Gifts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
