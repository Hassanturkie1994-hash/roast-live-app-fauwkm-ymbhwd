
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const displayName = member.profiles?.display_name?.toLowerCase() || '';
    const username = member.profiles?.username?.toLowerCase() || '';
    
    return displayName.includes(query) || username.includes(query);
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View 
                style={[
                  styles.clubBadge, 
                  { backgroundColor: club.badge_color }
                ]}
              >
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="workspace_premium"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.clubBadgeText}>{club.badge_name}</Text>
              </View>
              <View>
                <Text style={styles.title}>{club.club_name}</Text>
                <Text style={styles.subtitle}>{members.length} Members</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Members List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="person.slash.fill"
                  android_material_icon_name="person_off"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No members found' : 'No members yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {filteredMembers.map((member, index) => (
                  <React.Fragment key={member.id}>
                    <View style={styles.memberCard}>
                      {/* Avatar */}
                      <View 
                        style={[
                          styles.memberAvatar, 
                          { backgroundColor: getVIPLevelColor(member.vip_level) }
                        ]}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member.profiles?.display_name?.charAt(0).toUpperCase() || 'V'}
                        </Text>
                      </View>

                      {/* Member Info */}
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {member.profiles?.display_name || 'VIP Member'}
                        </Text>
                        {member.profiles?.username && (
                          <Text style={styles.memberUsername}>
                            @{member.profiles.username}
                          </Text>
                        )}
                        
                        {/* VIP Level and Badge */}
                        <View style={styles.memberBadgeContainer}>
                          <View 
                            style={[
                              styles.memberLevelBadge, 
                              { backgroundColor: getVIPLevelColor(member.vip_level) }
                            ]}
                          >
                            <IconSymbol
                              ios_icon_name="star.fill"
                              android_material_icon_name="workspace_premium"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.memberLevelText}>
                              Level {member.vip_level}
                            </Text>
                          </View>
                          <Text style={styles.memberLevelLabel}>
                            {getVIPLevelLabel(member.vip_level)}
                          </Text>
                        </View>
                      </View>

                      {/* VIP Badge (Club Badge) */}
                      <View 
                        style={[
                          styles.vipBadge, 
                          { backgroundColor: club.badge_color }
                        ]}
                      >
                        <Text style={styles.vipBadgeText}>
                          {club.badge_name}
                        </Text>
                        <Text style={styles.vipBadgeLevel}>
                          {member.vip_level}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={16}
                color={colors.brandPrimary}
              />
              <Text style={styles.footerText}>
                Members are sorted by VIP level. Levels range from 1-20 based on support.
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
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
    flex: 1,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  clubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
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
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  memberUsername: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  memberBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  memberLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberLevelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  vipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  vipBadgeLevel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
