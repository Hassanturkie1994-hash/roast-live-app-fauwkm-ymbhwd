
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTop50Clubs();
  }, []);

  const loadTop50Clubs = async () => {
    setIsLoading(true);
    try {
      const data = await unifiedVIPClubService.getTop50VIPClubs();
      setClubs(data);
    } catch (error) {
      console.error('Error loading top 50 VIP clubs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top 50 VIP Clubs</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={styles.loadingText}>Loading top VIP clubs...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {clubs.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace_premium"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No VIP Clubs yet</Text>
            </View>
          ) : (
            clubs.map((club, index) => (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.clubInfo}>
                  <View style={[styles.badge, { backgroundColor: club.badge_color }]}>
                    <Text style={styles.badgeText}>{club.badge_name}</Text>
                  </View>
                  <Text style={styles.clubName}>{club.club_name}</Text>
                  <Text style={styles.creatorName}>by @{club.creator_username}</Text>
                  <View style={styles.memberCount}>
                    <IconSymbol
                      ios_icon_name="person.2.fill"
                      android_material_icon_name="people"
                      size={16}
                      color={colors.brandPrimary}
                    />
                    <Text style={styles.memberCountText}>{club.total_members} members</Text>
                  </View>
                </View>
                {index < 3 && (
                  <IconSymbol
                    ios_icon_name="trophy.fill"
                    android_material_icon_name="emoji_events"
                    size={32}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                )}
              </View>
            ))
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
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
