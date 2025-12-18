
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { VIPClub, VIPClubMember } from '@/app/services/unifiedVIPClubService';

interface VIPClubMembersModalProps {
  visible: boolean;
  onClose: () => void;
  club: VIPClub;
  members: VIPClubMember[];
}

export default function VIPClubMembersModal({
  visible,
  onClose,
  club,
  members,
}: VIPClubMembersModalProps) {
  const getVIPLevelColor = (level: number): string => {
    if (level >= 15) return '#FF1493'; // Hot Pink for top tier
    if (level >= 10) return '#9B59B6'; // Purple
    if (level >= 5) return '#3498DB'; // Blue
    return '#FFD700'; // Gold for entry level
  };

  const getVIPLevelLabel = (level: number): string => {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
  };

  const renderMemberItem = ({ item }: { item: VIPClubMember }) => {
    const levelColor = getVIPLevelColor(item.vip_level);
    const levelLabel = getVIPLevelLabel(item.vip_level);

    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: levelColor }]}>
          <Text style={styles.memberAvatarText}>
            {item.profiles?.display_name?.charAt(0).toUpperCase() || 'V'}
          </Text>
        </View>

        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>
            {item.profiles?.display_name || 'VIP Member'}
          </Text>
          <View style={styles.memberMeta}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="workspace_premium"
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.levelBadgeText}>
                Lvl {item.vip_level} • {levelLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.vipBadge, { backgroundColor: club.badge_color || colors.brandPrimary }]}>
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="workspace_premium"
            size={16}
            color="#FFFFFF"
          />
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={24}
                color={colors.text}
              />
              <Text style={styles.title}>VIP Club Members</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Club Info */}
          <View style={styles.clubInfo}>
            <View style={[styles.clubBadge, { backgroundColor: club.badge_color || colors.brandPrimary }]}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="workspace_premium"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.clubBadgeText}>{club.badge_name}</Text>
            </View>
            <Text style={styles.clubName}>{club.club_name}</Text>
            <Text style={styles.memberCount}>{members.length} members</Text>
          </View>

          {/* Members List */}
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.membersList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="person.slash.fill"
                  android_material_icon_name="person_off"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No members yet</Text>
              </View>
            }
          />

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>VIP Levels:</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
                  <Text style={styles.legendText}>1-4: VIP</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                  <Text style={styles.legendText}>5-9: Premium</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9B59B6' }]} />
                  <Text style={styles.legendText}>10-14: Elite</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF1493' }]} />
                  <Text style={styles.legendText}>15-20: Legendary</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  clubInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  clubBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  membersList: {
    padding: 20,
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vipBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendContainer: {
    gap: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
