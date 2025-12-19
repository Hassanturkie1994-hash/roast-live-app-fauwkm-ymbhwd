
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/app/services/adminService';
import { supabase } from '@/app/integrations/supabase/client';
import GradientButton from '@/components/GradientButton';
import UserBanModal from '@/components/UserBanModal';

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string | null;
}

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
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HEAD ADMIN SUPER-DASHBOARD
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This dashboard aggregates ALL features from:
 * - Admin Dashboard (reports, users, bans)
 * - Moderator Dashboard (live stream monitoring)
 * - Support Dashboard (appeals, reports)
 * - Financial Oversight (platform & user finances)
 * - User Privacy Module (comprehensive user data)
 * 
 * Head Admin has the STRONGEST permissions in the system.
 * No other role may match or exceed head_admin.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function HeadAdminDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    timedOutUsers: 0,
    openReports: 0,
    streamReports: 0,
    pendingAppeals: 0,
    liveStreams: 0,
    totalViewers: 0,
    admins: 0,
    moderators: 0,
    support: 0,
  });
  const [financialStats, setFinancialStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    platformFees: 0,
  });
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUserPrivacyModal, setShowUserPrivacyModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('USER');
  const [searching, setSearching] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);
  const [actionType, setActionType] = useState<'role' | 'ban' | 'privacy' | 'financial'>('role');

  const fetchStats = useCallback(async () => {
    try {
      const { count: totalUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

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

      const { data: reportsData } = await supabase
        .from('user_reports')
        .select('id, type')
        .eq('status', 'open');

      const { count: bannedCount } = await supabase
        .from('admin_penalties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: appealsCount } = await supabase
        .from('appeals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: staffData } = await supabase
        .from('profiles')
        .select('role')
        .in('role', ['HEAD_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']);

      const admins = staffData?.filter(s => s.role === 'ADMIN' || s.role === 'HEAD_ADMIN').length || 0;
      const moderators = staffData?.filter(s => s.role === 'MODERATOR').length || 0;
      const support = staffData?.filter(s => s.role === 'SUPPORT').length || 0;

      // Fetch live streams
      const { data: liveStreamsData } = await supabase
        .from('streams')
        .select('id, title, broadcaster_id, viewer_count, started_at, profiles(username, display_name)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

      const totalViewers = liveStreamsData?.reduce((sum, stream) => sum + (stream.viewer_count || 0), 0) || 0;

      setLiveStreams(liveStreamsData || []);

      setStats({
        totalUsers: totalUsersCount || 0,
        activeUsers: activeUserIds.size,
        bannedUsers: bannedCount || 0,
        timedOutUsers: 0,
        openReports: reportsData?.filter(r => r.type !== 'stream').length || 0,
        streamReports: reportsData?.filter(r => r.type === 'stream').length || 0,
        pendingAppeals: appealsCount || 0,
        liveStreams: liveStreamsData?.length || 0,
        totalViewers,
        admins,
        moderators,
        support,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchFinancialStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const overview = await adminService.getPlatformFinancialOverview(thirtyDaysAgo, today);
      
      if (overview) {
        setFinancialStats({
          totalIncome: overview.totalIncome,
          totalExpenses: overview.totalExpenses,
          netRevenue: overview.netRevenue,
          platformFees: overview.platformFees,
        });
      }
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    }
  }, []);

  const checkAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    console.log('Head Admin access check:', result);
    
    if (!result.isAdmin || result.role !== 'HEAD_ADMIN') {
      Alert.alert('Access Denied', 'You do not have head admin privileges.');
      router.back();
      return;
    }

    await Promise.all([fetchStats(), fetchFinancialStats()]);
    setLoading(false);
  }, [user, fetchStats, fetchFinancialStats]);

  useEffect(() => {
    checkAccess();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchFinancialStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkAccess, fetchStats, fetchFinancialStats]);

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, role, email')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error in handleSearchUsers:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUserForRole = (selectedUserData: UserSearchResult) => {
    setSelectedUser(selectedUserData);
    setSelectedRole(selectedUserData.role || 'USER');
    setActionType('role');
    setShowUserSearchModal(false);
    setShowRoleModal(true);
  };

  const handleSelectUserForBan = (selectedUserData: UserSearchResult) => {
    setSelectedUser(selectedUserData);
    setActionType('ban');
    setShowUserSearchModal(false);
    setShowBanModal(true);
  };

  const handleSelectUserForPrivacy = (selectedUserData: UserSearchResult) => {
    setSelectedUser(selectedUserData);
    setActionType('privacy');
    setShowUserSearchModal(false);
    setShowUserPrivacyModal(true);
  };

  const handleSelectUserForFinancial = (selectedUserData: UserSearchResult) => {
    setSelectedUser(selectedUserData);
    setActionType('financial');
    setShowUserSearchModal(false);
    setShowFinancialModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !user) {
      Alert.alert('Error', 'No user selected');
      return;
    }

    if (selectedUser.role === selectedRole) {
      Alert.alert('No Change', 'User already has this role');
      return;
    }

    setAssigningRole(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUser.id);

      if (updateError) {
        console.error('Error updating role:', updateError);
        Alert.alert('Error', 'Failed to assign role');
        return;
      }

      const roleNames: Record<string, string> = {
        'HEAD_ADMIN': 'Head Admin',
        'ADMIN': 'Admin',
        'MODERATOR': 'Moderator',
        'SUPPORT': 'Support Team',
        'USER': 'User',
      };

      await supabase
        .from('notifications')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          type: 'admin_announcement',
          message: `Your role has been updated to: ${roleNames[selectedRole]}`,
          category: 'admin',
          read: false,
        });

      Alert.alert('Success', `Role assigned to ${selectedUser.username}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      await fetchStats();
    } catch (error) {
      console.error('Error in handleAssignRole:', error);
      Alert.alert('Error', 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const { error: announcementError } = await supabase
        .from('announcements')
        .insert({
          title: announcementTitle,
          message: announcementMessage,
          link: announcementLink || null,
          issued_by_admin_id: user.id,
          is_active: true,
        });

      if (announcementError) {
        console.error('Error creating announcement:', announcementError);
        Alert.alert('Error', 'Failed to create announcement');
        return;
      }

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .limit(10000);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        Alert.alert('Error', 'Failed to fetch users');
        return;
      }

      const notifications = users.map(u => ({
        sender_id: user.id,
        receiver_id: u.id,
        type: 'admin_announcement',
        message: `📢 ${announcementTitle}: ${announcementMessage}`,
        category: 'admin',
        read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        Alert.alert('Warning', 'Announcement created but notifications failed');
      } else {
        Alert.alert('Success', `Announcement sent to ${users.length} users`);
      }

      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementLink('');
    } catch (error) {
      console.error('Error in handleSendAnnouncement:', error);
      Alert.alert('Error', 'Failed to send announcement');
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Head Admin Dashboard</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.roleBadgeText}>HEAD ADMIN</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PLATFORM OVERVIEW
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Platform Overview</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/screens/AdminUsersListScreen?type=total' as any)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="person.3.fill"
                android_material_icon_name="group"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/screens/AdminUsersListScreen?type=active' as any)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={28}
                color="#00C853"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
              <View style={styles.liveDot} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/screens/AdminSuspensionsScreen' as any)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={28}
                color="#DC143C"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.bannedUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Banned</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/screens/AdminStrikesScreen' as any)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={28}
                color="#FFA500"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.timedOutUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Timed Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FINANCIAL OVERSIGHT (HEAD_ADMIN & ADMIN ONLY)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Financial Overview (Last 30 Days)</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#00C853' }]}>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="trending_up"
                size={28}
                color="#00C853"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {financialStats.totalIncome.toLocaleString()} kr
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Income</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#DC143C' }]}>
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="trending_down"
                size={28}
                color="#DC143C"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {financialStats.totalExpenses.toLocaleString()} kr
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#FFD700' }]}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={28}
                color="#FFD700"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {financialStats.netRevenue.toLocaleString()} kr
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net Revenue</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.brandPrimary }]}>
              <IconSymbol
                ios_icon_name="percent"
                android_material_icon_name="percent"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {financialStats.platformFees.toLocaleString()} kr
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Platform Fees (30%)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setActionType('financial');
              setShowUserSearchModal(true);
            }}
          >
            <IconSymbol
              ios_icon_name="chart.line.uptrend.xyaxis"
              android_material_icon_name="analytics"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View User Financial Breakdown</Text>
          </TouchableOpacity>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            USER MANAGEMENT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 User Management</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setActionType('role');
              setShowUserSearchModal(true);
            }}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus.fill"
              android_material_icon_name="person_add"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Search Users & Assign Roles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: '#DC143C' }]}
            onPress={() => {
              setActionType('ban');
              setShowUserSearchModal(true);
            }}
          >
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={20}
              color="#DC143C"
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Ban User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: '#4A90E2' }]}
            onPress={() => {
              setActionType('privacy');
              setShowUserSearchModal(true);
            }}
          >
            <IconSymbol
              ios_icon_name="eye.fill"
              android_material_icon_name="visibility"
              size={20}
              color="#4A90E2"
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>All User Privacy</Text>
          </TouchableOpacity>
          
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Search by username, display name, email, or user ID
          </Text>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LIVE STREAM MONITORING (FROM MODERATOR DASHBOARD)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📹 Live Stream Monitoring</Text>
          
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
          </View>

          {liveStreams.length > 0 && (
            <View style={styles.liveStreamsList}>
              {liveStreams.slice(0, 5).map((stream) => (
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
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminLiveStreamsScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={20}
              color="#FF1493"
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View All Live Streams</Text>
          </TouchableOpacity>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            REPORTS & APPEALS (FROM ADMIN & SUPPORT DASHBOARDS)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚨 Reports & Appeals</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminReportsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="flag.fill"
                android_material_icon_name="flag"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>User Reports</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  {stats.openReports} open reports
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
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminLiveStreamsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={24}
                color="#FF1493"
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Stream Reports</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  {stats.streamReports} stream reports
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
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminBanAppealsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color="#4ECDC4"
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Pending Appeals</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  {stats.pendingAppeals} pending appeals
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STAFF MANAGEMENT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 Staff Management</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Admins:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.admins}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Moderators:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.moderators}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Support Team:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.support}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/RoleManagementScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus.fill"
              android_material_icon_name="person_add"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Staff Roles</Text>
          </TouchableOpacity>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            GLOBAL ACTIONS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌐 Global Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminAnnouncementsScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="bell.badge.fill"
              android_material_icon_name="notifications_active"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Send Push Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowAnnouncementModal(true)}
          >
            <IconSymbol
              ios_icon_name="megaphone.fill"
              android_material_icon_name="campaign"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Send In-App Announcement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* User Search Modal */}
      <Modal
        visible={showUserSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {actionType === 'role' && 'Search Users'}
                {actionType === 'ban' && 'Search Users to Ban'}
                {actionType === 'privacy' && 'Search Users - Privacy Data'}
                {actionType === 'financial' && 'Search Users - Financial Data'}
              </Text>
              <TouchableOpacity onPress={() => setShowUserSearchModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                  placeholder="Username, Display Name, Email, or User ID"
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchUsers}
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.brandPrimary }]}
                  onPress={handleSearchUsers}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <IconSymbol
                      ios_icon_name="magnifyingglass"
                      android_material_icon_name="search"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.searchResults}>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={[styles.searchResultItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      if (actionType === 'role') handleSelectUserForRole(result);
                      else if (actionType === 'ban') handleSelectUserForBan(result);
                      else if (actionType === 'privacy') handleSelectUserForPrivacy(result);
                      else if (actionType === 'financial') handleSelectUserForFinancial(result);
                    }}
                  >
                    <View style={styles.searchResultLeft}>
                      <IconSymbol
                        ios_icon_name="person.circle.fill"
                        android_material_icon_name="account_circle"
                        size={40}
                        color={colors.textSecondary}
                      />
                      <View>
                        <Text style={[styles.searchResultName, { color: colors.text }]}>
                          {result.display_name || result.username}
                        </Text>
                        <Text style={[styles.searchResultUsername, { color: colors.textSecondary }]}>
                          @{result.username}
                        </Text>
                        {result.email && (
                          <Text style={[styles.searchResultEmail, { color: colors.textSecondary }]}>
                            {result.email}
                          </Text>
                        )}
                        {result.role && result.role !== 'USER' && (
                          <Text style={[styles.searchResultRole, { color: colors.brandPrimary }]}>
                            Role: {result.role}
                          </Text>
                        )}
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Assign Role to {selectedUser?.username}
              </Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Select Role</Text>
              
              <View style={styles.roleOptions}>
                {['USER', 'SUPPORT', 'MODERATOR', 'ADMIN', 'HEAD_ADMIN'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                      selectedRole === role && { borderColor: colors.brandPrimary, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <View style={styles.roleOptionContent}>
                      <Text style={[styles.roleOptionTitle, { color: colors.text }]}>
                        {role.replace('_', ' ')}
                      </Text>
                      <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                        {getRoleDescription(role)}
                      </Text>
                    </View>
                    {selectedRole === role && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={24}
                        color={colors.brandPrimary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowRoleModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.assignButton, { backgroundColor: colors.brandPrimary }]}
                  onPress={handleAssignRole}
                  disabled={assigningRole}
                >
                  {assigningRole ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.assignButtonText}>Assign Role</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        visible={showAnnouncementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>App-Wide Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Announcement title..."
                placeholderTextColor={colors.textSecondary}
                value={announcementTitle}
                onChangeText={setAnnouncementTitle}
              />

              <Text style={[styles.label, { color: colors.text }]}>Message</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your announcement..."
                placeholderTextColor={colors.textSecondary}
                value={announcementMessage}
                onChangeText={setAnnouncementMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text }]}>Link (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={announcementLink}
                onChangeText={setAnnouncementLink}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowAnnouncementModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.sendButtonContainer}>
                  <GradientButton title="Send Announcement" onPress={handleSendAnnouncement} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ban Modal */}
      {selectedUser && (
        <UserBanModal
          visible={showBanModal}
          onClose={() => {
            setShowBanModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          username={selectedUser.username}
          onBanComplete={() => {
            fetchStats();
            setSearchResults([]);
            setSearchQuery('');
          }}
        />
      )}

      {/* User Privacy Modal - Will be implemented next */}
      {selectedUser && showUserPrivacyModal && (
        <UserPrivacyModal
          visible={showUserPrivacyModal}
          onClose={() => {
            setShowUserPrivacyModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}

      {/* User Financial Modal - Will be implemented next */}
      {selectedUser && showFinancialModal && (
        <UserFinancialModal
          visible={showFinancialModal}
          onClose={() => {
            setShowFinancialModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </View>
  );
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'HEAD_ADMIN':
      return 'Full platform control, can assign all roles, strongest permissions';
    case 'ADMIN':
      return 'Manage reports, users, bans, and moderation';
    case 'MODERATOR':
      return 'Monitor and moderate all live streams on the platform';
    case 'SUPPORT':
      return 'Review appeals and support tickets';
    case 'USER':
      return 'Standard user with no admin privileges';
    default:
      return '';
  }
}

// Placeholder components - will be implemented
function UserPrivacyModal({ visible, onClose, userId, username }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [privacyData, setPrivacyData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      const data = await adminService.getUserPrivacyData(userId, user.id);
      setPrivacyData(data);
      setLoading(false);
    };

    if (visible) {
      loadData();
    }
  }, [visible, userId, user]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              All User Privacy - @{username}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            ) : privacyData ? (
              <View style={styles.privacyDataContainer}>
                <Text style={[styles.privacySection, { color: colors.text }]}>Profile Information</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Email: {privacyData.email || 'N/A'}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Display Name: {privacyData.display_name || 'N/A'}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Date of Birth: {privacyData.date_of_birth || 'N/A'}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Role: {privacyData.role || 'USER'}</Text>
                
                <Text style={[styles.privacySection, { color: colors.text }]}>Activity</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Total Streams: {privacyData.total_streams}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Streaming Hours: {privacyData.total_streaming_hours}h</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Followers: {privacyData.followers_count}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Following: {privacyData.following_count}</Text>
                
                <Text style={[styles.privacySection, { color: colors.text }]}>Financial</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Gifts Sent: {privacyData.total_gifts_sent_sek} kr</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Gifts Received: {privacyData.total_gifts_received_sek} kr</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Subscriptions Paid: {privacyData.total_subscriptions_paid_sek} kr</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Payouts: {privacyData.total_payouts_sek} kr</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Wallet Balance: {privacyData.wallet_balance_sek} kr</Text>
                
                <Text style={[styles.privacySection, { color: colors.text }]}>Safety</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Reports Received: {privacyData.reports_received}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Warnings: {privacyData.warnings_received}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Active Penalties: {privacyData.active_penalties}</Text>
                <Text style={[styles.privacyItem, { color: colors.textSecondary }]}>Blocks Performed: {privacyData.blocks_performed}</Text>
                
                <Text style={[styles.privacySection, { color: colors.text }]}>Recent IP Addresses</Text>
                {privacyData.recent_ips.map((ip: string, index: number) => (
                  <Text key={index} style={[styles.privacyItem, { color: colors.textSecondary }]}>{ip}</Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.errorText, { color: colors.text }]}>Failed to load user data</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function UserFinancialModal({ visible, onClose, userId, username }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await adminService.getUserFinancialBreakdown(userId, thirtyDaysAgo, today);
      setFinancialData(data);
      setLoading(false);
    };

    if (visible) {
      loadData();
    }
  }, [visible, userId, user]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Financial Data - @{username}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            ) : financialData ? (
              <View style={styles.financialDataContainer}>
                <Text style={[styles.financialSection, { color: colors.text }]}>Last 30 Days</Text>
                
                <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Subscriptions Paid</Text>
                  <Text style={[styles.financialValue, { color: colors.text }]}>
                    {financialData.subscriptionsPaid.toLocaleString()} kr
                  </Text>
                </View>

                <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Gifts Sent</Text>
                  <Text style={[styles.financialValue, { color: colors.text }]}>
                    {financialData.giftsSent.toLocaleString()} kr
                  </Text>
                </View>

                <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Gifts Received</Text>
                  <Text style={[styles.financialValue, { color: '#00C853' }]}>
                    {financialData.giftsReceived.toLocaleString()} kr
                  </Text>
                </View>

                <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Creator Payouts</Text>
                  <Text style={[styles.financialValue, { color: colors.text }]}>
                    {financialData.creatorPayouts.toLocaleString()} kr
                  </Text>
                </View>

                <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Platform Fees (30%)</Text>
                  <Text style={[styles.financialValue, { color: colors.brandPrimary }]}>
                    {financialData.platformFees.toLocaleString()} kr
                  </Text>
                </View>

                <View style={[styles.financialCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.brandPrimary }]}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Net Earnings</Text>
                  <Text style={[styles.financialValue, { color: colors.brandPrimary }]}>
                    {financialData.netEarnings.toLocaleString()} kr
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.errorText, { color: colors.text }]}>Failed to load financial data</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  liveStreamsList: {
    gap: 12,
    marginTop: 12,
  },
  streamCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionCardText: {
    flex: 1,
    gap: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonContainer: {
    flex: 1,
  },
  assignButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    maxHeight: 400,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchResultUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  searchResultEmail: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  searchResultRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  privacyDataContainer: {
    gap: 12,
  },
  privacySection: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  privacyItem: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 6,
  },
  financialDataContainer: {
    gap: 12,
  },
  financialSection: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  financialCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
});
