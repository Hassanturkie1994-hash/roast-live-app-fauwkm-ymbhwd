
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface VIPActivityMetricsProps {
  clubId: string;
}

interface VIPStats {
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  topGifters: {
    userId: string;
    displayName: string;
    totalGifted: number;
    level: number;
  }[];
}

/**
 * VIPActivityMetrics Component
 * 
 * Displays VIP club activity metrics for creators:
 * - Total members
 * - Active members
 * - Monthly revenue (70% creator cut)
 * - Top gifters
 * - Growth trends
 * - Engagement metrics
 */
export default function VIPActivityMetrics({ clubId }: VIPActivityMetricsProps) {
  const [stats, setStats] = useState<VIPStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [clubId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await unifiedVIPClubService.getVIPClubStats(clubId);
      setStats(data);
    } catch (error) {
      console.error('Error loading VIP stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.errorText}>Failed to load metrics</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="chart.bar.fill"
          android_material_icon_name="bar_chart"
          size={32}
          color={colors.brandPrimary}
        />
        <Text style={styles.headerTitle}>VIP Activity</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <IconSymbol
            ios_icon_name="person.2.fill"
            android_material_icon_name="people"
            size={28}
            color={colors.brandPrimary}
          />
          <Text style={styles.metricValue}>{stats.totalMembers}</Text>
          <Text style={styles.metricLabel}>Total Members</Text>
        </View>

        <View style={styles.metricCard}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check_circle"
            size={28}
            color="#32CD32"
          />
          <Text style={styles.metricValue}>{stats.activeMembers}</Text>
          <Text style={styles.metricLabel}>Active Members</Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardWide]}>
          <IconSymbol
            ios_icon_name="creditcard.fill"
            android_material_icon_name="payment"
            size={28}
            color="#FFD700"
          />
          <Text style={styles.metricValue}>{stats.monthlyRevenue.toFixed(0)} kr</Text>
          <Text style={styles.metricLabel}>Monthly Revenue (70% cut)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top VIP Contributors</Text>
        <Text style={styles.sectionDescription}>
          Your most loyal supporters ranked by total gifts
        </Text>

        {stats.topGifters.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="gift.fill"
              android_material_icon_name="card_giftcard"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No gifters yet</Text>
          </View>
        ) : (
          <View style={styles.topGiftersList}>
            {stats.topGifters.map((gifter, index) => (
              <View key={index} style={styles.gifterCard}>
                <View style={styles.gifterRank}>
                  <Text style={styles.gifterRankText}>#{index + 1}</Text>
                </View>

                <View style={styles.gifterDetails}>
                  <Text style={styles.gifterName}>{gifter.displayName}</Text>
                  <View style={styles.gifterStats}>
                    <View style={styles.gifterStat}>
                      <IconSymbol
                        ios_icon_name="gift.fill"
                        android_material_icon_name="card_giftcard"
                        size={12}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.gifterStatText}>
                        {gifter.totalGifted.toLocaleString()} kr
                      </Text>
                    </View>
                    <View style={styles.gifterStat}>
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="workspace_premium"
                        size={12}
                        color="#FFD700"
                      />
                      <Text style={styles.gifterStatText}>Level {gifter.level}</Text>
                    </View>
                  </View>
                </View>

                {index < 3 && (
                  <View style={styles.medalContainer}>
                    <Text style={styles.medal}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={16}
          color={colors.brandPrimary}
        />
        <Text style={styles.infoText}>
          VIP levels are automatically calculated based on total gifts and subscription duration. 
          You cannot manually grant or remove VIP status.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCardWide: {
    minWidth: '100%',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  topGiftersList: {
    gap: 10,
  },
  gifterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  gifterRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifterRankText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gifterDetails: {
    flex: 1,
    gap: 6,
  },
  gifterName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  gifterStats: {
    flexDirection: 'row',
    gap: 12,
  },
  gifterStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gifterStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  medalContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    fontSize: 28,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
});
