
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { pushNotificationService, PushNotificationLog } from '@/app/services/pushNotificationService';
import { adminService } from '@/app/services/adminService';

type TabType = 'all' | 'sent' | 'failed' | 'pending';

export default function AdminPushNotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [logs, setLogs] = useState<PushNotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
  });

  const checkAdminAccess = useCallback(async () => {
    if (!user) return;

    const { role } = await adminService.checkAdminRole(user.id);
    if (!role || !['HEAD_ADMIN', 'ADMIN', 'SUPPORT'].includes(role)) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.back();
    }
  }, [user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get logs based on active tab
      const deliveryStatus = activeTab === 'all' ? undefined : activeTab;
      const allLogs = await pushNotificationService.getAllPushNotificationLogs({
        deliveryStatus: deliveryStatus as any,
        limit: 100,
      });

      setLogs(allLogs);

      // Calculate stats
      const total = allLogs.length;
      const sent = allLogs.filter(log => log.delivery_status === 'sent').length;
      const failed = allLogs.filter(log => log.delivery_status === 'failed').length;
      const pending = allLogs.filter(log => log.delivery_status === 'pending').length;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      setStats({ total, sent, failed, pending, successRate });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      case 'pending':
        return '#FF9500';
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MODERATION_WARNING':
        return { ios: 'exclamationmark.triangle', android: 'warning' };
      case 'TIMEOUT_APPLIED':
        return { ios: 'clock', android: 'schedule' };
      case 'BAN_APPLIED':
        return { ios: 'hand.raised', android: 'block' };
      case 'BAN_EXPIRED':
        return { ios: 'checkmark.circle', android: 'check_circle' };
      case 'APPEAL_RECEIVED':
        return { ios: 'doc.text', android: 'description' };
      case 'APPEAL_APPROVED':
        return { ios: 'checkmark.seal', android: 'verified' };
      case 'APPEAL_DENIED':
        return { ios: 'xmark.seal', android: 'cancel' };
      case 'ADMIN_ANNOUNCEMENT':
        return { ios: 'megaphone', android: 'campaign' };
      default:
        return { ios: 'bell', android: 'notifications' };
    }
  };

  const renderLogItem = (log: PushNotificationLog) => {
    const icon = getTypeIcon(log.type);
    const statusColor = getStatusColor(log.delivery_status);

    return (
      <View
        key={log.id}
        style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.logHeader}>
          <View style={styles.typeInfo}>
            <IconSymbol
              ios_icon_name={icon.ios}
              android_material_icon_name={icon.android}
              size={20}
              color={colors.text}
            />
            <Text style={[styles.typeText, { color: colors.text }]}>
              {log.type.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {log.delivery_status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {log.title}
        </Text>

        <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
          {log.body}
        </Text>

        {log.payload_json && (
          <View style={[styles.payloadBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.payloadLabel, { color: colors.textSecondary }]}>
              Payload:
            </Text>
            <Text style={[styles.payloadText, { color: colors.text }]} numberOfLines={2}>
              {JSON.stringify(log.payload_json, null, 2)}
            </Text>
          </View>
        )}

        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          {new Date(log.sent_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Push Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.sent}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>{stats.failed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Failed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.successRate.toFixed(1)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Success</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && [styles.activeTab, { backgroundColor: colors.gradientEnd }]]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'all' ? '#FFFFFF' : colors.text }]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && [styles.activeTab, { backgroundColor: colors.gradientEnd }]]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'sent' ? '#FFFFFF' : colors.text }]}>
            Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'failed' && [styles.activeTab, { backgroundColor: colors.gradientEnd }]]}
          onPress={() => setActiveTab('failed')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'failed' ? '#FFFFFF' : colors.text }]}>
            Failed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && [styles.activeTab, { backgroundColor: colors.gradientEnd }]]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'pending' ? '#FFFFFF' : colors.text }]}>
            Pending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bell.slash"
              android_material_icon_name="notifications_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications found
            </Text>
          </View>
        ) : (
          logs.map(renderLogItem)
        )}
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  payloadBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  payloadLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  payloadText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timeText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});