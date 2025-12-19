
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

interface VerifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

/**
 * Verified Badge Component
 * 
 * Blue verified badge that appears ONLY after successful identity verification.
 * 
 * Visible on:
 * - Profile page
 * - Live streams
 * - Comments
 * 
 * Can be revoked by:
 * - head_admin
 * - admin
 */
export default function VerifiedBadge({ size = 'medium', showText = true }: VerifiedBadgeProps) {
  const { colors } = useTheme();

  const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 16;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: '#1DA1F2' }]}>
        <IconSymbol
          ios_icon_name="checkmark.seal.fill"
          android_material_icon_name="verified"
          size={iconSize}
          color="#FFFFFF"
        />
        {showText && (
          <Text style={[styles.badgeText, { fontSize }]}>Verified</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
