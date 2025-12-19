
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { adminService } from '@/app/services/adminService';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ACCOUNT SETTINGS SCREEN
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * STRICT DASHBOARD VISIBILITY RULES:
 * 
 * HEAD_ADMIN:
 *   - Head Admin Dashboard ONLY (aggregates all features)
 * 
 * ADMIN:
 *   - Admin Dashboard ONLY
 * 
 * MODERATOR:
 *   - Moderator Dashboard ONLY (platform-level, monitors all streams)
 * 
 * SUPPORT:
 *   - Support Dashboard ONLY
 * 
 * Stream Moderator (assigned to creators):
 *   - NO dashboards (only stream-level moderation)
 * 
 * Regular Users:
 *   - NO dashboards
 * 
 * NO ROLE STACKING - Each role sees ONLY their designated dashboard.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const checkUserRole = useCallback(async () => {
    if (!user) {
      setLoadingRole(false);
      return;
    }

    try {
      console.log('🔍 Checking user role for:', user.id);
      
      // Check platform role
      const result = await adminService.checkAdminRole(user.id);
      console.log('✅ User role:', result.role);
      
      setUserRole(result.role);
    } catch (error) {
      console.error('❌ Error checking user role:', error);
    } finally {
      setLoadingRole(false);
    }
  }, [user]);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Account Security', icon: 'shield', route: '/screens/AccountSecurityScreen' },
        { label: 'Privacy Settings', icon: 'privacy', route: '/screens/PrivacySettingsScreen' },
        { label: 'Notification Settings', icon: 'shockwave-bell', route: '/screens/NotificationSettingsScreen' },
        { label: 'Appearance', icon: 'heated-gear', route: '/screens/AppearanceSettingsScreen' },
      ],
    },
    {
      title: 'Creator Tools',
      items: [
        { label: 'Stream Dashboard', icon: 'stream-dashboard', route: '/screens/StreamDashboardScreen' },
        { label: 'Gifts & Effects', icon: 'roast-gift-box', route: '/screens/GiftInformationScreen' },
        { label: 'Battle History', icon: 'flame', route: '/screens/BattleHistoryScreen' },
        { label: 'Earnings & Payouts', icon: 'lava-wallet', route: '/screens/CreatorEarningsScreen' },
      ],
    },
    {
      title: 'Wallet & Transactions',
      items: [
        { label: 'Wallet', icon: 'lava-wallet', route: '/screens/WalletScreen' },
        { label: 'Transaction History', icon: 'history', route: '/screens/TransactionHistoryScreen' },
        { label: 'Manage Subscriptions', icon: 'premium-star-flame', route: '/screens/ManageSubscriptionsScreen' },
      ],
    },
    {
      title: 'Community',
      items: [
        { label: 'Blocked Users', icon: 'shield-flame', route: '/screens/BlockedUsersScreen' },
        { label: 'Safety & Community Rules', icon: 'shield', route: '/screens/SafetyCommunityRulesScreen' },
        { label: 'Appeals & Violations', icon: 'warning', route: '/screens/AppealsViolationsScreen' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Privacy Policy', icon: 'privacy', route: '/screens/PrivacyPolicyScreen' },
        { label: 'Terms of Service', icon: 'terms', route: '/screens/TermsOfServiceScreen' },
      ],
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ROLE-BASED DASHBOARD VISIBILITY (STRICT)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            Each role sees ONLY their designated dashboard.
            NO role stacking visibility.
            
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {loadingRole ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.brandPrimary} />
          </View>
        ) : (
          <>
            {/* HEAD ADMIN - Shows ONLY Head Admin Dashboard */}
            {userRole === 'HEAD_ADMIN' && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Staff Dashboard</Text>
                
                <TouchableOpacity
                  style={[styles.dashboardItem, { backgroundColor: colors.card, borderColor: '#FFD700' }]}
                  onPress={() => router.push('/screens/HeadAdminDashboardScreen' as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.dashboardIcon, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                      <UnifiedRoastIcon name="crown" size={24} color="#FFD700" />
                    </View>
                    <View style={styles.dashboardInfo}>
                      <Text style={[styles.dashboardLabel, { color: colors.text }]}>Head Admin Dashboard</Text>
                      <Text style={[styles.dashboardDescription, { color: colors.textSecondary }]}>
                        Full platform control & oversight
                      </Text>
                    </View>
                  </View>
                  <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* ADMIN - Shows ONLY Admin Dashboard */}
            {userRole === 'ADMIN' && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Staff Dashboard</Text>
                
                <TouchableOpacity
                  style={[styles.dashboardItem, { backgroundColor: colors.card, borderColor: colors.brandPrimary }]}
                  onPress={() => router.push('/screens/AdminDashboardScreen' as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.dashboardIcon, { backgroundColor: 'rgba(164, 0, 40, 0.1)' }]}>
                      <UnifiedRoastIcon name="shield-flame" size={24} color={colors.brandPrimary} />
                    </View>
                    <View style={styles.dashboardInfo}>
                      <Text style={[styles.dashboardLabel, { color: colors.text }]}>Admin Dashboard</Text>
                      <Text style={[styles.dashboardDescription, { color: colors.textSecondary }]}>
                        Manage reports, users & bans
                      </Text>
                    </View>
                  </View>
                  <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* MODERATOR - Shows ONLY Moderator Dashboard (platform-level) */}
            {userRole === 'MODERATOR' && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Staff Dashboard</Text>
                
                <TouchableOpacity
                  style={[styles.dashboardItem, { backgroundColor: colors.card, borderColor: '#9B59B6' }]}
                  onPress={() => router.push('/screens/LiveModeratorDashboardScreen' as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.dashboardIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                      <UnifiedRoastIcon name="shield" size={24} color="#9B59B6" />
                    </View>
                    <View style={styles.dashboardInfo}>
                      <Text style={[styles.dashboardLabel, { color: colors.text }]}>Moderator Dashboard</Text>
                      <Text style={[styles.dashboardDescription, { color: colors.textSecondary }]}>
                        Monitor all live streams
                      </Text>
                    </View>
                  </View>
                  <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* SUPPORT - Shows ONLY Support Dashboard */}
            {userRole === 'SUPPORT' && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Staff Dashboard</Text>
                
                <TouchableOpacity
                  style={[styles.dashboardItem, { backgroundColor: colors.card, borderColor: '#4ECDC4' }]}
                  onPress={() => router.push('/screens/SupportDashboardScreen' as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.dashboardIcon, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
                      <UnifiedRoastIcon name="shield" size={24} color="#4ECDC4" />
                    </View>
                    <View style={styles.dashboardInfo}>
                      <Text style={[styles.dashboardLabel, { color: colors.text }]}>Support Dashboard</Text>
                      <Text style={[styles.dashboardDescription, { color: colors.textSecondary }]}>
                        Review appeals & reports
                      </Text>
                    </View>
                  </View>
                  <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Stream Moderators and Regular Users - NO dashboards */}
          </>
        )}

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <UnifiedRoastIcon name={item.icon as any} size={24} color={colors.text} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                <UnifiedRoastIcon name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.brandPrimary }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <UnifiedRoastIcon name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dashboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  dashboardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardInfo: {
    flex: 1,
    gap: 4,
  },
  dashboardLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dashboardDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
