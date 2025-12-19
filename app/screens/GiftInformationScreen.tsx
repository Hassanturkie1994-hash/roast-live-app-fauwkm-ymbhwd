
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { ROAST_GIFTS } from '@/constants/RoastGiftManifest';

export default function GiftInformationScreen() {
  const { colors } = useTheme();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'legendary' | null>(null);

  const filteredGifts = selectedTier
    ? ROAST_GIFTS.filter((gift) => gift.tier === selectedTier)
    : ROAST_GIFTS;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return '#4CAF50';
      case 'premium':
        return '#FF9800';
      case 'legendary':
        return '#E91E63';
      default:
        return colors.textSecondary;
    }
  };

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
              { backgroundColor: !selectedTier ? colors.brandPrimary : colors.backgroundAlt, borderColor: colors.border },
            ]}
            onPress={() => setSelectedTier(null)}
          >
            <Text style={[styles.filterText, { color: !selectedTier ? '#FFFFFF' : colors.text }]}>All Gifts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: selectedTier === 'basic' ? '#4CAF50' : colors.backgroundAlt, borderColor: colors.border },
            ]}
            onPress={() => setSelectedTier('basic')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'basic' ? '#FFFFFF' : colors.text }]}>Basic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: selectedTier === 'premium' ? '#FF9800' : colors.backgroundAlt, borderColor: colors.border },
            ]}
            onPress={() => setSelectedTier('premium')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'premium' ? '#FFFFFF' : colors.text }]}>Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: selectedTier === 'legendary' ? '#E91E63' : colors.backgroundAlt, borderColor: colors.border },
            ]}
            onPress={() => setSelectedTier('legendary')}
          >
            <Text style={[styles.filterText, { color: selectedTier === 'legendary' ? '#FFFFFF' : colors.text }]}>Legendary</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Gift Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.giftGrid}>
          {filteredGifts.map((gift) => (
            <View key={gift.id} style={[styles.giftCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.giftImageContainer, { backgroundColor: colors.backgroundAlt }]}>
                <Image source={{ uri: gift.icon }} style={styles.giftImage} />
              </View>
              <Text style={[styles.giftName, { color: colors.text }]}>{gift.name}</Text>
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(gift.tier) }]}>
                <Text style={styles.tierText}>{gift.tier.toUpperCase()}</Text>
              </View>
              <Text style={[styles.giftPrice, { color: colors.brandPrimary }]}>{gift.price_sek} SEK</Text>
              <Text style={[styles.giftDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {gift.description}
              </Text>
            </View>
          ))}
        </View>
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
});
