
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { clubSubscriptionService } from '@/app/services/clubSubscriptionService';

interface VIPClubBadgeProps {
  creatorId: string;
  viewerId: string;
  size?: 'small' | 'medium' | 'large';
}

export default function VIPClubBadge({ creatorId, viewerId, size = 'medium' }: VIPClubBadgeProps) {
  const { colors } = useTheme();
  const [badgeData, setBadgeData] = useState<{
    badgeText: string;
    badgeColor: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBadgeData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if user is a club member
      const isMember = await clubSubscriptionService.isClubMember(creatorId, viewerId);
      
      if (!isMember) {
        setBadgeData(null);
        return;
      }

      // Get club details from fan_clubs table
      const { data: clubData, error } = await import('@/app/integrations/supabase/client').then(
        (mod) =>
          mod.supabase
            .from('fan_clubs')
            .select('club_name, badge_color')
            .eq('streamer_id', creatorId)
            .single()
      );

      if (error || !clubData) {
        setBadgeData(null);
        return;
      }

      setBadgeData({
        badgeText: clubData.club_name,
        badgeColor: clubData.badge_color,
      });
    } catch (error) {
      console.error('Error fetching VIP badge data:', error);
      setBadgeData(null);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, viewerId]);

  useEffect(() => {
    fetchBadgeData();
  }, [fetchBadgeData]);

  if (isLoading || !badgeData) {
    return null;
  }

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 9,
      iconSize: 10,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 11,
      iconSize: 12,
    },
    large: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 13,
      iconSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeData.badgeColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <IconSymbol
        ios_icon_name="heart.fill"
        android_material_icon_name="favorite"
        size={currentSize.iconSize}
        color="#FFFFFF"
      />
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: currentSize.fontSize,
            color: colors.theme === 'dark' ? '#FFFFFF' : '#000000',
          },
        ]}
      >
        {badgeData.badgeText.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});