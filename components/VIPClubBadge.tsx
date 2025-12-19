
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface VIPClubBadgeProps {
  userId: string;
  clubId: string;
}

export default function VIPClubBadge({ userId, clubId }: VIPClubBadgeProps) {
  const [badgeData, setBadgeData] = useState<any>(null);

  const fetchBadgeData = useCallback(async () => {
    try {
      console.log('Fetching VIP badge data for user:', userId);
      setBadgeData({ level: 5, badgeName: 'VIP', color: '#FFD700' });
    } catch (error) {
      console.error('Error fetching badge data:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchBadgeData();
  }, [fetchBadgeData]);

  if (!badgeData) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: badgeData.color }]}>
      <Text style={styles.text}>{badgeData.badgeName}</Text>
      <Text style={styles.level}>L{badgeData.level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  level: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
