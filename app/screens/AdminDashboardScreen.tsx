
import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

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
    dailyVolume: 0,
  });

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
      Alert.alert('Access Denied', 'Moderators do not have access to the admin dashboard.');
      router.back();
      return;
    }

    setAdminRole(result.role);
    await fetchDashboardStats();
    setIsLoading(false);
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch open reports
      const reportsResult = await adminService.getReports({ status: 'open', limit: 1000 });
      const openReports = reportsResult.reports?.length || 0;

      // Fetch live streams
      const streamsResult = await adminService.getLiveStreams();
      const liveStreams = streamsResult.streams?.length || 0;

      // Fetch users under penalty
      const penaltyResult = await adminService.getUsersUnderPenalty();
      const usersUnderPenalty = penaltyResult.users?.length || 0;

      // Fetch VIP overview
      const vipResult = await adminService.getVIPOverview();
      const vipSubscribers = vipResult.data?.active || 0;

      // Fetch daily transaction volume
      const volumeResult = await adminService.getDailyTransactionVolume();
      const dailyVolume = volumeResult.volume || 0;

      setStats({
        openReports,
        liveStreams,
        usersUnderPenalty,
        activeStrikes: 0, // Will be fetched separately
        pendingAppeals: 0, // Will be fetched separately
        vipSubscribers,
        dailyVolume,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const getRoleColor = (role: AdminRole) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return '#FFD700';
      case 'ADMIN':
        return colors.gradientEnd;
      case 'SUPPORT':
        return '#4ECDC4';
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
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

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={32}
              color="#FFD700"
            />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.vipSubscribers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VIP Subscribers</Text>
          </View>
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