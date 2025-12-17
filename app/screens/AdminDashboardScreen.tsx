
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService, AdminRole } from '@/app/services/adminService';
import { supabase } from '@/app/integrations/supabase/client';

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    openReports: 0,
    liveStreams: 0,
    usersUnderPenalty: 0,
    activeStrikes: 0,
    pendingAppeals: 0,
    vipSubscribers: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch open reports
      const { data: reportsData } = await supabase
        .from('user_reports')
        .select('id, type')
        .eq('status', 'open');
      const openReports = reportsData?.filter(r => r.type !== 'stream').length || 0;

      // Fetch live streams
      const { data: streamsData } = await supabase
        .from('streams')
        .select('id')
        .eq('status', 'live');
      const liveStreams = streamsData?.length || 0;

      // Fetch users under penalty
      const { count: penaltyCount } = await supabase
        .from('admin_penalties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch pending appeals
      const { count: appealsCount } = await supabase
        .from('appeals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch VIP subscribers
      const { count: vipCount } = await supabase
        .from('vip_club_members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total users
      const { count: totalUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: activeViewers } = await supabase
        .from('stream_viewers')
        .select('user_id')
        .is('left_at', null)
        .gte('joined_at', fiveMinutesAgo);

      const { data: activeStreamers } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('status', 'live');

      const activeUserIds = new Set<string>();
      if (activeViewers) {
        activeViewers.forEach(v => activeUserIds.add(v.user_id));
      }
      if (activeStreamers) {
        activeStreamers.forEach(s => activeUserIds.add(s.broadcaster_id));
      }

      setStats({
        openReports,
        liveStreams,
        usersUnderPenalty: penaltyCount || 0,
        activeStrikes: 0,
        pendingAppeals: appealsCount || 0,
        vipSubscribers: vipCount || 0,
        totalUsers: totalUsersCount || 0,
        activeUsers: activeUserIds.size,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  const checkAdminAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    console.log('Admin dashboard access check:', result);
    
    if (!result.isAdmin || !result.role) {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      router.back();
      return;
    }

    // Only ADMIN role can access this dashboard
    if (result.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'This dashboard is for Admin role only.');
      router.back();
      return;
    }

    setAdminRole(result.role);
    await fetchDashboardStats();
    setIsLoading(false);
  }, [user, fetchDashboardStats]);

  useEffect(() => {
    checkAdminAccess();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkAdminAccess, fetchDashboardStats]);

  const getRoleColor = (role: AdminRole) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return '#FFD700';
      case 'ADMIN':
        return colors.gradientEnd;
      case 'SUPPORT':
        return '#4ECDC4';
      case 'LIVE_MODERATOR':
        return '#FF6B6B';
      default:
        return colors.textSecondary;
    }
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return 'Head Admin';
      case 'ADMIN':
        return 'Admin';
      case 'SUPPORT':
        return 'Support Team';
      case 'LIVE_MODERATOR':
        return 'Live Moderator';
      default:
        return 'Moderator';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(adminRole!) }]}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(adminRole!)}</Text>
            </View>
          </View>
        </View>

        {/* Real-time Stats Grid - NOW CLICKABLE */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminUsersListScreen?type=active' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={32}
              color="#00FF00"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Users</Text>
            <View style={styles.liveDotIndicator} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminUsersListScreen?type=total' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="groups"
              size={32}
              color="#4ECDC4"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminReportsScreen' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="flag.fill"
              android_material_icon_name="flag"
              size={32}
              color={colors.gradientEnd}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.openReports}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminLiveStreamsScreen' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={32}
              color="#FF1493"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.liveStreams}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Live Streams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminStrikesScreen' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color="#FFA500"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeStrikes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Strikes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminSuspensionsScreen' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={32}
              color="#DC143C"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.usersUnderPenalty}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Suspensions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminBanAppealsScreen' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={32}
              color="#4ECDC4"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.pendingAppeals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Appeals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminUsersListScreen?type=vip' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={32}
              color="#FFD700"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.vipSubscribers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VIP Subscribers</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminReportsScreen' as any)}
            activeOpacity={0.7}
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
                  Manage Reports
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Review and resolve user reports
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
            onPress={() => router.push('/screens/AdminStrikesScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={24}
                color="#FFA500"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Active Strikes
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  View and manage user strikes
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
            onPress={() => router.push('/screens/AdminSuspensionsScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={24}
                color="#DC143C"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Active Suspensions
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Manage suspended users
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
            onPress={() => router.push('/screens/AdminBanAppealsScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color="#4ECDC4"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Ban Appeals
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Review reinstatement requests
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
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={24}
                color="#FF1493"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Live Streams
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Monitor and manage active streams
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
            onPress={() => router.push('/screens/AdminMessagingScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="mail"
                size={24}
                color="#9B59B6"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Send Messages
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  Send warnings and notices to users
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
            onPress={() => router.push('/screens/AdminAnalyticsScreen' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <IconSymbol
                ios_icon_name="chart.bar.xaxis"
                android_material_icon_name="bar_chart"
                size={24}
                color="#3498DB"
              />
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
                  Analytics Dashboard
                </Text>
                <Text style={[styles.actionButtonSubtitle, { color: colors.textSecondary }]}>
                  View platform analytics and insights
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    fontSize: 28,
    fontWeight: '800',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  wideCard: {
    width: '100%',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  liveDotIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
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
});
