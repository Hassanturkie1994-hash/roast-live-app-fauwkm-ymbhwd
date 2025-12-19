
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';

export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

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
        { label: 'Seasons & Rankings', icon: 'roast-badge', route: '/screens/SeasonsRankingsScreen' },
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
