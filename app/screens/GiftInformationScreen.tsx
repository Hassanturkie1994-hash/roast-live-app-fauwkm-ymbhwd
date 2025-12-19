
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { ROAST_GIFT_MANIFEST, RoastGiftTier, RoastGift, getRoastGiftAnimationDuration } from '@/constants/RoastGiftManifest';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

/**
 * Gift & Effects Screen
 * 
 * RESTORED GIFT DETAILS MODAL:
 * - ALL gift information visible (icon, name, price, tier, description, sound, animation)
 * - Full vertical scrolling capability
 * - Animation renders inline below the button
 * - User can see animation immediately when triggered
 * 
 * Displays the NEW Roast Gift catalog with 45 gifts across 4 tiers.
 * SORTED BY PRICE: Cheapest first, most expensive last
 */

type TierFilter = 'LOW' | 'MID' | 'HIGH' | 'ULTRA' | null;

export default function GiftInformationScreen() {
  const { colors } = useTheme();
  const [selectedTier, setSelectedTier] = useState<TierFilter>(null);
  const [selectedGift, setSelectedGift] = useState<RoastGift | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const animationScale = useState(new Animated.Value(1))[0];
  const scrollViewRef = useRef<ScrollView>(null);

  // SAFETY GUARD: Ensure gifts is always an array and SORTED BY PRICE
  const allGifts = useMemo(() => {
    if (!ROAST_GIFT_MANIFEST || !Array.isArray(ROAST_GIFT_MANIFEST)) {
      console.error('❌ [GiftInformationScreen] ROAST_GIFT_MANIFEST is not an array');
      return [];
    }
    // Sort by price: cheapest first, most expensive last
    return [...ROAST_GIFT_MANIFEST].sort((a, b) => a.priceSEK - b.priceSEK);
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
        return '#999999';
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

  const handleGiftPress = (gift: RoastGift) => {
    console.log('🎁 [GiftInformationScreen] Opening gift details for:', gift.displayName);
    setSelectedGift(gift);
    setShowDetailsModal(true);
    setAnimationPlaying(false); // Reset animation state
  };

  const playAnimation = () => {
    console.log('▶️ [GiftInformationScreen] Playing animation preview');
    setAnimationPlaying(true);
    
    // Simulate gift animation with inline rendering
    Animated.sequence([
      Animated.timing(animationScale, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animationScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Keep animation visible for a moment
      setTimeout(() => {
        setAnimationPlaying(false);
      }, 2000);
    });
  };

  const getSoundDescription = (soundProfile: string): string => {
    const soundMap: Record<string, string> = {
      'crowd_boo': 'Crowd booing sound',
      'tomato_splat': 'Tomato splat sound effect',
      'sitcom_laugh': 'Sitcom laugh track',
      'slap_sound': 'Slap sound effect',
      'cricket_chirp': 'Cricket chirping',
      'yawn_sound': 'Yawning sound',
      'clown_horn': 'Clown horn honk',
      'trash_dump': 'Trash dumping sound',
      'death_sound': 'Death sound effect',
      'fart_sound': 'Fart sound',
      'mic_drop_thud': 'Mic drop thud',
      'airhorn_blast': 'Loud airhorn blast',
      'crowd_roar': 'Crowd roaring',
      'boxing_bell': 'Boxing bell ding',
      'fire_whoosh': 'Fire whoosh sound',
      'explosion_boom': 'Explosion boom',
      'gasp_sound': 'Shocked gasp',
      'savage_sound': 'Savage sound effect',
      'salt_pour': 'Salt pouring',
      'tea_spill': 'Tea spilling',
      'flamethrower': 'Flamethrower sound',
      'stamp_slam': 'Stamp slamming',
      'gavel_bang': 'Judge gavel bang',
      'crown_fanfare': 'Crown fanfare',
      'punch_knockout': 'Knockout punch',
      'bomb_explosion': 'Bomb explosion',
      'thunder_crack': 'Thunder crack',
      'trophy_win': 'Trophy win fanfare',
      'earthquake_rumble': 'Earthquake rumble',
      'slow_motion': 'Slow motion effect',
      'spotlight_on': 'Spotlight turning on',
      'mute_sound': 'Mute sound',
      'time_stop': 'Time freeze effect',
      'nuke_explosion': 'Nuclear explosion',
      'shame_bell_ring': 'Shame bell ringing',
      'meteor_impact': 'Meteor impact',
      'funeral_march': 'Funeral march music',
      'riot_chaos': 'Riot chaos sounds',
      'execution_sound': 'Execution sound',
      'game_over': 'Game over sound',
      'apocalypse_sound': 'Apocalypse sound',
      'sigh_sound': 'Sigh sound',
      'snore_sound': 'Snoring sound',
      'cringe_sound': 'Cringe sound',
      'hammer_slam': 'Hammer slam',
      'sword_slash': 'Sword slash',
      'shield_block': 'Shield block',
      'dragon_roar': 'Dragon roar',
    };
    return soundMap[soundProfile] || 'Sound effect';
  };

  const getAnimationDescription = (animationType: string): string => {
    switch (animationType) {
      case 'OVERLAY':
        return 'Appears as an overlay on screen';
      case 'AR':
        return 'Augmented reality effect on camera';
      case 'CINEMATIC':
        return 'Full-screen cinematic takeover';
      default:
        return 'Animation effect';
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
        scrollEnabled={true}
      >
        {filteredGifts.length > 0 ? (
          <View style={styles.giftGrid}>
            {filteredGifts.map((gift, index) => (
              <TouchableOpacity
                key={`${gift.giftId}-${index}`}
                style={[styles.giftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleGiftPress(gift)}
                activeOpacity={0.7}
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
                  {gift.priceSEK} kr
                </Text>
                <View style={styles.tapHint}>
                  <IconSymbol
                    ios_icon_name="hand.tap.fill"
                    android_material_icon_name="touch_app"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.tapHintText, { color: colors.textSecondary }]}>Tap for details</Text>
                </View>
              </TouchableOpacity>
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

      {/* RESTORED Gift Details Modal - ALL INFORMATION VISIBLE */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetailsModal(false)}>
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]} 
            onPress={(e) => e.stopPropagation()}
          >
            {selectedGift ? (
              <View style={styles.modalInnerContainer}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedGift.displayName}</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={28}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* RESTORED: ScrollView with ALL gift information */}
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.modalBody} 
                  contentContainerStyle={styles.modalBodyContent}
                  showsVerticalScrollIndicator={true}
                  scrollEnabled={true}
                  bounces={true}
                >
                  {/* Gift Icon/Emoji */}
                  <View style={[styles.previewContainer, { backgroundColor: colors.backgroundAlt }]}>
                    <Text style={styles.previewEmoji}>{selectedGift.emoji}</Text>
                  </View>

                  {/* Gift Name (redundant but ensures visibility) */}
                  <Text style={[styles.giftNameLarge, { color: colors.text }]}>
                    {selectedGift.displayName}
                  </Text>

                  {/* Price and Tier */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Price</Text>
                      <Text style={[styles.detailValue, { color: colors.brandPrimary }]}>
                        {selectedGift.priceSEK} kr
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tier</Text>
                      <View style={[styles.tierBadgeLarge, { backgroundColor: getTierColor(selectedGift.tier) }]}>
                        <Text style={styles.tierTextLarge}>{getTierLabel(selectedGift.tier).toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Full Description */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Description</Text>
                    <Text style={[styles.detailSectionText, { color: colors.textSecondary }]}>
                      {selectedGift.description}
                    </Text>
                  </View>

                  {/* Animation Type */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Animation Type</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <IconSymbol
                        ios_icon_name="sparkles"
                        android_material_icon_name="auto_awesome"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <View style={styles.infoCardText}>
                        <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                          {selectedGift.animationType}
                        </Text>
                        <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                          {getAnimationDescription(selectedGift.animationType)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Duration */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Duration</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <View style={styles.infoCardText}>
                        <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                          {(getRoastGiftAnimationDuration(selectedGift.tier) / 1000).toFixed(1)} seconds
                        </Text>
                        <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                          Appears during live stream
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Sound Description */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Sound Effect</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <IconSymbol
                        ios_icon_name="speaker.wave.3.fill"
                        android_material_icon_name="volume_up"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <View style={styles.infoCardText}>
                        <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                          {selectedGift.soundProfile}
                        </Text>
                        <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                          {getSoundDescription(selectedGift.soundProfile)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Battle / Roast Behavior */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Battle Behavior</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <IconSymbol
                        ios_icon_name="flame.fill"
                        android_material_icon_name="local_fire_department"
                        size={20}
                        color="#FF6B35"
                      />
                      <View style={styles.infoCardText}>
                        <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                          Roast Gift
                        </Text>
                        <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
                          This gift can be sent during battles and roast sessions to support your favorite creator
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Cinematic Timeline Info (if applicable) */}
                  {selectedGift.cinematicTimeline && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Cinematic Effects</Text>
                      <View style={[styles.cinematicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <IconSymbol
                          ios_icon_name="film.fill"
                          android_material_icon_name="movie"
                          size={20}
                          color="#E91E63"
                        />
                        <Text style={[styles.cinematicText, { color: colors.text }]}>
                          This gift includes a {(selectedGift.cinematicTimeline.duration / 1000).toFixed(1)}s 
                          cinematic sequence with {selectedGift.cinematicTimeline.keyframes.length} effects
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Show Animation Button */}
                  <View style={styles.actionButtonContainer}>
                    <GradientButton
                      title={animationPlaying ? 'Playing Animation...' : 'Show Animation Preview'}
                      onPress={playAnimation}
                      size="large"
                      disabled={animationPlaying}
                    />
                  </View>

                  {/* INLINE Animation Preview - Renders BELOW the button */}
                  {animationPlaying && (
                    <Animated.View
                      style={[
                        styles.inlineAnimationContainer,
                        { 
                          backgroundColor: colors.backgroundAlt,
                          transform: [{ scale: animationScale }],
                        },
                      ]}
                    >
                      <Text style={styles.animationEmoji}>{selectedGift.emoji}</Text>
                      <Text style={[styles.animationText, { color: colors.text }]}>
                        {selectedGift.displayName}
                      </Text>
                      <Text style={[styles.animationSubtext, { color: colors.textSecondary }]}>
                        Animation Preview
                      </Text>
                    </Animated.View>
                  )}

                  {/* Bottom Padding Spacer */}
                  <View style={styles.bottomSpacer} />
                </ScrollView>
              </View>
            ) : (
              <View style={styles.modalInnerContainer}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  No gift selected
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 120,
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
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tapHintText: {
    fontSize: 10,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalInnerContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 60,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 16,
    marginBottom: 16,
  },
  previewEmoji: {
    fontSize: 96,
  },
  giftNameLarge: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  tierBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tierTextLarge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailSectionText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    gap: 4,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCardDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  cinematicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  cinematicText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  inlineAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  animationEmoji: {
    fontSize: 120,
    marginBottom: 16,
  },
  animationText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  animationSubtext: {
    fontSize: 14,
    fontWeight: '400',
  },
  bottomSpacer: {
    height: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 40,
  },
});
