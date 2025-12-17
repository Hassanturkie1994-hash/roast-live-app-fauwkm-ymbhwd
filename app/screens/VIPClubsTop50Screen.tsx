
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface VIPClubRanking {
  id: string;
  club_name: string;
  badge_name: string;
  badge_color: string;
  total_members: number;
  creator_name: string;
  creator_username: string;
}

export default function VIPClubsTop50Screen() {
  const [clubs, setClubs] = useState<VIPClubRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTop50Clubs = useCallback(async () => {
    try {
      const data = await unifiedVIPClubService.getTop50VIPClubs();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching top 50 VIP clubs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTop50Clubs();
  }, [fetchTop50Clubs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTop50Clubs();
  };

  const renderClub = ({ item, index }: { item: VIPClubRanking; index: number }) => (
    <TouchableOpacity
      style={[styles.clubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankNumber}>#{index + 1}</Text>
      </View>

      <View style={[styles.clubIcon, { backgroundColor: item.badge_color }]}>
        <IconSymbol
          ios_icon_name="crown.fill"
          android_material_icon_name="workspace_premium"
          size={24}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.clubInfo}>
        <Text style={[styles.clubName, { color: colors.text }]} numberOfLines={1}>
          {item.club_name}
        </Text>
        <Text style={[styles.creatorName, { color: colors.textSecondary }]} numberOfLines={1}>
          by @{item.creator_username}
        </Text>
        <View style={styles.clubStats}>
          <IconSymbol
            ios_icon_name="person.2.fill"
            android_material_icon_name="people"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {item.total_members} members
          </Text>
        </View>
      </View>

      {index < 3 && (
        <IconSymbol
          ios_icon_name="trophy.fill"
          android_material_icon_name="emoji_events"
          size={24}
          color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Top 50 VIP Clubs</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={clubs}
        renderItem={renderClub}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="crown"
              android_material_icon_name="workspace_premium"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No VIP Clubs yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingVertical: 8,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
    gap: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '400',
  },
  clubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
