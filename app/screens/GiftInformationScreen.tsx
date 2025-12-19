
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { ROAST_GIFT_MANIFEST, RoastGiftTier } from '@/constants/RoastGiftManifest';

/**
 * Gift & Effects Screen
 * 
 * Displays the NEW Roast Gift catalog with 45 gifts across 4 tiers.
 * 
 * SAFETY GUARDS:
 * - All gift arrays default to empty arrays
 * - filteredGifts is ALWAYS an array
 * - Loading, empty, and error states are handled
 * - No .map() is called on undefined values
 * 
 * TIER SYSTEM:
 * - LOW: 1-10 SEK (Cheap Heckles)
 * - MID: 20-100 SEK (Crowd Reactions)
 * - HIGH: 150-500 SEK (Roast Weapons)
 * - ULTRA: 700-4000 SEK (Battle Disruptors & Nuclear Moments)
 */

type TierFilter = 'LOW' | 'MID' | 'HIGH' | 'ULTRA' | null;

export default function GiftInformationScreen() {
  const { colors } = useTheme();
  const [selectedTier, setSelectedTier] = useState<TierFilter>(null);
  const [isLoading, setIsLoading] = useState(false);

  // SAFETY GUARD: Ensure gifts is always an array
  const allGifts = useMemo(() => {
    if (!ROAST_GIFT_MANIFEST || !Array.isArray(ROAST_GIFT_MANIFEST)) {
      console.error('❌ [GiftInformationScreen] ROAST_GIFT_MANIFEST is not an array');
      return [];
    }
    return ROAST_GIFT_MANIFEST;
  }, []);

  // SAFETY GUARD: Filter logic that always returns an array
  const filteredGifts = useMemo(() => {
    if (!allGifts || allGifts.length === 0) {
      return [];
    }

    if (!selectedTier) {
      return allGifts;
    }

    const filtered = allGifts.filter((gift) => gift.tier === selectedTier);
    return filtered || [];
  }, [allGifts, selectedTier]);

  const getTierColor = (tier: RoastGiftTier): string => {
    switch (tier) {
      case 'LOW':
        return '#4CAF50';
      case 'MID':
        return '#FF9800';
      case 'HIGH':
        return '#9C27B0';
      case 'ULTRA':
        return '#E91E63';
      default:
        return colors.textSecondary;
    }
  };

  const getTierLabel = (tier: RoastGiftTier): string => {
    switch (tier) {
      case 'LOW':
        return 'Low';
      case 'MID':
        return 'Mid';
      case 'HIGH':
        return 'High';
      case 'ULTRA':
        return 'Ultra';
      default:
        return 'Unknown';
    }
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gifts & Effects</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading gift catalog...
          </Text>
        </View>
      </View>
    );
  }

  // EMPTY STATE
  if (!allGifts || allGifts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gifts & Effects</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>🎁</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Gifts Available</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            The gift catalog is currently empty. Please check back later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gifts & Effects</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tier Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: !selectedTier ? colors.brandPrimary : colors.backgroundAlt, 
                borderColor: colors.border 
              },
            ]}
            onPress={() => setSelectedTier(null)}
          >
            <Text style={[styles.filterText, { color: !selectedTier ? '#FFFFFF' : colors.text }]}>
              All Gifts ({allGifts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedTier === 'LOW' ? getTierColor('LOW') : colors.backgroundAlt, 
                borderColor: colors.border 
              },
            ]}
            onPress={() => setSelectedTier('LOW')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'LOW' ? '#FFFFFF' : colors.text }]}>
              Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedTier === 'MID' ? getTierColor('MID') : colors.backgroundAlt, 
                borderColor: colors.border 
              },
            ]}
            onPress={() => setSelectedTier('MID')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'MID' ? '#FFFFFF' : colors.text }]}>
              Mid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedTier === 'HIGH' ? getTierColor('HIGH') : colors.backgroundAlt, 
                borderColor: colors.border 
              },
            ]}
            onPress={() => setSelectedTier('HIGH')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'HIGH' ? '#FFFFFF' : colors.text }]}>
              High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedTier === 'ULTRA' ? getTierColor('ULTRA') : colors.backgroundAlt, 
                borderColor: colors.border 
              },
            ]}
            onPress={() => setSelectedTier('ULTRA')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'ULTRA' ? '#FFFFFF' : colors.text }]}>
              Ultra
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Gift Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* SAFETY GUARD: Only render grid if filteredGifts has items */}
        {filteredGifts.length > 0 ? (
          <View style={styles.giftGrid}>
            {filteredGifts.map((gift, index) => (
              <View 
                key={`${gift.giftId}-${index}`} 
                style={[styles.giftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.giftImageContainer, { backgroundColor: colors.backgroundAlt }]}>
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                </View>
                <Text style={[styles.giftName, { color: colors.text }]} numberOfLines={1}>
                  {gift.displayName}
                </Text>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(gift.tier) }]}>
                  <Text style={styles.tierText}>{getTierLabel(gift.tier).toUpperCase()}</Text>
                </View>
                <Text style={[styles.giftPrice, { color: colors.brandPrimary }]}>
                  {gift.priceSEK} SEK
                </Text>
                <Text style={[styles.giftDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {gift.description}
                </Text>
                <View style={[styles.animationTypeBadge, { backgroundColor: colors.backgroundAlt }]}>
                  <Text style={[styles.animationTypeText, { color: colors.textSecondary }]}>
                    {gift.animationType}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Gifts Found</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              No gifts match the selected tier. Try selecting a different tier.
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  giftCard: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  giftImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  giftEmoji: {
    fontSize: 48,
  },
  giftImage: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  giftName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  giftDescription: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
  animationTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  animationTypeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});
