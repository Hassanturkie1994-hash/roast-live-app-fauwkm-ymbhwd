
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, AdminRole } from '@/app/services/adminService';
import { supabase } from '@/app/integrations/supabase/client';
import GradientButton from '@/components/GradientButton';

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string | null;
}

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
    admins: 0,
    support: 0,
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'timeout' | 'permanent_ban' | 'warning'>('warning');
  const [actionReason, setActionReason] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [timeoutDuration, setTimeoutDuration] = useState(60);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    if (!result.success || result.role !== 'HEAD_ADMIN') {
      Alert.alert('Access Denied', 'You do not have head admin privileges.');
      router.back();
      return;
    }

    await fetchStats();
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [reportsResult, usersResult] = await Promise.all([
        adminService.getReports({ status: 'open', limit: 1000 }),
        adminService.getUsersUnderPenalty(),
      ]);

      setStats({
        totalUsers: 0, // TODO: Implement
        activeUsers: 0, // TODO: Implement
        bannedUsers: usersResult.users?.length || 0,
        timedOutUsers: 0, // TODO: Implement
        openReports: reportsResult.reports?.filter(r => r.type !== 'stream').length || 0,
        streamReports: reportsResult.reports?.filter(r => r.type === 'stream').length || 0,
        admins: 0, // TODO: Implement
        support: 0, // TODO: Implement
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      
      // Use the new adminService.searchUsers method
      const result = await adminService.searchUsers(searchQuery);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to search users');
        return;
      }

      setSearchResults(result.users || []);
    } catch (error) {
      console.error('Error in handleSearchUsers:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setShowUserSearchModal(false);
    setShowActionModal(true);
  };

  const handleApplyAction = async () => {
    if (!selectedUser || !user) {
      Alert.alert('Error', 'No user selected');
      return;
    }

    if (!actionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for this action');
      return;
    }

    try {
      // Calculate expiration time for timeout
      let expiresAt = null;
      if (actionType === 'timeout') {
        const now = new Date();
        now.setMinutes(now.getMinutes() + timeoutDuration);
        expiresAt = now.toISOString();
      }

      // Insert moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          target_user_id: selectedUser.id,
          action_type: actionType,
          reason: actionReason,
          note: actionNote || null,
          duration_minutes: actionType === 'timeout' ? timeoutDuration : null,
          issued_by_admin_id: user.id,
          expires_at: expiresAt,
          is_active: true,
        });

      if (actionError) {
        console.error('Error applying action:', actionError);
        Alert.alert('Error', 'Failed to apply action');
        return;
      }

      // Create notification for the user
      const notificationMessage = getNotificationMessage(actionType, actionReason, timeoutDuration);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          type: actionType === 'warning' ? 'warning' : 'admin_announcement',
          message: notificationMessage,
          category: 'safety',
          read: false,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      Alert.alert('Success', `Action applied to ${selectedUser.username}`);
      setShowActionModal(false);
      setSelectedUser(null);
      setActionReason('');
      setActionNote('');
      setTimeoutDuration(60);
    } catch (error) {
      console.error('Error in handleApplyAction:', error);
      Alert.alert('Error', 'Failed to apply action');
    }
  };

  const getNotificationMessage = (type: string, reason: string, duration?: number) => {
    switch (type) {
      case 'warning':
        return `⚠️ Warning: ${reason}`;
      case 'timeout':
        return `⏱️ Timeout (${duration} minutes): ${reason}`;
      case 'ban':
        return `🚫 Temporary Ban: ${reason}`;
      case 'permanent_ban':
        return `🚫 Permanent Ban: ${reason}`;
      default:
        return reason;
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
      // Insert announcement
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

      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .limit(10000);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        Alert.alert('Error', 'Failed to fetch users');
        return;
      }

      // Create notifications for all users
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
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Platform Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="person.3.fill"
                android_material_icon_name="group"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={28}
                color="#00C853"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={28}
                color="#DC143C"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.bannedUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Banned</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={28}
                color="#FFA500"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.timedOutUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Timed Out</Text>
            </View>
          </View>
        </View>

        {/* User Search & Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔍 User Search & Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowUserSearchModal(true)}
          >
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Search Users</Text>
          </TouchableOpacity>
          
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Search by username, display name, email, or user ID
          </Text>
        </View>

        {/* Reports Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚨 Reports</Text>
          
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
        </View>

        {/* Admin Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 Admin & Support</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Admins:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.admins}</Text>
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
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Roles & Users</Text>
          </TouchableOpacity>
        </View>

        {/* Global Actions */}
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

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/SafetyCommunityRulesScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View Global Rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminStrikesScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color="#FFA500"
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View & Remove Warnings</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Search Users</Text>
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
                    onPress={() => handleSelectUser(result)}
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

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Apply Action to {selectedUser?.username}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Action Type</Text>
              <View style={styles.actionTypeContainer}>
                {(['warning', 'timeout', 'ban', 'permanent_ban'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.actionTypeButton,
                      { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                      actionType === type && { borderColor: colors.brandPrimary, borderWidth: 2 },
                    ]}
                    onPress={() => setActionType(type)}
                  >
                    <Text style={[styles.actionTypeText, { color: colors.text }]}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {actionType === 'timeout' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                    placeholder="60"
                    placeholderTextColor={colors.textSecondary}
                    value={timeoutDuration.toString()}
                    onChangeText={(text) => setTimeoutDuration(parseInt(text) || 60)}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Reason (Required)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter reason for this action..."
                placeholderTextColor={colors.textSecondary}
                value={actionReason}
                onChangeText={setActionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text }]}>Note (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Additional notes..."
                placeholderTextColor={colors.textSecondary}
                value={actionNote}
                onChangeText={setActionNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.applyButtonContainer}>
                  <GradientButton title="Apply Action" onPress={handleApplyAction} />
                </View>
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
    color: '#000000',
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
  applyButtonContainer: {
    flex: 1,
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
  actionTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
