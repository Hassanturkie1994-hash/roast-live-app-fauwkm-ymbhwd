
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { adminService } from '@/app/services/adminService';

interface LiveStream {
  id: string;
  title: string;
  broadcaster_id: string;
  viewer_count: number;
  started_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LIVE MODERATOR DASHBOARD (PLATFORM-LEVEL)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * For MODERATOR platform role ONLY.
 * 
 * This is DIFFERENT from stream moderators (assigned to specific creators).
 * 
 * Platform Moderators can:
 * - Monitor ALL live streams on the platform
 * - Stop streams that violate guidelines
 * - Watch active streams
 * - Give timeouts and warnings
 * - View stream reports
 * 
 * Cannot:
 * - Ban users platform-wide (admin/head_admin only)
 * - Assign roles (head_admin only)
 * - Access financial data (admin/head_admin only)
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function LiveModeratorDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [stats, setStats] = useState({
    liveStreams: 0,
    totalViewers: 0,
    streamReports: 0,
    activeWarnings: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      // Fetch live streams
      const { data: liveStreamsData } = await supabase
        .from('streams')
        .select('id, title, broadcaster_id, viewer_count, started_at, profiles(username, display_name, avatar_url)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

      const totalViewers = liveStreamsData?.reduce((sum, stream) => sum + (stream.viewer_count || 0), 0) || 0;

      setLiveStreams(liveStreamsData || []);

      // Fetch stream reports
      const { count: reportsCount } = await supabase
        .from('stream_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch active warnings
      const { count: warningsCount } = await supabase
        .from('moderation_actions')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'warning')
        .eq('is_active', true);

      setStats({
        liveStreams: liveStreamsData?.length || 0,
        totalViewers,
        streamReports: reportsCount || 0,
        activeWarnings: warningsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const checkAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    console.log('Moderator dashboard access check:', result);
    
    if (!result.isAdmin || result.role !== 'MODERATOR') {
      Alert.alert('Access Denied', 'You do not have moderator privileges.');
      router.back();
      return;
    }

    await fetchStats();
    setLoading(false);
  }, [user, fetchStats]);

  useEffect(() => {
    checkAccess();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkAccess, fetchStats]);

  const handleStopStream = async (stream: LiveStream) => {
    Alert.alert(
      'Stop Stream',
      `Are you sure you want to stop @${stream.profiles.username}'s stream?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('streams')
                .update({ status: 'ended', ended_at: new Date().toISOString() })
                .eq('id', stream.id);

              if (error) {
                Alert.alert('Error', 'Failed to stop stream');
                return;
              }

              Alert.alert('Success', 'Stream stopped successfully');
              await fetchStats();
            } catch (error) {
              console.error('Error stopping stream:', error);
              Alert.alert('Error', 'Failed to stop stream');
            }
          },
        },
      ]
    );
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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Moderator Dashboard</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#9B59B6' }]}>
            <Text style={styles.roleBadgeText}>PLATFORM MODERATOR</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Live Stream Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={28}
                color="#FF1493"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.liveStreams}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Live Streams</Text>
              {stats.liveStreams > 0 && <View style={styles.liveDot} />}
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalViewers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Viewers</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="flag.fill"
                android_material_icon_name="flag"
                size={28}
                color={colors.gradientEnd}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.streamReports}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stream Reports</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={28}
                color="#FFA500"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeWarnings}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Warnings</Text>
            </View>
          </View>
        </View>

        {/* Live Streams List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📹 Active Live Streams</Text>
          
          {liveStreams.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="video.slash.fill"
                android_material_icon_name="videocam_off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No live streams at the moment</Text>
            </View>
          ) : (
            liveStreams.map((stream) => (
              <View key={stream.id} style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.streamHeader}>
                  <Image
                    source={{
                      uri: stream.profiles.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                    }}
                    style={styles.streamAvatar}
                  />
                  <View style={styles.streamInfo}>
                    <Text style={[styles.streamTitle, { color: colors.text }]} numberOfLines={1}>
                      {stream.title}
                    </Text>
                    <Text style={[styles.streamCreator, { color: colors.textSecondary }]}>
                      @{stream.profiles.username}
                    </Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDotSmall} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>

                <View style={styles.streamStats}>
                  <View style={styles.streamStat}>
                    <IconSymbol
                      ios_icon_name="person.2.fill"
                      android_material_icon_name="people"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.streamStatText, { color: colors.textSecondary }]}>
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
                    <Text style={[styles.streamStatText, { color: colors.textSecondary }]}>
                      {getStreamDuration(stream.started_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.streamActions}>
                  <TouchableOpacity
                    style={[styles.streamActionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/screens/ViewerScreen', params: { streamId: stream.id } })}
                  >
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={18}
                      color={colors.brandPrimary}
                    />
                    <Text style={[styles.streamActionText, { color: colors.text }]}>Watch</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.streamActionButton, { backgroundColor: 'rgba(220, 20, 60, 0.1)', borderColor: '#DC143C' }]}
                    onPress={() => handleStopStream(stream)}
                  >
                    <IconSymbol
                      ios_icon_name="stop.circle.fill"
                      android_material_icon_name="stop_circle"
                      size={18}
                      color="#DC143C"
                    />
                    <Text style={[styles.streamActionText, { color: '#DC143C' }]}>Stop</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/ModeratorReviewQueueScreen' as any)}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="tray.fill"
                android_material_icon_name="inbox"
                size={24}
                color={colors.brandPrimary}
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Review Queue
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  AI-flagged content for review
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminLiveStreamsScreen' as any)}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="flag.fill"
                android_material_icon_name="flag"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Stream Reports
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  {stats.streamReports} pending reports
                </Text>
              </View>
            </View>
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

function getStreamDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const durationMs = now - start;
  const minutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
  },
  streamCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  streamInfo: {
    flex: 1,
    gap: 4,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  streamCreator: {
    fontSize: 14,
    fontWeight: '400',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#FF0000',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF0000',
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
    fontSize: 13,
    fontWeight: '600',
  },
  streamActions: {
    flexDirection: 'row',
    gap: 10,
  },
  streamActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  streamActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionButtonText: {
    flex: 1,
    gap: 4,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
