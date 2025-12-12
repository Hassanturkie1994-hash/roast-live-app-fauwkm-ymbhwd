
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingItem({ icon, iconColor, title, subtitle, onPress, showChevron = true }: SettingItemProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, iconColor && { backgroundColor: iconColor }]}>
          <IconSymbol 
            ios_icon_name={icon} 
            android_material_icon_name={icon} 
            size={20} 
            color={iconColor ? '#fff' : theme.colors.text} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: '#666' }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showChevron && (
        <IconSymbol 
          ios_icon_name="chevron.right" 
          android_material_icon_name="chevron_right" 
          size={20} 
          color="#666" 
        />
      )}
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  icon: string;
  title: string;
  iconColor?: string;
}

function SettingSection({ icon, title, iconColor }: SettingSectionProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconContainer, iconColor && { backgroundColor: iconColor }]}>
        <IconSymbol 
          ios_icon_name={icon} 
          android_material_icon_name={icon} 
          size={20} 
          color={iconColor ? '#fff' : theme.colors.text} 
        />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection icon="apps" title="Dashboard & Tools" iconColor="#666" />
        <SettingItem 
          icon="dashboard" 
          iconColor="#8B0000"
          title="Head Admin Dashboard" 
          subtitle="Full Platform Control"
          onPress={() => console.log('Navigate to admin dashboard')}
        />

        <SettingSection icon="settings" title="General" iconColor="#4A90E2" />
        <SettingItem 
          icon="palette" 
          title="Appearance" 
          onPress={() => router.push('/screens/AppearanceSettingsScreen' as any)}
        />
        <SettingItem 
          icon="person" 
          title="Profile Settings" 
          onPress={() => router.push('/screens/AccountSettingsScreen' as any)}
        />
        <SettingItem 
          icon="notifications" 
          iconColor="#FF3B30" 
          title="Notifications" 
          onPress={() => router.push('/screens/NotificationSettingsScreen' as any)}
        />
        <SettingItem 
          icon="bookmark" 
          title="Saved Streams" 
          onPress={() => router.push('/screens/SavedStreamsScreen' as any)}
        />
        <SettingItem 
          icon="star" 
          iconColor="#FFD700" 
          title="Achievements" 
          onPress={() => router.push('/screens/AchievementsScreen' as any)}
        />

        <SettingSection icon="lock" title="Account & Security" iconColor="#FFA500" />
        <SettingItem 
          icon="shield" 
          title="Account Security" 
          onPress={() => router.push('/screens/AccountSecurityScreen' as any)}
        />
        <SettingItem 
          icon="lock" 
          title="Change Password" 
          onPress={() => router.push('/screens/ChangePasswordScreen' as any)}
        />
        <SettingItem 
          icon="block" 
          iconColor="#FF3B30" 
          title="Blocked Users" 
          onPress={() => router.push('/screens/BlockedUsersScreen' as any)}
        />

        <SettingSection icon="videocam" title="Streaming" iconColor="#666" />
        <SettingItem 
          icon="dashboard" 
          iconColor="#8B0000"
          title="Stream Dashboard" 
          subtitle="Manage VIP Club, Moderators & More"
          onPress={() => console.log('Navigate to stream dashboard')}
        />

        <SettingSection icon="account-balance-wallet" title="Wallet & Gifts" iconColor="#FFD700" />
        <SettingItem 
          icon="card-membership" 
          iconColor="#FFD700"
          title="PREMIUM Membership" 
          subtitle="Unlock Exclusive Benefits – 89 SEK/Mo"
          onPress={() => router.push('/screens/PremiumMembershipScreen' as any)}
        />
        <SettingItem 
          icon="account-balance-wallet" 
          title="Saldo" 
          onPress={() => router.push('/screens/WalletScreen' as any)}
        />
        <SettingItem 
          icon="card-giftcard" 
          title="Gift Information" 
          onPress={() => router.push('/screens/GiftInformationScreen' as any)}
        />
        <SettingItem 
          icon="subscriptions" 
          title="Manage Subscriptions" 
          onPress={() => router.push('/screens/ManageSubscriptionsScreen' as any)}
        />
        <SettingItem 
          icon="download" 
          title="Withdraw Earnings" 
          onPress={() => router.push('/screens/WithdrawScreen' as any)}
        />
        <SettingItem 
          icon="history" 
          title="Transaction History" 
          onPress={() => router.push('/screens/TransactionHistoryScreen' as any)}
        />

        <SettingSection icon="shield" title="Safety & Rules" iconColor="#4A90E2" />
        <SettingItem 
          icon="gavel" 
          title="Safety & Community Rules" 
          onPress={() => router.push('/screens/SafetyCommunityRulesScreen' as any)}
        />
        <SettingItem 
          icon="description" 
          title="Appeals & Violations" 
          onPress={() => router.push('/screens/AppealsCenterScreen' as any)}
        />
        <SettingItem 
          icon="description" 
          title="Terms of Service" 
          onPress={() => router.push('/screens/TermsOfServiceScreen' as any)}
        />
        <SettingItem 
          icon="privacy-tip" 
          title="Privacy Policy" 
          onPress={() => router.push('/screens/PrivacyPolicyScreen' as any)}
        />

        <SettingSection icon="person" title="Profile Preferences" iconColor="#4A90E2" />
        <SettingItem icon="lock" title="Private Profile" showChevron={false} />
        <SettingItem 
          icon="comment" 
          title="Who Can Comment" 
          subtitle="Everyone"
        />

        <TouchableOpacity style={styles.logoutButton}>
          <IconSymbol ios_icon_name="arrow.right.square" android_material_icon_name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    flex: 1,
  },
});
