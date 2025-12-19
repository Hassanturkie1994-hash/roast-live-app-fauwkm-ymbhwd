
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
import { supabase } from '@/app/integrations/supabase/client';
import GradientButton from '@/components/GradientButton';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import ManageModeratorsModal from '@/components/ManageModeratorsModal';

interface CreatorStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGiftsReceived: number;
  totalBattles: number;
  totalStreamDuration: number;
  currentSeasonRank: number;
  currentSeasonScore: number;
}

interface RankHistory {
  season_number: number;
  rank: number;
  score: number;
  tier: string;
}

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
  const [chatPaused, setChatPaused] = useState(false);
  const [showModeratorsModal, setShowModeratorsModal] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    totalGiftsReceived: 0,
    totalBattles: 0,
    totalStreamDuration: 0,
    currentSeasonRank: 0,
    currentSeasonScore: 0,
  });
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);

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
    }
  }, [user]);

  const loadCreatorStats = useCallback(async () => {
    if (!user) return;

    try {
      // Load creator level and XP
      const { data: levelData } = await supabase
        .from('creator_levels')
        .select('*')
        .eq('creator_id', user.id)
        .maybeSingle();

      // Load total gifts received
      const { data: giftsData } = await supabase
        .from('roast_gift_transactions')
        .select('price_sek')
        .eq('creator_id', user.id)
        .eq('status', 'CONFIRMED');

      const totalGifts = giftsData?.reduce((sum, gift) => sum + gift.price_sek, 0) || 0;

      // Load battle count
      const { count: battleCount } = await supabase
        .from('battle_rewards')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', user.id);

      // Load stream duration
      const { data: streamData } = await supabase
        .from('live_streams')
        .select('started_at, ended_at')
        .eq('creator_id', user.id)
        .not('ended_at', 'is', null);

      const totalDuration = streamData?.reduce((sum, stream) => {
        const start = new Date(stream.started_at).getTime();
        const end = new Date(stream.ended_at).getTime();
        return sum + (end - start);
      }, 0) || 0;

      const totalHours = Math.floor(totalDuration / (1000 * 60 * 60));

      // Load current season rank
      const { data: seasonData } = await supabase
        .from('creator_season_scores')
        .select('season_score, rank_tier, roast_ranking_seasons(season_number)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Load rank history (last 5 seasons)
      const { data: historyData } = await supabase
        .from('creator_season_scores')
        .select('season_score, rank_tier, roast_ranking_seasons(season_number)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const history: RankHistory[] = historyData?.map((item: any) => ({
        season_number: item.roast_ranking_seasons?.season_number || 0,
        rank: 0, // We'll calculate this from rank_tier
        score: item.season_score || 0,
        tier: item.rank_tier || 'Bronze Mouth',
      })) || [];

      setRankHistory(history);

      setCreatorStats({
        level: levelData?.current_level || 1,
        xp: levelData?.current_xp || 0,
        xpToNextLevel: levelData?.xp_to_next_level || 1000,
        totalGiftsReceived: totalGifts,
        totalBattles: battleCount || 0,
        totalStreamDuration: totalHours,
        currentSeasonRank: 0,
        currentSeasonScore: seasonData?.season_score || 0,
      });
    } catch (error) {
      console.error('Error loading creator stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchVIPClubData(), loadStreamSettings(), loadCreatorStats()]);
    };
    loadData();
  }, [fetchVIPClubData, loadStreamSettings, loadCreatorStats]);

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
    router.push('/screens/CreatorVIPDashboard' as any);
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

  const getRankTitle = (level: number): string => {
    if (level >= 45) return 'Legendary Menace';
    if (level >= 35) return 'Diamond Disrespect';
    if (level >= 25) return 'Golden Roast';
    if (level >= 15) return 'Silver Tongue';
    return 'Bronze Mouth';
  };

  const handleToggleChatPause = () => {
    setChatPaused(!chatPaused);
    // This would be sent to the live stream when active
    console.log('Chat paused:', !chatPaused);
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
        {/* Creator Level Progress */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <UnifiedRoastIcon name="roast-badge" size={24} color={colors.brandPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Creator Level</Text>
          </View>

          <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.levelHeader}>
              <View style={[styles.levelBadge, { backgroundColor: colors.brandPrimary }]}>
                <Text style={styles.levelBadgeText}>LVL {creatorStats.level}</Text>
              </View>
              <Text style={[styles.rankTitle, { color: colors.text }]}>{getRankTitle(creatorStats.level)}</Text>
            </View>

            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpFill,
                  {
                    backgroundColor: colors.brandPrimary,
                    width: `${Math.min(100, (creatorStats.xp / creatorStats.xpToNextLevel) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.xpText, { color: colors.textSecondary }]}>
              {creatorStats.xp.toLocaleString()} / {creatorStats.xpToNextLevel.toLocaleString()} XP
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <UnifiedRoastIcon name="roast-gift-box" size={20} color={colors.brandPrimary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{creatorStats.totalGiftsReceived.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kr Gifts</Text>
              </View>
              <View style={styles.statBox}>
                <UnifiedRoastIcon name="flame" size={20} color={colors.brandPrimary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{creatorStats.totalBattles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Battles</Text>
              </View>
              <View style={styles.statBox}>
                <UnifiedRoastIcon name="history" size={20} color={colors.brandPrimary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{creatorStats.totalStreamDuration}h</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streamed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seasons & Rankings */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <UnifiedRoastIcon name="crown" size={24} color="#FFD700" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Seasons & Rankings</Text>
          </View>

          {/* Current Season Card */}
          <TouchableOpacity
            style={[styles.rankingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/SeasonsRankingsScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.rankingContent}>
              <View style={[styles.rankBadge, { backgroundColor: colors.brandPrimary }]}>
                <Text style={styles.rankBadgeText}>#{creatorStats.currentSeasonRank || '—'}</Text>
              </View>
              <View style={styles.rankingDetails}>
                <Text style={[styles.rankingTitle, { color: colors.text }]}>Current Season Rank</Text>
                <Text style={[styles.rankingScore, { color: colors.textSecondary }]}>
                  {creatorStats.currentSeasonScore.toLocaleString()} points
                </Text>
              </View>
            </View>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Rank History */}
          {rankHistory.length > 0 && (
            <View style={styles.rankHistorySection}>
              <Text style={[styles.rankHistoryTitle, { color: colors.text }]}>Rank History</Text>
              <View style={styles.rankHistoryList}>
                {rankHistory.map((history, index) => (
                  <View key={index} style={[styles.rankHistoryItem, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                    <View style={styles.rankHistoryLeft}>
                      <Text style={[styles.rankHistorySeason, { color: colors.textSecondary }]}>
                        Season {history.season_number}
                      </Text>
                      <Text style={[styles.rankHistoryTier, { color: colors.text }]}>
                        {history.tier}
                      </Text>
                    </View>
                    <View style={styles.rankHistoryRight}>
                      <Text style={[styles.rankHistoryScore, { color: colors.brandPrimary }]}>
                        {history.score.toLocaleString()}
                      </Text>
                      <Text style={[styles.rankHistoryLabel, { color: colors.textSecondary }]}>
                        points
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* VIP Club Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <UnifiedRoastIcon name="vip-diamond-flame" size={24} color="#FFD700" />
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
                  {vipClub.total_members} members • {vipClub.monthly_price_sek} kr/month
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

        {/* Analytics & Ranking Logic */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <UnifiedRoastIcon name="chart" size={24} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/PerformanceGrowthScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View Performance & Growth</Text>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/RetentionAnalyticsScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Retention Analytics</Text>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/BattleHistoryScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Battle History</Text>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stream Controls */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stream Controls</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Pause Chat</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Temporarily pause chat during stream
              </Text>
            </View>
            <Switch
              value={chatPaused}
              onValueChange={handleToggleChatPause}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STREAM MODERATORS (CREATOR-ASSIGNED)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            CRITICAL SECURITY FIX:
            - Removed "Manage Roles" which exposed global role management
            - Replaced with "Stream Moderators" for stream-specific moderation
            
            Stream Moderators:
            - Assigned by creators to their own streams
            - Can mute, timeout, remove/pin messages in assigned streams ONLY
            - NO access to dashboards, user data, or platform settings
            - Stored as stream permissions, NOT global user roles
            
            This is DIFFERENT from:
            - MODERATOR platform role (monitors all streams)
            - Global role management (HEAD_ADMIN only)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={24}
              color={colors.text}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stream Moderators</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowModeratorsModal(true)}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="person.badge.shield.checkmark.fill"
                android_material_icon_name="admin_panel_settings"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Stream Moderators</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Stream Moderators can mute, timeout, and manage messages in YOUR streams only. 
              They are different from Platform Moderators who monitor all streams on the platform.
            </Text>
          </View>
        </View>

        {/* Earnings & Payouts */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <UnifiedRoastIcon name="lava-wallet" size={24} color={colors.brandPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings & Payouts</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/CreatorEarningsScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View Earnings Summary</Text>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/StreamRevenueScreen' as any)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Stream Revenue</Text>
            <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Stream Moderators Modal */}
      {user && (
        <ManageModeratorsModal
          visible={showModeratorsModal}
          onClose={() => setShowModeratorsModal(false)}
          creatorId={user.id}
        />
      )}
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
  levelCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  xpBar: {
    height: 12,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 6,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  rankingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  rankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rankingDetails: {
    flex: 1,
    gap: 4,
  },
  rankingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankingScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  rankHistorySection: {
    gap: 12,
  },
  rankHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  rankHistoryList: {
    gap: 10,
  },
  rankHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankHistoryLeft: {
    gap: 4,
  },
  rankHistorySeason: {
    fontSize: 12,
    fontWeight: '600',
  },
  rankHistoryTier: {
    fontSize: 15,
    fontWeight: '700',
  },
  rankHistoryRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankHistoryScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  rankHistoryLabel: {
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
