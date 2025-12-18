
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
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService, VIPClubMember, VIPClub } from '@/app/services/unifiedVIPClubService';
import VIPBenefitsPreview from '@/components/VIPBenefitsPreview';

/**
 * ViewerVIPPage Screen
 * 
 * Shows viewer's VIP status for a specific creator's club:
 * - VIP level (1-20)
 * - Benefits unlocked
 * - Progress to next level
 * - Loyalty streak
 * - Total gifted amount
 * - Join date
 */
export default function ViewerVIPPage() {
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const { user } = useAuth();
  const [club, setClub] = useState<VIPClub | null>(null);
  const [membership, setMembership] = useState<VIPClubMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sekToNextLevel, setSekToNextLevel] = useState(0);

  const loadVIPData = useCallback(async () => {
    if (!user || !creatorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const clubData = await unifiedVIPClubService.getVIPClubByCreator(creatorId);
      setClub(clubData);

      if (clubData) {
        const memberData = await unifiedVIPClubService.getVIPMemberDetails(clubData.id, user.id);
        setMembership(memberData);

        if (memberData) {
          const sekNeeded = unifiedVIPClubService.calculateSEKForNextLevel(
            memberData.vip_level,
            memberData.total_gifted_sek
          );
          setSekToNextLevel(sekNeeded);
        }
      }
    } catch (error) {
      console.error('Error loading VIP data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, user]);

  useEffect(() => {
    loadVIPData();
  }, [loadVIPData]);

  const calculateLoyaltyStreak = (): number => {
    if (!membership) return 0;
    const joined = new Date(membership.joined_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = (): number => {
    if (!membership || membership.vip_level >= 20) return 100;
    
    const currentLevelBase = ((membership.vip_level - 1) * 25000) / 19;
    const nextLevelBase = (membership.vip_level * 25000) / 19;
    const levelRange = nextLevelBase - currentLevelBase;
    const currentProgress = membership.total_gifted_sek - currentLevelBase;
    
    return Math.min(100, Math.max(0, (currentProgress / levelRange) * 100));
  };

  const getVIPLevelColor = (level: number): string => {
    if (level >= 15) return '#FF1493';
    if (level >= 10) return '#9B59B6';
    if (level >= 5) return '#3498DB';
    return '#FFD700';
  };

  const getVIPLevelLabel = (level: number): string => {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading your VIP status...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.errorTitle}>No VIP Club</Text>
        <Text style={styles.errorDescription}>
          This creator hasn&apos;t created a VIP Club yet
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!membership) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol
          ios_icon_name="star.slash.fill"
          android_material_icon_name="star_border"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.errorTitle}>Not a VIP Member</Text>
        <Text style={styles.errorDescription}>
          You&apos;re not a member of {club.club_name} yet
        </Text>
        <View style={styles.joinInfo}>
          <Text style={styles.joinInfoText}>
            Join for {club.monthly_price_sek} kr/month or gift {club.min_gift_threshold_sek || 1000} kr to unlock VIP status
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const loyaltyStreak = calculateLoyaltyStreak();
  const progressPercentage = getProgressPercentage();
  const levelColor = getVIPLevelColor(membership.vip_level);
  const levelLabel = getVIPLevelLabel(membership.vip_level);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your VIP Status</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.clubBanner, { backgroundColor: club.badge_color }]}>
        <IconSymbol
          ios_icon_name="crown.fill"
          android_material_icon_name="workspace_premium"
          size={48}
          color="#FFFFFF"
        />
        <Text style={styles.clubName}>{club.club_name}</Text>
        <Text style={styles.clubBadgeName}>{club.badge_name}</Text>
      </View>

      <View style={[styles.levelCard, { borderColor: levelColor }]}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelLabel}>VIP Level</Text>
          <View style={[styles.levelTierBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.levelTierText}>{levelLabel}</Text>
          </View>
        </View>
        <Text style={[styles.levelNumber, { color: levelColor }]}>
          {membership.vip_level}
        </Text>
        <Text style={styles.levelSubtext}>
          {membership.vip_level >= 20 ? 'MAX LEVEL' : `Next level: ${membership.vip_level + 1}`}
        </Text>
      </View>

      {membership.vip_level < 20 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress to Level {membership.vip_level + 1}</Text>
            <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%`, backgroundColor: levelColor },
                ]}
              />
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Total Gifted</Text>
              <Text style={styles.progressStatValue}>
                {membership.total_gifted_sek.toLocaleString()} kr
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Need</Text>
              <Text style={styles.progressStatValue}>
                {sekToNextLevel.toLocaleString()} kr more
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <IconSymbol
            ios_icon_name="flame.fill"
            android_material_icon_name="local_fire_department"
            size={32}
            color={colors.brandPrimary}
          />
          <Text style={styles.statValue}>{loyaltyStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol
            ios_icon_name="calendar.fill"
            android_material_icon_name="event"
            size={32}
            color="#3498DB"
          />
          <Text style={styles.statValue}>
            {membership.months_subscribed || 0}
          </Text>
          <Text style={styles.statLabel}>Months</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol
            ios_icon_name="trophy.fill"
            android_material_icon_name="emoji_events"
            size={32}
            color="#FFD700"
          />
          <Text style={styles.statValue}>
            {membership.battles_participated || 0}
          </Text>
          <Text style={styles.statLabel}>Battles</Text>
        </View>
      </View>

      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Your Benefits</Text>
        <VIPBenefitsPreview currentLevel={membership.vip_level} />
      </View>

      <View style={styles.infoBox}>
        <IconSymbol
          ios_icon_name="shield.checkmark.fill"
          android_material_icon_name="verified_user"
          size={20}
          color={colors.brandPrimary}
        />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>System-Driven VIP</Text>
          <Text style={styles.infoText}>
            Your VIP level is automatically calculated based on your total gifts and subscription duration. 
            The creator cannot manually change your level.
          </Text>
        </View>
      </View>
    </ScrollView>
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
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  placeholder: {
    width: 40,
  },
  clubBanner: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  clubName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  clubBadgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  levelTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelTierText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  levelNumber: {
    fontSize: 64,
    fontWeight: '900',
  },
  levelSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    gap: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.brandPrimary,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    gap: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  errorDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  joinInfo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  joinInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
