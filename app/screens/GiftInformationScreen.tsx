
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import RoastIcon from '@/components/Icons/RoastIcon';
import { fetchGifts, Gift, GiftTier } from '@/app/services/giftService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2;

// Memoized tier info component
const TierInfoCard = React.memo(({ tier, color, label, priceRange, description }: {
  tier: string;
  color: string;
  label: string;
  priceRange: string;
  description: string;
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.tierInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.tierInfoBadge, { backgroundColor: color }]}>
        <Text style={styles.tierInfoBadgeText}>{label}</Text>
      </View>
      <Text style={[styles.tierInfoPrice, { color: colors.text }]}>{priceRange}</Text>
      <Text style={[styles.tierInfoDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
});

TierInfoCard.displayName = 'TierInfoCard';

export default function GiftInformationScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  // Memoize tier color function
  const getTierColor = useCallback((tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return '#FFD700';
      case 'B':
        return colors.brandPrimary;
      case 'A':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  }, [colors.brandPrimary, colors.textSecondary]);

  // Memoize tier label function
  const getTierLabel = useCallback((tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return 'PREMIUM';
      case 'B':
        return 'MEDIUM';
      case 'A':
        return 'CHEAP';
      default:
        return '';
    }
  }, []);

  // Memoize tier description function
  const getTierDescription = useCallback((tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return 'Full-screen effect with neon flames, particle bursts, and gold gradient text. 2-second duration.';
      case 'B':
        return 'Glow pulse with light particle sparks and shake effect. 1.5-second duration.';
      case 'A':
        return 'Small size animation that slides in, bounces, and fades. 1-second duration.';
      default:
        return '';
    }
  }, []);

  // Memoize load gifts function
  const loadGifts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchGifts();
      
      if (error) {
        console.error('Error loading gifts:', error);
      } else if (data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error in loadGifts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  // Memoize gift card render function
  const renderGiftCard = useCallback(({ item }: { item: Gift }) => (
    <TouchableOpacity
      style={[styles.giftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedGift(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
        <Text style={styles.tierBadgeText}>{getTierLabel(item.tier)}</Text>
      </View>

      <View style={styles.giftEmojiContainer}>
        <Text style={styles.giftEmoji}>{item.emoji_icon}</Text>
      </View>

      <Text style={[styles.giftName, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>

      <Text style={[styles.giftPrice, { color: getTierColor(item.tier) }]}>
        {item.price_sek} kr
      </Text>
    </TouchableOpacity>
  ), [colors.card, colors.border, colors.text, getTierColor, getTierLabel]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: Gift) => item.id, []);

  // Memoize header component
  const renderHeader = useMemo(() => (
    <View style={[styles.introSection, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}>
      <Text style={[styles.introTitle, { color: colors.text }]}>🔥 Roast Live Gifts</Text>
      <Text style={[styles.introText, { color: colors.textSecondary }]}>
        Send savage gifts during live streams to roast or support your favorite creators. Each gift has its own unique animation and impact!
      </Text>

      <View style={styles.tierInfoContainer}>
        <TierInfoCard
          tier="A"
          color={colors.textSecondary}
          label="CHEAP"
          priceRange="1-19 kr"
          description="Quick roasts"
        />
        <TierInfoCard
          tier="B"
          color={colors.brandPrimary}
          label="MEDIUM"
          priceRange="20-600 kr"
          description="Solid burns"
        />
        <TierInfoCard
          tier="C"
          color="#FFD700"
          label="PREMIUM"
          priceRange="600-3000 kr"
          description="Epic roasts"
        />
      </View>
    </View>
  ), [colors.backgroundAlt, colors.border, colors.text, colors.textSecondary, colors.brandPrimary]);

  // Memoize close modal handler
  const handleCloseModal = useCallback(() => {
    setSelectedGift(null);
  }, []);

  // Memoize back handler
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <RoastIcon
            name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gift Information</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={gifts}
          renderItem={renderGiftCard}
          keyExtractor={keyExtractor}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.contentContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
        />
      )}

      {/* Gift Detail Modal */}
      {selectedGift && (
        <Modal
          visible={!!selectedGift}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={handleCloseModal}
            />
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Gift Details</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <RoastIcon
                    name="close"
                    size={28}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalEmojiContainer}>
                  <Text style={styles.modalEmoji}>{selectedGift.emoji_icon}</Text>
                </View>

                <Text style={[styles.modalGiftName, { color: colors.text }]}>{selectedGift.name}</Text>

                <View style={styles.modalPriceRow}>
                  <Text style={[styles.modalPrice, { color: getTierColor(selectedGift.tier) }]}>
                    {selectedGift.price_sek} kr
                  </Text>
                  <View style={[styles.modalTierBadge, { backgroundColor: getTierColor(selectedGift.tier) }]}>
                    <Text style={styles.modalTierBadgeText}>{getTierLabel(selectedGift.tier)}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Description</Text>
                  <Text style={[styles.modalSectionText, { color: colors.textSecondary }]}>{selectedGift.description}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Animation Tier</Text>
                  <Text style={[styles.modalSectionText, { color: colors.textSecondary }]}>{getTierDescription(selectedGift.tier)}</Text>
                </View>

                {selectedGift.usage_count !== undefined && selectedGift.usage_count > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Popularity</Text>
                    <View style={styles.popularityRow}>
                      <RoastIcon
                        name="flame-home"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.modalSectionText, { color: colors.textSecondary }]}>
                        Sent {selectedGift.usage_count} times
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
                  <RoastIcon
                    name="fire-info"
                    size={18}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Send during livestream to appear on screen! Gifts are purchased using your Saldo balance.
                  </Text>
                </View>

                <View style={styles.ctaContainer}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>Send during livestream to appear on screen!</Text>
                  </LinearGradient>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  introSection: {
    padding: 20,
    borderBottomWidth: 1,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 20,
  },
  tierInfoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tierInfoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  tierInfoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tierInfoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  tierInfoPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierInfoDesc: {
    fontSize: 11,
    fontWeight: '400',
  },
  columnWrapper: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 16,
  },
  giftCard: {
    width: cardWidth,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  giftEmojiContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  giftEmoji: {
    fontSize: 56,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    minHeight: 36,
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalEmojiContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 80,
  },
  modalGiftName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '800',
  },
  modalTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalTierBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  popularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  ctaContainer: {
    marginBottom: 20,
  },
  ctaGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
});
