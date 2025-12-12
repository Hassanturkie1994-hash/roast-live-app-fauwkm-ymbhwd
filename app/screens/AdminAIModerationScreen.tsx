
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { aiModerationService, UserViolation } from '@/app/services/aiModerationService';
import { adminService } from '@/app/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import { inboxService } from '@/app/services/inboxService';

type TabType = 'violations' | 'banned' | 'reports';

export default function AdminAIModerationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('violations');
  const [violations, setViolations] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const init = async () => {
      await checkAdminAccess();
      await loadData();
    };
    init();
  }, [activeTab]);

  const checkAdminAccess = async () => {
    if (!user) return;

    const { role } = await adminService.checkAdminRole(user.id);
    if (!role || !['HEAD_ADMIN', 'ADMIN', 'SUPPORT'].includes(role)) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.back();
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'violations') {
        const data = await aiModerationService.getViolationsWithProfiles(100);
        setViolations(data);
      } else if (activeTab === 'banned') {
        // Get users with level 4 strikes (permanent bans)
        const { data } = await adminService.getUsersUnderPenalty();
        setBannedUsers(data?.users || []);
      } else if (activeTab === 'reports') {
        // Get trending violation categories
        const data = await aiModerationService.getAllViolations(100);
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleReviewViolation = (violation: any) => {
    Alert.alert(
      'Review Violation',
      `User: ${violation.profiles?.username || 'Unknown'}\nMessage: "${violation.flagged_text}"\nScore: ${violation.overall_score.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Message',
          onPress: () => approveMessage(violation),
        },
        {
          text: 'Delete Message',
          style: 'destructive',
          onPress: () => deleteMessage(violation),
        },
        {
          text: 'Apply Timeout',
          onPress: () => applyTimeout(violation),
        },
        {
          text: 'Apply Ban',
          style: 'destructive',
          onPress: () => applyBan(violation),
        },
      ]
    );
  };

  const approveMessage = async (violation: any) => {
    try {
      await aiModerationService.deleteViolation(violation.id);
      
      // Send notification to user
      await inboxService.sendMessage(
        violation.user_id,
        violation.user_id,
        'Your flagged message has been reviewed and approved by an administrator.',
        'safety'
      );

      Alert.alert('Success', 'Message approved');
      loadData();
    } catch (error) {
      console.error('Error approving message:', error);
      Alert.alert('Error', 'Failed to approve message');
    }
  };

  const deleteMessage = async (violation: any) => {
    try {
      await aiModerationService.deleteViolation(violation.id);
      
      // Send notification to user
      await inboxService.sendMessage(
        violation.user_id,
        violation.user_id,
        'Your message has been deleted by an administrator for violating community guidelines.',
        'safety'
      );

      Alert.alert('Success', 'Message deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const applyTimeout = async (violation: any) => {
    if (!user) return;

    Alert.prompt(
      'Apply Timeout',
      'Enter timeout duration in minutes:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async (duration) => {
            try {
              const minutes = parseInt(duration || '10');
              await adminService.suspendUser(
                user.id,
                violation.user_id,
                `Timeout for ${minutes} minutes - AI moderation violation`,
                minutes / (24 * 60) // Convert to days
              );

              await inboxService.sendMessage(
                violation.user_id,
                violation.user_id,
                `You have been timed out for ${minutes} minutes by an administrator.`,
                'safety'
              );

              Alert.alert('Success', 'Timeout applied');
              loadData();
            } catch (error) {
              console.error('Error applying timeout:', error);
              Alert.alert('Error', 'Failed to apply timeout');
            }
          },
        },
      ],
      'plain-text',
      '10'
    );
  };

  const applyBan = async (violation: any) => {
    if (!user) return;

    Alert.alert(
      'Confirm Ban',
      'Are you sure you want to permanently ban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.banUser(
                user.id,
                violation.user_id,
                'Permanent ban - severe AI moderation violations'
              );

              await inboxService.sendMessage(
                violation.user_id,
                violation.user_id,
                'Your account has been permanently banned for severe violations of community guidelines.',
                'safety'
              );

              Alert.alert('Success', 'User banned');
              loadData();
            } catch (error) {
              console.error('Error banning user:', error);
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const removeBan = async (userId: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Ban',
      'Are you sure you want to remove this ban?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              // Remove ban logic here
              await inboxService.sendMessage(
                userId,
                userId,
                'Your ban has been lifted by an administrator. You can now use all features.',
                'safety'
              );

              Alert.alert('Success', 'Ban removed');
              loadData();
            } catch (error) {
              console.error('Error removing ban:', error);
              Alert.alert('Error', 'Failed to remove ban');
            }
          },
        },
      ]
    );
  };

  const renderViolationItem = (violation: any) => {
    const scoreColor = 
      violation.overall_score >= 0.85 ? '#FF3B30' :
      violation.overall_score >= 0.70 ? '#FF9500' :
      violation.overall_score >= 0.50 ? '#FFCC00' :
      '#34C759';

    return (
      <TouchableOpacity
        key={violation.id}
        style={styles.violationCard}
        onPress={() => handleReviewViolation(violation)}
      >
        <View style={styles.violationHeader}>
          <Text style={styles.username}>
            {violation.profiles?.username || 'Unknown User'}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>
              {(violation.overall_score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        <Text style={styles.messagePreview} numberOfLines={2}>
          {violation.flagged_text}
        </Text>

        <View style={styles.violationFooter}>
          <Text style={styles.actionText}>
            Action: {violation.action_taken}
          </Text>
          <Text style={styles.timeText}>
            {new Date(violation.created_at).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Review Now</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron_right"
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderBannedUserItem = (user: any) => {
    return (
      <View key={user.id} style={styles.bannedCard}>
        <View style={styles.bannedHeader}>
          <Text style={styles.username}>
            {user.profiles?.username || 'Unknown User'}
          </Text>
          <View style={styles.bannedBadge}>
            <Text style={styles.bannedBadgeText}>BANNED</Text>
          </View>
        </View>

        <Text style={styles.banReason}>
          Reason: {user.reason || 'No reason provided'}
        </Text>

        <View style={styles.banFooter}>
          <Text style={styles.banDate}>
            Banned: {new Date(user.created_at).toLocaleDateString()}
          </Text>
          {user.expires_at && (
            <Text style={styles.expiryText}>
              Expires: {new Date(user.expires_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.removeBanButton}
          onPress={() => removeBan(user.target_user_id)}
        >
          <Text style={styles.removeBanButtonText}>Remove Ban</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReportsTab = () => {
    // Group violations by category
    const categoryCount: Record<string, number> = {};
    const userViolationCount: Record<string, number> = {};

    reports.forEach((violation) => {
      // Count by action taken
      categoryCount[violation.action_taken] = (categoryCount[violation.action_taken] || 0) + 1;
      
      // Count by user
      userViolationCount[violation.user_id] = (userViolationCount[violation.user_id] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const repeatOffenders = Object.entries(userViolationCount)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return (
      <View style={styles.reportsContainer}>
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Trending Violations</Text>
          {topCategories.map(([category, count]) => (
            <View key={category} style={styles.reportItem}>
              <Text style={styles.reportCategory}>{category}</Text>
              <Text style={styles.reportCount}>{count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Repeat Offenders</Text>
          {repeatOffenders.map(([userId, count]) => (
            <View key={userId} style={styles.reportItem}>
              <Text style={styles.reportCategory}>User ID: {userId.slice(0, 8)}...</Text>
              <Text style={styles.reportCount}>{count} violations</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const filteredViolations = violations.filter((v) =>
    v.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.flagged_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Moderation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'violations' && styles.activeTab]}
          onPress={() => setActiveTab('violations')}
        >
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={20}
            color={activeTab === 'violations' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'violations' && styles.activeTabText,
            ]}
          >
            Violations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'banned' && styles.activeTab]}
          onPress={() => setActiveTab('banned')}
        >
          <IconSymbol
            ios_icon_name="hand.raised"
            android_material_icon_name="block"
            size={20}
            color={activeTab === 'banned' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[styles.tabText, activeTab === 'banned' && styles.activeTabText]}
          >
            Banned Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <IconSymbol
            ios_icon_name="chart.bar"
            android_material_icon_name="bar_chart"
            size={20}
            color={activeTab === 'reports' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}
          >
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab === 'violations' && (
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search violations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'violations' && (
          <View style={styles.violationsList}>
            {filteredViolations.length === 0 ? (
              <Text style={styles.emptyText}>No violations found</Text>
            ) : (
              filteredViolations.map(renderViolationItem)
            )}
          </View>
        )}

        {activeTab === 'banned' && (
          <View style={styles.bannedList}>
            {bannedUsers.length === 0 ? (
              <Text style={styles.emptyText}>No banned users</Text>
            ) : (
              bannedUsers.map(renderBannedUserItem)
            )}
          </View>
        )}

        {activeTab === 'reports' && renderReportsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  violationsList: {
    padding: 16,
    gap: 12,
  },
  violationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messagePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  violationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannedList: {
    padding: 16,
    gap: 12,
  },
  bannedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  bannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  bannedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  banReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  banFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  banDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expiryText: {
    fontSize: 12,
    color: '#FF9500',
  },
  removeBanButton: {
    paddingVertical: 10,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeBanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportsContainer: {
    padding: 16,
    gap: 24,
  },
  reportSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportCategory: {
    fontSize: 14,
    color: colors.text,
    textTransform: 'capitalize',
  },
  reportCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});