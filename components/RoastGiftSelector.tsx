
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { ROAST_GIFT_MANIFEST, RoastGift } from '@/constants/RoastGiftManifest';

interface RoastGiftSelectorProps {
  onSelectGift: (giftId: string) => void;
  creatorId: string;
}

/**
 * Roast Gift Selector Component
 * 
 * Displays a horizontal scrollable list of gifts from the NEW Roast Gift system.
 * 
 * SAFETY GUARDS:
 * - Ensures gifts array is always defined
 * - Handles loading and empty states
 * - No .map() on undefined values
 */
export default function RoastGiftSelector({
  onSelectGift,
  creatorId,
}: RoastGiftSelectorProps) {
  const [gifts, setGifts] = useState<RoastGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // SAFETY GUARD: Ensure ROAST_GIFT_MANIFEST is an array
      if (!ROAST_GIFT_MANIFEST || !Array.isArray(ROAST_GIFT_MANIFEST)) {
        console.error('❌ [RoastGiftSelector] ROAST_GIFT_MANIFEST is not an array');
        setGifts([]);
      } else {
        setGifts(ROAST_GIFT_MANIFEST);
      }
    } catch (error) {
      console.error('❌ [RoastGiftSelector] Error loading gifts:', error);
      setGifts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading gifts...</Text>
      </View>
    );
  }

  // EMPTY STATE
  if (!gifts || gifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎁</Text>
        <Text style={styles.emptyText}>No gifts available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* SAFETY GUARD: Only map if gifts is an array with items */}
      {gifts.map((gift, index) => (
        <TouchableOpacity
          key={`${gift.giftId}-${index}`}
          style={styles.giftCard}
          onPress={() => onSelectGift(gift.giftId)}
        >
          <Text style={styles.emoji}>{gift.emoji}</Text>
          <Text style={styles.name} numberOfLines={2}>{gift.displayName}</Text>
          <Text style={styles.price}>{gift.priceSEK} SEK</Text>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(gift.tier) }]}>
            <Text style={styles.tierText}>{gift.tier}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function getTierColor(tier: string): string {
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
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  giftCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    width: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 48,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
