
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
import GradientButton from '@/components/GradientButton';
import { supabase } from '@/app/integrations/supabase/client';

interface UserWithRole {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AdminRole | null;
  assigned_at: string | null;
}

export default function RoleManagementScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  // Add user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminRole | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const checkAccess = useCallback(async () => {
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

    await fetchUsers();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const fetchUsers = async () => {
    try {
      // Fetch all users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .order('username', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch all admin roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('admin_roles')
        .select('user_id, role, assigned_at');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRole[] = profilesData.map((profile) => {
        const roleData = rolesData?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          role: roleData?.role as AdminRole | null,
          assigned_at: roleData?.assigned_at || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !user) {
      Alert.alert('Error', 'Please select a user and role');
      return;
    }

    try {
      const result = await adminService.assignAdminRole(
        selectedUser.id,
        selectedRole,
        user.id
      );

      if (result.success) {
        Alert.alert('Success', `${selectedRole} role assigned to ${selectedUser.username}`);
        setShowAssignRoleModal(false);
        setSelectedUser(null);
        setSelectedRole(null);
        await fetchUsers();
      } else {
        Alert.alert('Error', result.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      Alert.alert('Error', 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Role',
      `Are you sure you want to remove the admin role from ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.removeAdminRole(userId, user.id);
            if (result.success) {
              Alert.alert('Success', 'Role removed successfully');
              await fetchUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove role');
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserDisplayName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newUserPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsCreatingUser(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: newUserEmail.split('@')[0],
          display_name: newUserDisplayName,
        });

      if (profileError) throw profileError;

      // Assign role if selected
      if (newUserRole && user) {
        await adminService.assignAdminRole(authData.user.id, newUserRole, user.id);
      }

      Alert.alert('Success', 'User created successfully');
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setNewUserRole(null);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: AdminRole | null) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return '#FFD700';
      case 'ADMIN':
        return '#FF1493';
      case 'SUPPORT':
        return '#00C853';
      case 'MODERATOR':
        return '#2196F3';
      default:
        return colors.textSecondary;
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Role Management</Text>
        <TouchableOpacity onPress={() => setShowAddUserModal(true)} style={styles.addButton}>
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {users.filter((u) => u.role === 'HEAD_ADMIN').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Head Admins</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {users.filter((u) => u.role === 'ADMIN').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Admins</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {users.filter((u) => u.role === 'SUPPORT').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Support</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {users.filter((u) => u.role === 'MODERATOR').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moderators</Text>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.map((userItem, index) => (
          <View
            key={index}
            style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.backgroundAlt }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {userItem.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>{userItem.username}</Text>
                {userItem.display_name && (
                  <Text style={[styles.userDisplayName, { color: colors.textSecondary }]}>
                    {userItem.display_name}
                  </Text>
                )}
                {userItem.role && (
                  <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(userItem.role) }]}>
                    <Text style={styles.roleBadgeText}>{userItem.role}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.userActions}>
              {userItem.role ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => handleRemoveRole(userItem.id, userItem.username)}
                >
                  <IconSymbol
                    ios_icon_name="minus.circle"
                    android_material_icon_name="remove_circle"
                    size={18}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedUser(userItem);
                    setShowAssignRoleModal(true);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="plus.circle"
                    android_material_icon_name="add_circle"
                    size={18}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Assign Role</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Assign Role Modal */}
      <Modal
        visible={showAssignRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Role</Text>
              <TouchableOpacity onPress={() => setShowAssignRoleModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedUser && (
                <View style={styles.selectedUserInfo}>
                  <Text style={[styles.label, { color: colors.text }]}>User:</Text>
                  <Text style={[styles.selectedUserName, { color: colors.text }]}>
                    {selectedUser.username}
                  </Text>
                </View>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Select Role:</Text>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  selectedRole === 'HEAD_ADMIN' && { borderColor: '#FFD700', borderWidth: 2 },
                ]}
                onPress={() => setSelectedRole('HEAD_ADMIN')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.roleOptionBadgeText}>HEAD ADMIN</Text>
                </View>
                <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                  Full platform control
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  selectedRole === 'ADMIN' && { borderColor: '#FF1493', borderWidth: 2 },
                ]}
                onPress={() => setSelectedRole('ADMIN')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#FF1493' }]}>
                  <Text style={styles.roleOptionBadgeText}>ADMIN</Text>
                </View>
                <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                  Manage reports & users
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  selectedRole === 'SUPPORT' && { borderColor: '#00C853', borderWidth: 2 },
                ]}
                onPress={() => setSelectedRole('SUPPORT')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#00C853' }]}>
                  <Text style={styles.roleOptionBadgeText}>SUPPORT</Text>
                </View>
                <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                  Review appeals & tickets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  selectedRole === 'MODERATOR' && { borderColor: '#2196F3', borderWidth: 2 },
                ]}
                onPress={() => setSelectedRole('MODERATOR')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#2196F3' }]}>
                  <Text style={styles.roleOptionBadgeText}>MODERATOR</Text>
                </View>
                <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                  Stream moderation tools
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => {
                    setShowAssignRoleModal(false);
                    setSelectedUser(null);
                    setSelectedRole(null);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.assignButtonContainer}>
                  <GradientButton
                    title="Assign Role"
                    onPress={handleAssignRole}
                    disabled={!selectedRole}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="user@example.com"
                placeholderTextColor={colors.textSecondary}
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.textSecondary}
                value={newUserPassword}
                onChangeText={setNewUserPassword}
                secureTextEntry
              />

              <Text style={[styles.label, { color: colors.text }]}>Display Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={newUserDisplayName}
                onChangeText={setNewUserDisplayName}
              />

              <Text style={[styles.label, { color: colors.text }]}>Assign Role (Optional)</Text>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  newUserRole === 'HEAD_ADMIN' && { borderColor: '#FFD700', borderWidth: 2 },
                ]}
                onPress={() => setNewUserRole(newUserRole === 'HEAD_ADMIN' ? null : 'HEAD_ADMIN')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.roleOptionBadgeText}>HEAD ADMIN</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  newUserRole === 'ADMIN' && { borderColor: '#FF1493', borderWidth: 2 },
                ]}
                onPress={() => setNewUserRole(newUserRole === 'ADMIN' ? null : 'ADMIN')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#FF1493' }]}>
                  <Text style={styles.roleOptionBadgeText}>ADMIN</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  newUserRole === 'SUPPORT' && { borderColor: '#00C853', borderWidth: 2 },
                ]}
                onPress={() => setNewUserRole(newUserRole === 'SUPPORT' ? null : 'SUPPORT')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#00C853' }]}>
                  <Text style={styles.roleOptionBadgeText}>SUPPORT</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                  newUserRole === 'MODERATOR' && { borderColor: '#2196F3', borderWidth: 2 },
                ]}
                onPress={() => setNewUserRole(newUserRole === 'MODERATOR' ? null : 'MODERATOR')}
              >
                <View style={[styles.roleOptionBadge, { backgroundColor: '#2196F3' }]}>
                  <Text style={styles.roleOptionBadgeText}>MODERATOR</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => {
                    setShowAddUserModal(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserDisplayName('');
                    setNewUserRole(null);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.assignButtonContainer}>
                  <GradientButton
                    title={isCreatingUser ? 'Creating...' : 'Create User'}
                    onPress={handleCreateUser}
                    disabled={isCreatingUser}
                  />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userDisplayName: {
    fontSize: 14,
    fontWeight: '400',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  userActions: {
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  selectedUserInfo: {
    marginBottom: 16,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  roleOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleOptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleOptionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  roleOptionDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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
  assignButtonContainer: {
    flex: 1,
  },
});