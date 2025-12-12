
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
          ios_icon_name="questionmark.circle" 
          android_material_icon_name="help" 
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard & Tools */}
        <SettingSection icon="apps" title="Dashboard & Tools" iconColor="#666" />
        <SettingItem 
          icon="dashboard" 
          iconColor="#8B0000"
          title="Head Admin Dashboard" 
          subtitle="Full Platform Control"
        />

        {/* General */}
        <SettingSection icon="settings" title="General" iconColor="#4A90E2" />
        <SettingItem icon="palette" title="Appearance" />
        <SettingItem icon="person" title="Profile Settings" />
        <SettingItem icon="notifications" iconColor="#FF3B30" title="Notifications" />
        <SettingItem icon="bookmark" title="Saved Streams" />
        <SettingItem icon="star" iconColor="#FFD700" title="Achievements" />

        {/* Account & Security */}
        <SettingSection icon="lock" title="Account & Security" iconColor="#FFA500" />
        <SettingItem icon="shield" title="Account Security" />
        <SettingItem icon="lock" title="Change Password" />
        <SettingItem icon="block" iconColor="#FF3B30" title="Blocked Users" />

        {/* Streaming */}
        <SettingSection icon="videocam" title="Streaming" iconColor="#666" />
        <SettingItem 
          icon="dashboard" 
          iconColor="#8B0000"
          title="Stream Dashboard" 
          subtitle="Manage VIP Club, Moderators & More"
        />

        {/* Wallet & Gifts */}
        <SettingSection icon="account-balance-wallet" title="Wallet & Gifts" iconColor="#FFD700" />
        <SettingItem 
          icon="card-membership" 
          iconColor="#FFD700"
          title="PREMIUM Membership" 
          subtitle="Unlock Exclusive Benefits – 89 SEK/Mo"
        />
        <SettingItem icon="account-balance-wallet" title="Saldo" />
        <SettingItem icon="card-giftcard" title="Gift Information" />
        <SettingItem icon="subscriptions" title="Manage Subscriptions" />
        <SettingItem icon="download" title="Withdraw Earnings" />
        <SettingItem icon="history" title="Transaction History" />

        {/* Safety & Rules */}
        <SettingSection icon="shield" title="Safety & Rules" iconColor="#4A90E2" />
        <SettingItem icon="gavel" title="Safety & Community Rules" />
        <SettingItem icon="description" title="Appeals & Violations" />
        <SettingItem icon="description" title="Terms of Service" />
        <SettingItem icon="privacy-tip" title="Privacy Policy" />

        {/* Profile Preferences */}
        <SettingSection icon="person" title="Profile Preferences" iconColor="#4A90E2" />
        <SettingItem icon="lock" title="Private Profile" showChevron={false} />
        <SettingItem 
          icon="comment" 
          title="Who Can Comment" 
          subtitle="Everyone"
        />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <IconSymbol ios_icon_name="arrow.right.square" android_material_icon_name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
          <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color="#666" />
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
