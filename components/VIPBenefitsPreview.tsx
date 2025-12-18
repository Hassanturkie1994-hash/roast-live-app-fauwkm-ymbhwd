
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface VIPBenefit {
  level: number;
  title: string;
  description: string;
  icon: string;
  iconMaterial: string;
  color: string;
}

interface VIPBenefitsPreviewProps {
  currentLevel: number;
}

/**
 * VIPBenefitsPreview Component
 * 
 * Shows all VIP benefits and which ones are unlocked at each level.
 * Highlights current level and shows progress to next tier.
 * 
 * Benefits are COSMETIC and UX-based only:
 * - Custom chat colors
 * - Exclusive emojis
 * - Priority chat placement
 * - Custom badges
 * - Profile effects
 * - NO monetization advantages
 */
export default function VIPBenefitsPreview({ currentLevel }: VIPBenefitsPreviewProps) {
  const [isLoading] = useState(false);

  const benefits: VIPBenefit[] = [
    {
      level: 1,
      title: 'VIP Badge',
      description: 'Custom VIP badge in chat and profile',
      icon: 'star.fill',
      iconMaterial: 'workspace_premium',
      color: '#FFD700',
    },
    {
      level: 3,
      title: 'Custom Chat Color',
      description: 'Stand out with a unique chat message color',
      icon: 'paintbrush.fill',
      iconMaterial: 'palette',
      color: '#FF69B4',
    },
    {
      level: 5,
      title: 'Exclusive Emojis',
      description: 'Access to VIP-only emoji reactions',
      icon: 'face.smiling.fill',
      iconMaterial: 'emoji_emotions',
      color: '#3498DB',
    },
    {
      level: 7,
      title: 'Priority Chat',
      description: 'Your messages appear higher in chat',
      icon: 'arrow.up.circle.fill',
      iconMaterial: 'arrow_upward',
      color: '#9B59B6',
    },
    {
      level: 10,
      title: 'Animated Badge',
      description: 'Your VIP badge gets a special animation',
      icon: 'sparkles',
      iconMaterial: 'auto_awesome',
      color: '#FF1493',
    },
    {
      level: 12,
      title: 'Custom Name Color',
      description: 'Choose your own username color in chat',
      icon: 'textformat',
      iconMaterial: 'format_color_text',
      color: '#00CED1',
    },
    {
      level: 15,
      title: 'Profile Frame',
      description: 'Exclusive animated profile frame',
      icon: 'square.on.square.fill',
      iconMaterial: 'crop_square',
      color: '#FF4500',
    },
    {
      level: 18,
      title: 'VIP Intro Sound',
      description: 'Custom sound when you join chat',
      icon: 'speaker.wave.3.fill',
      iconMaterial: 'volume_up',
      color: '#32CD32',
    },
    {
      level: 20,
      title: 'Legendary Status',
      description: 'Ultimate VIP status with all perks unlocked',
      icon: 'crown.fill',
      iconMaterial: 'military_tech',
      color: '#FF0000',
    },
  ];

  const renderBenefit = (benefit: VIPBenefit, index: number) => {
    const isUnlocked = currentLevel >= benefit.level;
    const isCurrent = currentLevel === benefit.level;

    return (
      <View
        key={index}
        style={[
          styles.benefitCard,
          isUnlocked && styles.benefitCardUnlocked,
          isCurrent && styles.benefitCardCurrent,
        ]}
      >
        <View style={[styles.benefitIcon, { backgroundColor: benefit.color }]}>
          <IconSymbol
            ios_icon_name={benefit.icon}
            android_material_icon_name={benefit.iconMaterial}
            size={24}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.benefitContent}>
          <View style={styles.benefitHeader}>
            <Text style={[styles.benefitLevel, isUnlocked && styles.benefitLevelUnlocked]}>
              Level {benefit.level}
            </Text>
            {isUnlocked && (
              <View style={styles.unlockedBadge}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={16}
                  color={colors.brandPrimary}
                />
                <Text style={styles.unlockedText}>Unlocked</Text>
              </View>
            )}
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>CURRENT</Text>
              </View>
            )}
          </View>

          <Text style={[styles.benefitTitle, isUnlocked && styles.benefitTitleUnlocked]}>
            {benefit.title}
          </Text>
          <Text style={[styles.benefitDescription, isUnlocked && styles.benefitDescriptionUnlocked]}>
            {benefit.description}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading benefits...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="star.circle.fill"
          android_material_icon_name="workspace_premium"
          size={32}
          color={colors.brandPrimary}
        />
        <Text style={styles.headerTitle}>VIP Benefits</Text>
        <Text style={styles.headerSubtitle}>
          All perks are cosmetic and UX-based. No monetization advantages.
        </Text>
      </View>

      <View style={styles.currentLevelCard}>
        <Text style={styles.currentLevelLabel}>Your Current Level</Text>
        <Text style={styles.currentLevelNumber}>{currentLevel}</Text>
        <Text style={styles.currentLevelTier}>
          {currentLevel >= 15 ? 'LEGENDARY' : currentLevel >= 10 ? 'ELITE' : currentLevel >= 5 ? 'PREMIUM' : 'VIP'}
        </Text>
      </View>

      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => renderBenefit(benefit, index))}
      </View>

      <View style={styles.footer}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={16}
          color={colors.brandPrimary}
        />
        <Text style={styles.footerText}>
          VIP levels are earned through gifting and loyalty. All upgrades are system-driven.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  currentLevelCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    gap: 8,
  },
  currentLevelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  currentLevelNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.brandPrimary,
  },
  currentLevelTier: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  benefitsList: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    opacity: 0.5,
  },
  benefitCardUnlocked: {
    opacity: 1,
    borderColor: colors.brandPrimary,
  },
  benefitCardCurrent: {
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
    gap: 4,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  benefitLevelUnlocked: {
    color: colors.brandPrimary,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  currentBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  benefitTitleUnlocked: {
    color: colors.text,
  },
  benefitDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  benefitDescriptionUnlocked: {
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
});
