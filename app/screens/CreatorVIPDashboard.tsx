
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useVIPClub } from '@/contexts/VIPClubContext';
import VIPMemberList from '@/components/VIPMemberList';
import VIPActivityMetrics from '@/components/VIPActivityMetrics';
import VIPClubMembersModal from '@/components/VIPClubMembersModal';
import { unifiedVIPClubService, VIPClubMember } from '@/app/services/unifiedVIPClubService';

/**
 * CreatorVIPDashboard Screen
 * 
 * Creator-side VIP Club management dashboard:
 * - List of VIP members
 * - Top VIP contributors
 * - VIP activity metrics
 * - Ability to enable/disable VIP perks (cosmetic only)
 * - Send announcements to VIP members
 * 
 * Rules:
 * - Creator CANNOT manually grant VIP
 * - All upgrades are system-driven
 * - VIP removal only via system rules
 */
export default function CreatorVIPDashboard() {
  const { user } = useAuth();
  const { club, isLoading: clubLoading, refreshClub } = useVIPClub();
  const [members, setMembers] = useState<VIPClubMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'members' | 'metrics'>('members');

  // VIP Perk toggles (cosmetic only)
  const [enableCustomChatColors, setEnableCustomChatColors] = useState(true);
  const [enablePriorityChat, setEnablePriorityChat] = useState(true);
  const [enableExclusiveEmojis, setEnableExclusiveEmojis] = useState(true);
  const [enableAnimatedBadges, setEnableAnimatedBadges] = useState(true);

  useEffect(() => {
    if (club) {
      loadMembers();
    }
  }, [club]);

  const loadMembers = async () => {
    if (!club) return;

    setIsLoadingMembers(true);
    try {
      const data = await unifiedVIPClubService.getVIPClubMembers(club.id);
      setMembers(data);
    } catch (error) {
      console.error('Error loading VIP members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSendAnnouncement = () => {
    if (!club || !user) return;

    Alert.prompt(
      'Send VIP Announcement',
      'Send a message to all VIP members',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            if (!message?.trim()) return;

            try {
              const result = await unifiedVIPClubService.sendVIPClubAnnouncement(
                club.id,
                user.id,
                'VIP Announcement',
                message
              );

              if (result.success) {
                Alert.alert('Success', `Announcement sent to ${result.sentCount} members`);
              } else {
                Alert.alert('Error', result.error || 'Failed to send announcement');
              }
            } catch (error) {
              console.error('Error sending announcement:', error);
              Alert.alert('Error', 'Failed to send announcement');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleToggleClubActive = async () => {
    if (!club || !user) return;

    Alert.alert(
      club.is_active ? 'Deactivate VIP Club?' : 'Activate VIP Club?',
      club.is_active
        ? 'Members will keep their levels but won\'t get VIP perks until reactivated'
        : 'VIP members will regain access to all perks',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: club.is_active ? 'Deactivate' : 'Activate',
          style: club.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const result = await unifiedVIPClubService.updateVIPClub(user.id, {
                is_active: !club.is_active,
              });

              if (result.success) {
                Alert.alert('Success', `VIP Club ${club.is_active ? 'deactivated' : 'activated'}`);
                await refreshClub();
              } else {
                Alert.alert('Error', result.error || 'Failed to update VIP Club');
              }
            } catch (error) {
              console.error('Error toggling club:', error);
              Alert.alert('Error', 'Failed to update VIP Club');
            }
          },
        },
      ]
    );
  };

  if (clubLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading VIP Dashboard...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol
          ios_icon_name="crown.fill"
          android_material_icon_name="workspace_premium"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.errorTitle}>No VIP Club</Text>
        <Text style={styles.errorDescription}>
          Create a VIP Club to access this dashboard
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIP Dashboard</Text>
        <TouchableOpacity onPress={handleSendAnnouncement}>
          <IconSymbol
            ios_icon_name="megaphone.fill"
            android_material_icon_name="campaign"
            size={24}
            color={colors.brandPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.clubHeader, { backgroundColor: club.badge_color }]}>
        <Text style={styles.clubName}>{club.club_name}</Text>
        <Text style={styles.clubBadge}>{club.badge_name}</Text>
        <View style={styles.clubStats}>
          <Text style={styles.clubStat}>{club.total_members} members</Text>
          <Text style={styles.clubStat}>•</Text>
          <Text style={styles.clubStat}>{club.monthly_price_sek} kr/month</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'members' && styles.tabActive]}
          onPress={() => setSelectedTab('members')}
        >
          <IconSymbol
            ios_icon_name="person.2.fill"
            android_material_icon_name="people"
            size={20}
            color={selectedTab === 'members' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'members' && styles.tabTextActive,
            ]}
          >
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'metrics' && styles.tabActive]}
          onPress={() => setSelectedTab('metrics')}
        >
          <IconSymbol
            ios_icon_name="chart.bar.fill"
            android_material_icon_name="bar_chart"
            size={20}
            color={selectedTab === 'metrics' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'metrics' && styles.tabTextActive,
            ]}
          >
            Metrics
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'members' ? (
        <VIPMemberList
          clubId={club.id}
          onMemberPress={(member) => {
            console.log('Member pressed:', member);
          }}
        />
      ) : (
        <VIPActivityMetrics clubId={club.id} />
      )}

      <View style={styles.perksSection}>
        <Text style={styles.perksSectionTitle}>VIP Perks (Cosmetic Only)</Text>
        <Text style={styles.perksSectionDescription}>
          Enable or disable cosmetic perks for your VIP members
        </Text>

        <View style={styles.perksList}>
          <View style={styles.perkItem}>
            <View style={styles.perkInfo}>
              <IconSymbol
                ios_icon_name="paintbrush.fill"
                android_material_icon_name="palette"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.perkName}>Custom Chat Colors</Text>
            </View>
            <Switch
              value={enableCustomChatColors}
              onValueChange={setEnableCustomChatColors}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.perkItem}>
            <View style={styles.perkInfo}>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="arrow_upward"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.perkName}>Priority Chat Placement</Text>
            </View>
            <Switch
              value={enablePriorityChat}
              onValueChange={setEnablePriorityChat}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.perkItem}>
            <View style={styles.perkInfo}>
              <IconSymbol
                ios_icon_name="face.smiling.fill"
                android_material_icon_name="emoji_emotions"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.perkName}>Exclusive Emojis</Text>
            </View>
            <Switch
              value={enableExclusiveEmojis}
              onValueChange={setEnableExclusiveEmojis}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.perkItem}>
            <View style={styles.perkInfo}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto_awesome"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.perkName}>Animated Badges</Text>
            </View>
            <Switch
              value={enableAnimatedBadges}
              onValueChange={setEnableAnimatedBadges}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Club Settings</Text>
        <TouchableOpacity
          style={[
            styles.dangerButton,
            !club.is_active && styles.activateButton,
          ]}
          onPress={handleToggleClubActive}
        >
          <IconSymbol
            ios_icon_name={club.is_active ? 'pause.circle.fill' : 'play.circle.fill'}
            android_material_icon_name={club.is_active ? 'pause_circle' : 'play_circle'}
            size={20}
            color={club.is_active ? '#FF4444' : '#32CD32'}
          />
          <Text
            style={[
              styles.dangerButtonText,
              !club.is_active && styles.activateButtonText,
            ]}
          >
            {club.is_active ? 'Deactivate VIP Club' : 'Activate VIP Club'}
          </Text>
        </TouchableOpacity>
      </View>

      {showMembersModal && club && (
        <VIPClubMembersModal
          visible={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          club={club}
          members={members}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
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
  clubHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  clubName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  clubBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  clubStats: {
    flexDirection: 'row',
    gap: 8,
  },
  clubStat: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  tabActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.brandPrimary,
  },
  perksSection: {
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  perksSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  perksSectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  perksList: {
    gap: 12,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  perkName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dangerZone: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  activateButton: {
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderColor: '#32CD32',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4444',
  },
  activateButtonText: {
    color: '#32CD32',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  errorDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
