
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { userReportingService, UserReport } from '@/app/services/userReportingService';
import { supabase } from '@/app/integrations/supabase/client';

interface ReportWithProfiles extends UserReport {
  reported_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  reporter_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function AdminUserReportsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [reports, setReports] = useState<ReportWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const reportsData = await userReportingService.getAllUserReports(100);
      
      // Fetch user profiles for each report
      const reportsWithProfiles = await Promise.all(
        reportsData.map(async (report) => {
          const [reportedUser, reporterUser] = await Promise.all([
            report.reported_user_id
              ? supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', report.reported_user_id)
                  .single()
              : Promise.resolve({ data: null }),
            report.reporter_user_id
              ? supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', report.reporter_user_id)
                  .single()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...report,
            reported_user: reportedUser.data || undefined,
            reporter_user: reporterUser.data || undefined,
          };
        })
      );

      setReports(reportsWithProfiles);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleMarkAsHandled = useCallback(async (reportId: string) => {
    if (!user) return;

    Alert.alert(
      'Mark as Handled',
      'Are you sure you want to mark this report as handled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Handled',
          onPress: async () => {
            const result = await userReportingService.markReportAsHandled(reportId, user.id);
            if (result.success) {
              Alert.alert('Success', 'Report marked as handled');
              fetchReports();
            } else {
              Alert.alert('Error', result.error || 'Failed to mark report as handled');
            }
          },
        },
      ]
    );
  }, [user, fetchReports]);

  const handleViewProfile = useCallback((userId: string) => {
    router.push({
      pathname: '/screens/PublicProfileScreen',
      params: { userId },
    });
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}m ago` : 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return colors.brandPrimary;
      case 'in_review':
        return '#FFA500';
      case 'closed':
        return '#4CAF50';
      default:
        return colors.textSecondary;
    }
  };

  const renderReport = ({ item }: { item: ReportWithProfiles }) => (
    <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.reportHeader}>
        <View style={styles.reportUsers}>
          <TouchableOpacity
            style={styles.userSection}
            onPress={() => item.reported_user && handleViewProfile(item.reported_user.id)}
          >
            {item.reported_user?.avatar_url ? (
              <Image source={{ uri: item.reported_user.avatar_url }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Reported User</Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                @{item.reported_user?.username || 'Unknown'}
              </Text>
            </View>
          </TouchableOpacity>

          <IconSymbol
            ios_icon_name="arrow.right"
            android_material_icon_name="arrow_forward"
            size={20}
            color={colors.textSecondary}
          />

          <TouchableOpacity
            style={styles.userSection}
            onPress={() => item.reporter_user && handleViewProfile(item.reporter_user.id)}
          >
            {item.reporter_user?.avatar_url ? (
              <Image source={{ uri: item.reporter_user.avatar_url }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Reporter</Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                @{item.reporter_user?.username || 'Unknown'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20`, borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.reportDescription, { color: colors.text }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.reportFooter}>
        <Text style={[styles.reportTime, { color: colors.textSecondary }]}>
          {formatTime(item.created_at)}
        </Text>

        {item.status === 'open' && (
          <TouchableOpacity
            style={[styles.handleButton, { backgroundColor: colors.brandPrimary }]}
            onPress={() => handleMarkAsHandled(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.handleButtonText}>Mark as Handled</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Reports</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchReports();
            }}
            tintColor={colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check_circle"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No user reports</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              All reports have been handled
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reportDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  handleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  handleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
});
