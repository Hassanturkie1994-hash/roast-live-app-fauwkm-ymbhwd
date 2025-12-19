
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface VIPClubPanelProps {
  creatorId: string;
}

export default function VIPClubPanel({ creatorId }: VIPClubPanelProps) {
  const { user } = useAuth();
  const [myClub, setMyClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMyClub = useCallback(async () => {
    setIsLoading(true);
    try {
      const club = await unifiedVIPClubService.getVIPClub(creatorId);
      setMyClub(club);
    } catch (error) {
      console.error('Error loading VIP club:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    loadMyClub();
  }, [loadMyClub]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (!myClub) {
    return (
      <View style={styles.emptyState}>
        <IconSymbol
          ios_icon_name="crown.fill"
          android_material_icon_name="workspace_premium"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>No VIP Club</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.clubCard}>
        <Text style={styles.clubName}>{myClub.club_name}</Text>
        <Text style={styles.memberCount}>{myClub.total_members} members</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  clubCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
