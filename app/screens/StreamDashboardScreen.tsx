
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService, VIPClub } from '@/app/services/unifiedVIPClubService';
import { streamSettingsService } from '@/app/services/streamSettingsService';
import GradientButton from '@/components/GradientButton';

export default function StreamDashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vipClub, setVipClub] = useState<VIPClub | null>(null);
  const [canCreateVIP, setCanCreateVIP] = useState(false);
  const [hoursStreamed, setHoursStreamed] = useState(0);
  const [streamDelay, setStreamDelay] = useState(0);
  const [enableSafetyHints, setEnableSafetyHints] = useState(true);
  const [autoModerateSpam, setAutoModerateSpam] = useState(false);

  const fetchVIPClubData = useCallback(async () => {
    if (!user) return;

    try {
      const [club, eligibility] = await Promise.all([
        unifiedVIPClubService.getVIPClubByCreator(user.id),
        unifiedVIPClubService.canCreateVIPClub(user.id),
      ]);

      setVipClub(club);
      setCanCreateVIP(eligibility.canCreate);
      setHoursStreamed(eligibility.hoursStreamed);
    } catch (error) {
      console.error('Error fetching VIP club data:', error);
    }
  }, [user]);

  const loadStreamSettings = useCallback(async () => {
    if (!user) return;

    try {
      const settings = await streamSettingsService.getStreamSettings(user.id);
      if (settings) {
        setStreamDelay(settings.stream_delay_seconds);
        setEnableSafetyHints(settings.enable_safety_hints);
        setAutoModerateSpam(settings.auto_moderate_spam);
      }
    } catch (error) {
      console.error('Error loading stream settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchVIPClubData(), loadStreamSettings()]);
    };
    loadData();
  }, [fetchVIPClubData, loadStreamSettings]);

  const handleCreateVIPClub = () => {
    if (!canCreateVIP) {
      Alert.alert(
        'VIP Club Locked',
        `You need ${(10 - hoursStreamed).toFixed(1)} more hours of streaming to unlock VIP Club creation.`,
        [{ text: 'OK' }]
      );
      return;
    }

    router.push('/screens/CreatorClubSetupScreen' as any);
  };

  const handleManageVIPClub = () => {
    if (!vipClub) return;
    router.push('/screens/CreatorClubSetupScreen' as any);
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    if (!user) return;

    try {
      await streamSettingsService.updateStreamSettings(user.id, { [key]: value });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Stream Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* VIP Club Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="crown.fill"
              android_material_icon_name="workspace_premium"
              size={24}
              color="#FFD700"
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>VIP Club</Text>
          </View>

          {vipClub ? (
            <View style={[styles.vipClubCard, { backgroundColor: `${vipClub.badge_color}15`, borderColor: vipClub.badge_color }]}>
              <View style={[styles.vipClubIcon, { backgroundColor: vipClub.badge_color }]}>
                <IconSymbol
                  ios_icon_name="crown.fill"
                  android_material_icon_name="workspace_premium"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.vipClubInfo}>
                <Text style={[styles.vipClubName, { color: colors.text }]}>{vipClub.club_name}</Text>
                <Text style={[styles.vipClubBadge, { color: colors.textSecondary }]}>
                  Badge: {vipClub.badge_name}
                </Text>
                <Text style={[styles.vipClubMembers, { color: colors.textSecondary }]}>
                  {vipClub.total_members} members • {vipClub.monthly_price_sek} SEK/month
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.manageButton, { backgroundColor: colors.brandPrimary }]}
                onPress={handleManageVIPClub}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.createVIPSection}>
              <Text style={[styles.createVIPText, { color: colors.text }]}>
                {canCreateVIP
                  ? 'You can now create a VIP Club!'
                  : `Stream ${(10 - hoursStreamed).toFixed(1)} more hours to unlock VIP Club`}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.brandPrimary, width: `${Math.min(100, (hoursStreamed / 10) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {hoursStreamed.toFixed(1)} / 10 hours
              </Text>
              {canCreateVIP && (
                <GradientButton
                  title="Create VIP Club"
                  onPress={handleCreateVIPClub}
                  size="medium"
                />
              )}
            </View>
          )}
        </View>

        {/* Stream Settings Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stream Settings</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Safety Hints</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Show safety tips during stream
              </Text>
            </View>
            <Switch
              value={enableSafetyHints}
              onValueChange={(value) => {
                setEnableSafetyHints(value);
                handleUpdateSetting('enable_safety_hints', value);
              }}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-Moderate Spam</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Automatically timeout spam messages
              </Text>
            </View>
            <Switch
              value={autoModerateSpam}
              onValueChange={(value) => {
                setAutoModerateSpam(value);
                handleUpdateSetting('auto_moderate_spam', value);
              }}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Moderators Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Moderators</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/ModeratorDashboardScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Moderators</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  vipClubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  vipClubIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipClubInfo: {
    flex: 1,
    gap: 4,
  },
  vipClubName: {
    fontSize: 18,
    fontWeight: '800',
  },
  vipClubBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  vipClubMembers: {
    fontSize: 12,
    fontWeight: '400',
  },
  manageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createVIPSection: {
    gap: 12,
  },
  createVIPText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '400',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
});
