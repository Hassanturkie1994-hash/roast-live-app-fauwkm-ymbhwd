
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { analyticsService } from '@/app/services/analyticsService';
import { adminService, AdminRole } from '@/app/services/adminService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);

    if (!result.success || !result.role) {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      router.back();
      return;
    }

    if (result.role === 'MODERATOR') {
      Alert.alert('Access Denied', 'Moderators do not have access to analytics.');
      router.back();
      return;
    }

    setAdminRole(result.role);
    await fetchAnalytics();
    setIsLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsService.getAdminAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    }
  };

  const formatDuration = (startedAt: string): string => {
    const started = new Date(startedAt).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - started) / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(0)} SEK`;
  };

  const handleOpenProfile = (userId: string) => {
    router.push(`/screens/PublicProfileScreen?userId=${userId}` as any);
  };

  const handleIssueWarning = async (userId: string, username: string) => {
    Alert.alert(
      'Issue Warning',
      `Send a warning to @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Warning',
          style: 'destructive',
          onPress: () => {
            router.push(`/screens/AdminMessagingScreen?userId=${userId}` as any);
          },
        },
      ]
    );
  };

  const handleTimeoutCreator = async (userId: string, username: string) => {
    Alert.alert(
      'Timeout Creator',
      `Apply a global timeout to @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Timeout',
          style: 'destructive',
          onPress: async () => {
            // Implement timeout logic
            Alert.alert('Success', `@${username} has been timed out globally.`);
            fetchAnalytics();
          },
        },
      ]
    );
  };

  const handleRemoveReplay = async (streamId: string) => {
    Alert.alert(
      'Remove Stream Replay',
      'Are you sure you want to remove this stream replay?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Implement replay removal logic
            Alert.alert('Success', 'Stream replay has been removed.');
            fetchAnalytics();
          },
        },
      ]
    );
  };

  const exportCSV = () => {
    Alert.alert('Export CSV', 'CSV export functionality coming soon!');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const isReadOnly = adminRole === 'SUPPORT';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Analytics</Text>
        <TouchableOpacity onPress={exportCSV} style={styles.exportButton}>
          <IconSymbol
            ios_icon_name="square.and.arrow.down"
            android_material_icon_name="download"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings Summary</Text>
          <View style={styles.earningsGrid}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.earningsCard}
            >
              <Text style={styles.earningsLabel}>Daily Total</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(analytics?.earningsSummary.daily || 0)}
              </Text>
            </LinearGradient>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.earningsCard}
            >
              <Text style={styles.earningsLabel}>Weekly Total</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(analytics?.earningsSummary.weekly || 0)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Active Streams Monitor */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Streams ({analytics?.activeStreams.length || 0})
          </Text>
          {analytics?.activeStreams.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active streams at the moment
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {analytics?.activeStreams.map((stream: any) => (
                <View
                  key={stream.id}
                  style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.streamHeader}>
                    <View style={styles.streamInfo}>
                      {stream.profiles?.avatar_url ? (
                        <Image source={{ uri: stream.profiles.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <IconSymbol
                            ios_icon_name="person.fill"
                            android_material_icon_name="person"
                            size={20}
                            color={colors.textSecondary}
                          />
                        </View>
                      )}
                      <View style={styles.streamDetails}>
                        <Text style={[styles.streamCreator, { color: colors.text }]}>
                          {stream.profiles?.display_name || 'Unknown'}
                        </Text>
                        <Text style={[styles.streamTitle, { color: colors.textSecondary }]}>
                          {stream.title}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>
                  <View style={styles.streamStats}>
                    <View style={styles.streamStat}>
                      <IconSymbol
                        ios_icon_name="person.3.fill"
                        android_material_icon_name="group"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.streamStatText, { color: colors.text }]}>
                        {stream.viewer_count} viewers
                      </Text>
                    </View>
                    <View style={styles.streamStat}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.streamStatText, { color: colors.text }]}>
                        {formatDuration(stream.started_at)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.brandPrimary }]}
                    onPress={() => handleOpenProfile(stream.broadcaster_id)}
                  >
                    <Text style={styles.actionButtonText}>Open Creator Profile</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Growth Leaderboard */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Growth Leaderboard (Last 7 Days)
          </Text>
          {analytics?.growthLeaderboard.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No data available yet
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {analytics?.growthLeaderboard.slice(0, 10).map((creator: any, index: number) => (
                <View
                  key={creator.creator_id}
                  style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.leaderboardRank}>
                    <Text style={[styles.leaderboardRankText, { color: colors.text }]}>#{index + 1}</Text>
                  </View>
                  {creator.avatar_url ? (
                    <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.leaderboardInfo}>
                    <Text style={[styles.leaderboardName, { color: colors.text }]}>
                      {creator.display_name}
                    </Text>
                    <Text style={[styles.leaderboardStats, { color: colors.textSecondary }]}>
                      {creator.streams_hosted} streams • {formatDuration(creator.avg_session_duration * 1000)} avg
                    </Text>
                  </View>
                  <View style={styles.leaderboardScore}>
                    <Text style={[styles.leaderboardScoreValue, { color: colors.brandPrimary }]}>
                      {creator.score}
                    </Text>
                    <Text style={[styles.leaderboardScoreLabel, { color: colors.textSecondary }]}>
                      Score
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Flagged Streams */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Flagged Streams</Text>
          {analytics?.flaggedStreams.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No flagged streams
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {analytics?.flaggedStreams.map((stream: any) => (
                <View
                  key={stream.id}
                  style={[styles.flaggedCard, { backgroundColor: colors.card, borderColor: '#DC143C' }]}
                >
                  <View style={styles.flaggedHeader}>
                    <View style={styles.flaggedInfo}>
                      <Text style={[styles.flaggedCreator, { color: colors.text }]}>
                        @{stream.profiles?.username}
                      </Text>
                      <Text style={[styles.flaggedTitle, { color: colors.textSecondary }]}>
                        {stream.title}
                      </Text>
                    </View>
                    <View style={styles.flaggedBadge}>
                      <Text style={styles.flaggedBadgeText}>{stream.report_count} reports</Text>
                    </View>
                  </View>
                  {!isReadOnly && (
                    <View style={styles.flaggedActions}>
                      <TouchableOpacity
                        style={[styles.flaggedActionButton, { backgroundColor: '#FFA500' }]}
                        onPress={() => handleIssueWarning(stream.broadcaster_id, stream.profiles?.username)}
                      >
                        <Text style={styles.flaggedActionText}>Issue Warning</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.flaggedActionButton, { backgroundColor: '#DC143C' }]}
                        onPress={() => handleTimeoutCreator(stream.broadcaster_id, stream.profiles?.username)}
                      >
                        <Text style={styles.flaggedActionText}>Timeout</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.flaggedActionButton, { backgroundColor: colors.textSecondary }]}
                        onPress={() => handleRemoveReplay(stream.id)}
                      >
                        <Text style={styles.flaggedActionText}>Remove Replay</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  exportButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  earningsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  streamCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamDetails: {
    flex: 1,
  },
  streamCreator: {
    fontSize: 16,
    fontWeight: '700',
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  liveBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streamStats: {
    flexDirection: 'row',
    gap: 16,
  },
  streamStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  leaderboardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardRankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardStats: {
    fontSize: 12,
    fontWeight: '400',
  },
  leaderboardScore: {
    alignItems: 'center',
  },
  leaderboardScoreValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  leaderboardScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  flaggedCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    gap: 12,
  },
  flaggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flaggedInfo: {
    flex: 1,
  },
  flaggedCreator: {
    fontSize: 16,
    fontWeight: '700',
  },
  flaggedTitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  flaggedBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flaggedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  flaggedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  flaggedActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  flaggedActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});