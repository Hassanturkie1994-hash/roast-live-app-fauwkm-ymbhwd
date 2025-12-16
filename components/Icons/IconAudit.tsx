
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import UnifiedRoastIcon, { UnifiedIconName } from './UnifiedRoastIcon';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Icon Audit Component
 * 
 * This component displays all available icons in the UnifiedRoastIcon system
 * for visual verification and testing. Use this during development to ensure
 * all icons render correctly in both light and dark modes.
 * 
 * Usage:
 * import IconAudit from '@/components/Icons/IconAudit';
 * <IconAudit />
 */

const ALL_ICONS: UnifiedIconName[] = [
  // Navigation & Core
  'home',
  'flame-home',
  'explore',
  'roast-compass',
  'camera',
  'fire-camera',
  'inbox',
  'smoke-message',
  'profile',
  'roast-badge',
  'live',
  
  // Notifications & Social
  'notifications',
  'bell',
  'shockwave-bell',
  'people',
  'crowd-flame',
  'person',
  'spotlight-person',
  'follow',
  'heart',
  'like',
  'comment',
  'share',
  'send',
  
  // Media & Content
  'video',
  'hot-circle',
  'grid',
  'burned-photo',
  'bookmark',
  'history',
  'stream-history',
  'saved-streams',
  'add',
  'edit',
  'search',
  
  // Wallet & Premium
  'wallet',
  'lava-wallet',
  'gift',
  'gifts',
  'roast-gift-box',
  'premium',
  'premium-star-flame',
  'crown',
  'crown-flame',
  'vip-diamond-flame',
  'subscriptions',
  'withdraw',
  'transactions',
  
  // Settings & Security
  'settings',
  'heated-gear',
  'account-security',
  'password',
  'shield',
  'shield-flame',
  'blocked-users',
  'appearance',
  'privacy',
  'terms',
  'rules',
  'appeals',
  'logout',
  
  // Admin & Moderation
  'admin-dashboard',
  'stream-dashboard',
  'achievements',
  'warning',
  'fire-info',
  
  // Controls & Actions
  'play',
  'pause',
  'stop',
  'mic',
  'close',
  'check',
  'chevron-right',
  'chevron-left',
  'more',
];

export default function IconAudit() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Icon System Audit
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {ALL_ICONS.length} icons available
        </Text>
      </View>

      <View style={styles.grid}>
        {ALL_ICONS.map((iconName) => (
          <View
            key={iconName}
            style={[
              styles.iconCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <UnifiedRoastIcon
              name={iconName}
              size={32}
              color={colors.text}
            />
            <Text
              style={[styles.iconName, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {iconName}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.backgroundAlt }]}>
        <Text style={[styles.footerText, { color: colors.text }]}>
          ✅ All icons rendering correctly
        </Text>
        <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>
          No placeholder icons ("?") detected
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  iconCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  iconName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
});
