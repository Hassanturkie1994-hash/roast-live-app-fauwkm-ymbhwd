
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { unifiedVIPClubService, VIPClub } from '@/app/services/unifiedVIPClubService';

export default function VIPClubsTop50Screen() {
  const [topClubs, setTopClubs] = useState<Array<VIPClub & { creator_name: string; creator_username: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTopClubs = useCallback(async () => {
    try {
      const clubs = await unifiedVIPClubService.getTop50VIPClubs();
      setTopClubs(clubs);
    } catch (error) {
      console.error('Error loading top 50 VIP clubs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTopClubs();
  }, [loadTopClubs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTopClubs();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.brandPrimary;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return {
        ios: 'trophy.fill' as const,
        android: 'emoji_events' as const,
      };
    }
    return {
      ios: 'crown.fill' as const,
      android: 'workspace_premium' as const,
    };
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIP Clubs – Top 50</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <IconSymbol
          ios_icon_name="chart.bar.fill"
          android_material_icon_name="leaderboard"
          size={20}
          color={colors.brandPrimary}
        />
        <Text style={styles.subtitle}>
          Top VIP Clubs ranked by total members
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={styles.loadingText}>Loading top VIP clubs...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
        >
          {topClubs.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="crown.slash"
                android_material_icon_name="workspace_premium"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No VIP Clubs Yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to create a VIP Club and appear on this leaderboard!
              </Text>
            </View>
          ) : (
            topClubs.map((club, index) => {
              const rank = index + 1;
              const rankColor = getRankColor(rank);
              const rankIcon = getRankIcon(rank);

              return (
                <TouchableOpacity
                  key={`club-${club.id}-${index}`}
                  style={[
                    styles.clubCard,
                    rank <= 3 && styles.clubCardTop3,
                  ]}
                  onPress={() => router.push(`/screens/PublicProfileScreen?userId=${club.creator_id}` as any)}
                  activeOpacity={0.7}
                >
                  {/* Rank Badge */}
                  <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                    {rank <= 3 ? (
                      <IconSymbol
                        ios_icon_name={rankIcon.ios}
                        android_material_icon_name={rankIcon.android}
                        size={20}
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text style={styles.rankNumber}>#{rank}</Text>
                    )}
                  </View>

                  {/* Club Info */}
                  <View style={styles.clubInfo}>
                    <View style={styles.clubHeader}>
                      <Text style={styles.clubName}>{club.club_name}</Text>
                      <View
                        style={[
                          styles.badgePreview,
                          { backgroundColor: club.badge_color },
                        ]}
                      >
                        <Text style={styles.badgePreviewText}>
                          {club.badge_name.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.creatorName}>
                      by {club.creator_name}
                    </Text>
                    <View style={styles.clubStats}>
                      <View style={styles.clubStat}>
                        <IconSymbol
                          ios_icon_name="person.2.fill"
                          android_material_icon_name="people"
                          size={14}
                          color={colors.brandPrimary}
                        />
                        <Text style={styles.clubStatText}>
                          {club.total_members} {club.total_members === 1 ? 'member' : 'members'}
                        </Text>
                      </View>
                      <View style={styles.clubStat}>
                        <IconSymbol
                          ios_icon_name="creditcard.fill"
                          android_material_icon_name="payment"
                          size={14}
                          color={colors.brandPrimary}
                        />
                        <Text style={styles.clubStatText}>
                          {club.monthly_price_sek} SEK/month
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Arrow */}
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubCardTop3: {
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubInfo: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badgePreview: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePreviewText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  clubStats: {
    flexDirection: 'row',
    gap: 16,
  },
  clubStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});
