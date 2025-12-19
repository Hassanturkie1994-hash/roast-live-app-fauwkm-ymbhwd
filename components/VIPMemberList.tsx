
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { unifiedVIPClubService, VIPClubMember } from '@/app/services/unifiedVIPClubService';

interface VIPMemberListProps {
  clubId: string;
  onMemberPress?: (member: VIPClubMember) => void;
}

/**
 * VIPMemberList Component
 * 
 * Displays a list of VIP club members with their levels and stats.
 * Shows:
 * - Member avatar/name
 * - VIP level (1-20)
 * - Total gifted amount
 * - Loyalty streak
 * - Join date
 */
export default function VIPMemberList({ clubId, onMemberPress }: VIPMemberListProps) {
  const [members, setMembers] = useState<VIPClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await unifiedVIPClubService.getVIPClubMembers(clubId);
      setMembers(data);
    } catch (error) {
      console.error('Error loading VIP members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const getVIPLevelColor = (level: number): string => {
    if (level >= 15) return '#FF1493'; // Hot Pink - Legendary
    if (level >= 10) return '#9B59B6'; // Purple - Elite
    if (level >= 5) return '#3498DB'; // Blue - Premium
    return '#FFD700'; // Gold - VIP
  };

  const getVIPLevelLabel = (level: number): string => {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
  };

  const calculateLoyaltyStreak = (joinedAt: string): number => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderMemberItem = ({ item }: { item: VIPClubMember }) => {
    const levelColor = getVIPLevelColor(item.vip_level);
    const levelLabel = getVIPLevelLabel(item.vip_level);
    const loyaltyStreak = calculateLoyaltyStreak(item.joined_at);

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => onMemberPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.memberAvatar, { backgroundColor: levelColor }]}>
          <Text style={styles.memberAvatarText}>
            {item.profiles?.display_name?.charAt(0).toUpperCase() || 'V'}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <Text style={styles.levelBadgeText}>{item.vip_level}</Text>
          </View>
        </View>

        <View style={styles.memberDetails}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>
              {item.profiles?.display_name || 'VIP Member'}
            </Text>
            <View style={[styles.tierBadge, { backgroundColor: levelColor }]}>
              <Text style={styles.tierBadgeText}>{levelLabel}</Text>
            </View>
          </View>

          <View style={styles.memberStats}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>
                {item.total_gifted_sek.toLocaleString()} kr gifted
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="local_fire_department"
                size={14}
                color={colors.brandPrimary}
              />
              <Text style={styles.statText}>
                {loyaltyStreak} day{loyaltyStreak !== 1 ? 's' : ''} streak
              </Text>
            </View>
          </View>

          <Text style={styles.joinedDate}>
            Joined {new Date(item.joined_at).toLocaleDateString()}
          </Text>
        </View>

        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron_right"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading VIP members...</Text>
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.emptyState}>
        <IconSymbol
          ios_icon_name="person.slash.fill"
          android_material_icon_name="person_off"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>No VIP Members Yet</Text>
        <Text style={styles.emptyDescription}>
          Your VIP Club is waiting for its first member!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      renderItem={renderMemberItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
    gap: 6,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberStats: {
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  joinedDate: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
