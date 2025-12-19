
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, AdminRole } from '@/app/services/adminService';
import GradientButton from '@/components/GradientButton';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ROLE MANAGEMENT SCREEN
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ONLY accessible by HEAD_ADMIN.
 * 
 * Allows assigning platform roles:
 * - HEAD_ADMIN (highest authority)
 * - ADMIN (under head_admin)
 * - MODERATOR (under admin)
 * - SUPPORT (under moderator)
 * 
 * Stream-level moderators are managed separately by creators.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function RoleManagementScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('ADMIN');
  const [assigning, setAssigning] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const result = await adminService.checkAdminRole(user.id);
      setHasAccess(result.role === 'HEAD_ADMIN');
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleAssignRole = async () => {
    if (!user || !searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    setAssigning(true);
    try {
      const result = await adminService.updateUserRole(searchQuery.trim(), selectedRole || 'USER');
      
      if (result.success) {
        Alert.alert('Success', `Role ${selectedRole} assigned successfully`);
        setSearchQuery('');
      } else {
        Alert.alert('Error', result.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      Alert.alert('Error', 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="lock.fill"
          android_material_icon_name="lock"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={[styles.accessDeniedText, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.accessDeniedSubtext, { color: colors.textSecondary }]}>
          Only HEAD_ADMIN can manage roles
        </Text>
        <TouchableOpacity
          style={[styles.backButtonLarge, { backgroundColor: colors.brandPrimary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Assign Staff Role</Text>

          <View style={[styles.infoBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Role hierarchy:{'\n'}
              HEAD_ADMIN → ADMIN → MODERATOR → SUPPORT{'\n\n'}
              Stream moderators are managed by creators separately.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>User ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter user ID..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Role</Text>
            <View style={styles.roleButtons}>
              {(['HEAD_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'] as AdminRole[]).map((role) => (
                <TouchableOpacity
                  key={`role-${role}`}
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: selectedRole === role ? colors.brandPrimary : colors.backgroundAlt,
                      borderColor: selectedRole === role ? colors.brandPrimary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedRole(role)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      { color: selectedRole === role ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {role.replace('_', ' ')}
                  </Text>
                  <Text
                    style={[
                      styles.roleButtonDescription,
                      { color: selectedRole === role ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
                    ]}
                  >
                    {getRoleDescription(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <GradientButton
            title={assigning ? 'Assigning...' : 'Assign Role'}
            onPress={handleAssignRole}
            size="large"
            disabled={!searchQuery.trim() || assigning}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'HEAD_ADMIN':
      return 'Full platform control';
    case 'ADMIN':
      return 'Manage reports & users';
    case 'MODERATOR':
      return 'Monitor all live streams';
    case 'SUPPORT':
      return 'Review appeals & reports';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  roleButtons: {
    gap: 12,
  },
  roleButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleButtonDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  backButtonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
