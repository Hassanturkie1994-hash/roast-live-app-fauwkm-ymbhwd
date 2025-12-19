
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService } from '@/app/services/adminService';
import { supabase } from '@/app/integrations/supabase/client';

interface LiveStream {
  id: string;
  title: string;
  broadcaster_id: string;
  viewer_count: number;
  started_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

/**
 * Live Moderator Dashboard
 * 
 * For LIVE_MODERATOR staff role (different from stream-level moderators)
 * Can monitor and moderate ALL live streams on the platform
 */
export default function LiveModeratorDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [stats, setStats] = useState({
    totalLiveStreams: 0,
    totalViewers: 0,
    reportsToday: 0,
  });

  const fetchLiveStreams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('id, title, broadcaster_id, viewer_count, started_at, profiles(username, display_name)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

      if (error) {
        console.error('Error fetching live streams:', error);
        return;
      }

      setLiveStreams(data || []);

      const totalViewers = data?.reduce((sum, stream) => sum + (stream.viewer_count || 0), 0) || 0;

      const { count: reportsCount } = await supabase
        .from('stream_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalLiveStreams: data?.length || 0,
        totalViewers,
        reportsToday: reportsCount || 0,
      });
    } catch (error) {
      console.error('Error in fetchLiveStreams:', error);
    }
  }, []);

  const checkAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    console.log('Live Moderator access check:', result);
    
    if (!result.isAdmin || !['LIVE_MODERATOR', 'ADMIN', 'HEAD_ADMIN'].includes(result.role || '')) {
      Alert.alert('Access Denied', 'You do not have live moderator privileges.');
      router.back();
      return;
    }

    await fetchLiveStreams();
    setLoading(false);
  }, [user, fetchLiveStreams]);

  useEffect(() => {
    checkAccess();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchLiveStreams();
    }, 10000);

    return () => clearInterval(interval);
  }, [checkAccess, fetchLiveStreams]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveStreams();
    setRefreshing(false);
  };

  const handleViewStream = (stream: LiveStream) => {
    router.push({
      pathname: '/screens/ViewerScreen',
      params: { streamId: stream.id },
    });
  };

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
              await fetchLiveStreams();
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Live Moderator</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#9B59B6' }]}>
            <Text style={styles.roleBadgeText}>LIVE MODERATOR</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={28}
              color="#FF1493"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalLiveStreams}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Live Streams</Text>
            <View style={styles.liveDot} />
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
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.reportsToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reports Today</Text>
          </View>
        </View>

        {/* Live Streams */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Streams</Text>

          {liveStreams.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="video.slash.fill"
                android_material_icon_name="videocam_off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No live streams</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                There are no active streams to moderate right now
              </Text>
            </View>
          ) : (
            liveStreams.map((stream) => (
              <View key={stream.id} style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.streamHeader}>
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
                    onPress={() => handleViewStream(stream)}
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
      </ScrollView>
    </View>
  );
}

function getStreamDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = now - start;
  const minutes = Math.floor(diff / (1000 * 60));
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
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
  streamCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
