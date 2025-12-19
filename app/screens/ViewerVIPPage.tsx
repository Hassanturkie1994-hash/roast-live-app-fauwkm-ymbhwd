
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

export default function ViewerVIPPage() {
  const { user } = useAuth();
  const [vipData, setVipData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadVIPData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const memberships = await unifiedVIPClubService.getUserVIPMemberships(user.id);
      setVipData(memberships);
    } catch (error) {
      console.error('Error loading VIP data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadVIPData();
  }, [loadVIPData]);

  const handleJoinVIPClub = async (clubId: string) => {
    if (!user) return;

    Alert.alert(
      'Join VIP Club',
      'Are you sure you want to join this VIP club?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              const result = await unifiedVIPClubService.joinVIPClub(clubId, user.id);
              if (result.success) {
                Alert.alert('Success', 'You have joined the VIP club!');
                await loadVIPData();
              } else {
                Alert.alert('Error', result.error || 'Failed to join VIP club');
              }
            } catch (error) {
              console.error('Error joining VIP club:', error);
              Alert.alert('Error', 'Failed to join VIP club');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading VIP data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIP Memberships</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {vipData && vipData.length > 0 ? (
          vipData.map((membership: any, index: number) => (
            <View key={index} style={styles.membershipCard}>
              <Text style={styles.clubName}>{membership.club_name}</Text>
              <Text style={styles.vipLevel}>Level {membership.vip_level}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="crown.fill"
              android_material_icon_name="workspace_premium"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No VIP Memberships</Text>
            <Text style={styles.emptyDescription}>
              Join a creator&apos;s VIP club to get exclusive perks!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  membershipCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  vipLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
