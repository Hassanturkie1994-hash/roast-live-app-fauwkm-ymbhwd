
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  TextInput,
  Pressable,
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
import GradientButton from '@/components/GradientButton';

/**
 * CreatorVIPDashboard Screen
 * 
 * FIXED: Replaced Alert.prompt (iOS-only) with custom modal
 * IMPROVED: Better layout and spacing
 */
export default function CreatorVIPDashboard() {
  const { user } = useAuth();
  const { club, isLoading: clubLoading, refreshClub } = useVIPClub();
  const [members, setMembers] = useState<VIPClubMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'members' | 'metrics'>('members');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // VIP Perk toggles (cosmetic only)
  const [enableCustomChatColors, setEnableCustomChatColors] = useState(true);
  const [enablePriorityChat, setEnablePriorityChat] = useState(true);
  const [enableExclusiveEmojis, setEnableExclusiveEmojis] = useState(true);
  const [enableAnimatedBadges, setEnableAnimatedBadges] = useState(true);

  const loadMembers = useCallback(async () => {
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
  }, [club]);

  useEffect(() => {
    if (club) {
      loadMembers();
    }
  }, [club, loadMembers]);

  const handleSendAnnouncement = async () => {
    if (!club || !user) return;

    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    setSendingAnnouncement(true);
    try {
      const result = await unifiedVIPClubService.sendVIPClubAnnouncement(
        club.id,
        user.id,
        announcementTitle,
        announcementMessage
      );

      if (result.success) {
        Alert.alert('Success', `Announcement sent to ${result.sentCount} members`);
        setShowAnnouncementModal(false);
        setAnnouncementTitle('');
        setAnnouncementMessage('');
      } else {
        Alert.alert('Error', result.error || 'Failed to send announcement');
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      Alert.alert('Error', 'Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
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
      {/* Header */}
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
        <TouchableOpacity onPress={() => setShowAnnouncementModal(true)}>
          <IconSymbol
            ios_icon_name="megaphone.fill"
            android_material_icon_name="campaign"
            size={24}
            color={colors.brandPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Club Header Card */}
      <View style={[styles.clubHeaderCard, { backgroundColor: `${club.badge_color}15`, borderColor: club.badge_color }]}>
        <View style={[styles.clubIcon, { backgroundColor: club.badge_color }]}>
          <IconSymbol
            ios_icon_name="crown.fill"
            android_material_icon_name="workspace_premium"
            size={32}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{club.club_name}</Text>
          <Text style={styles.clubBadge}>{club.badge_name}</Text>
          <View style={styles.clubStats}>
            <Text style={styles.clubStat}>{club.total_members} members</Text>
            <Text style={styles.clubStat}>•</Text>
            <Text style={styles.clubStat}>{club.monthly_price_sek} kr/month</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
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

      {/* Content */}
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

      {/* Perks Section */}
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

      {/* Club Settings */}
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

      {/* Announcement Modal - FIXED: Custom modal instead of Alert.prompt */}
      <Modal
        visible={showAnnouncementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAnnouncementModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Send VIP Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Announcement title..."
                placeholderTextColor={colors.textSecondary}
                value={announcementTitle}
                onChangeText={setAnnouncementTitle}
              />

              <Text style={[styles.label, { color: colors.text }]}>Message</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Your message to VIP members..."
                placeholderTextColor={colors.textSecondary}
                value={announcementMessage}
                onChangeText={setAnnouncementMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowAnnouncementModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.sendButtonContainer}>
                  <GradientButton
                    title={sendingAnnouncement ? 'Sending...' : 'Send'}
                    onPress={handleSendAnnouncement}
                    disabled={sendingAnnouncement}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  clubHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    gap: 16,
  },
  clubIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
    gap: 6,
  },
  clubName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  clubBadge: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  clubStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  clubStat: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
    paddingVertical: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonContainer: {
    flex: 1,
  },
});
