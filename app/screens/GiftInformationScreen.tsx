
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { ROAST_GIFT_MANIFEST, RoastGiftTier, RoastGift, getRoastGiftAnimationDuration } from '@/constants/RoastGiftManifest';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { giftSoundEngine } from '@/services/giftSoundEngine';
import { useTranslation, formatTranslation } from '@/hooks/useTranslation';

/**
 * Gift & Effects Screen
 * 
 * RESTORED GIFT DETAILS MODAL:
 * - ALL gift information visible (icon, name, price, tier, description, sound, animation)
 * - Full vertical scrolling capability
 * - Animation renders inline below the button with REAL gift animation + audio
 * - User can see animation immediately when triggered
 * - Improved manifest resiliency with error handling and retry
 * - Localized sound descriptions from manifest
 * 
 * Displays the NEW Roast Gift catalog with 45 gifts across 4 tiers.
 * SORTED BY PRICE: Cheapest first, most expensive last
 */

type TierFilter = 'LOW' | 'MID' | 'HIGH' | 'ULTRA' | null;

interface ManifestError {
  type: 'empty' | 'unavailable' | 'parse_error';
  message: string;
  canRetry: boolean;
}

export default function GiftInformationScreen() {
  const { colors } = useTheme();
  const t = useTranslation();
  const [selectedTier, setSelectedTier] = useState<TierFilter>(null);
  const [selectedGift, setSelectedGift] = useState<RoastGift | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [manifestError, setManifestError] = useState<ManifestError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const animationScale = useState(new Animated.Value(1))[0];
  const animationOpacity = useState(new Animated.Value(0))[0];
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize sound engine
  useEffect(() => {
    giftSoundEngine.initialize().catch((error) => {
      console.error('❌ [GiftInformationScreen] Failed to initialize sound engine:', error);
    });

    return () => {
      giftSoundEngine.cleanup();
    };
  }, []);

  // SAFETY GUARD: Validate manifest and handle errors
  const validateManifest = (): ManifestError | null => {
    if (!ROAST_GIFT_MANIFEST) {
      console.error('❌ [GiftInformationScreen] ROAST_GIFT_MANIFEST is undefined');
      return {
        type: 'unavailable',
        message: 'Gift catalog is currently unavailable. Please check your connection and try again.',
        canRetry: true,
      };
    }

    if (!Array.isArray(ROAST_GIFT_MANIFEST)) {
      console.error('❌ [GiftInformationScreen] ROAST_GIFT_MANIFEST is not an array:', typeof ROAST_GIFT_MANIFEST);
      return {
        type: 'parse_error',
        message: 'Gift catalog data is corrupted. Please restart the app.',
        canRetry: true,
      };
    }

    if (ROAST_GIFT_MANIFEST.length === 0) {
      console.error('❌ [GiftInformationScreen] ROAST_GIFT_MANIFEST is empty');
      return {
        type: 'empty',
        message: 'No gifts are currently available. Please try again later or contact support.',
        canRetry: true,
      };
    }

    return null;
  };

  // Check manifest on mount and when retrying
  useEffect(() => {
    const error = validateManifest();
    setManifestError(error);
    if (error) {
      console.error('❌ [GiftInformationScreen] Manifest validation failed:', error);
    }
  }, []);

  // SAFETY GUARD: Ensure gifts is always an array and SORTED BY PRICE
  const allGifts = useMemo(() => {
    const error = validateManifest();
    if (error) {
      setManifestError(error);
      return [];
    }

    try {
      // Sort by price: cheapest first, most expensive last
      return [...ROAST_GIFT_MANIFEST].sort((a, b) => a.priceSEK - b.priceSEK);
    } catch (err) {
      console.error('❌ [GiftInformationScreen] Error sorting gifts:', err);
      setManifestError({
        type: 'parse_error',
        message: 'Failed to load gift catalog. Please try again.',
        canRetry: true,
      });
      return [];
    }
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

  const handleRetry = async () => {
    console.log('🔄 [GiftInformationScreen] Retrying manifest load...');
    setIsRetrying(true);
    
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const error = validateManifest();
    setManifestError(error);
    setIsRetrying(false);
    
    if (!error) {
      console.log('✅ [GiftInformationScreen] Manifest loaded successfully after retry');
    }
  };

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

  const playAnimation = async () => {
    if (!selectedGift) {
      console.error('❌ [GiftInformationScreen] No gift selected for animation');
      return;
    }

    console.log('▶️ [GiftInformationScreen] Playing REAL animation + audio for:', selectedGift.displayName);
    setAnimationPlaying(true);
    
    // Play sound effect using the gift sound engine
    try {
      await giftSoundEngine.playSound(selectedGift.soundProfile, selectedGift.tier);
      console.log('🔊 [GiftInformationScreen] Playing sound:', selectedGift.soundProfile);
    } catch (error) {
      console.error('❌ [GiftInformationScreen] Failed to play sound:', error);
    }
    
    // Animate the gift with real animation sequence
    const duration = getRoastGiftAnimationDuration(selectedGift.tier);
    
    // Fade in and scale up
    Animated.parallel([
      Animated.timing(animationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animationScale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(animationScale, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Keep animation visible for the gift's duration
    setTimeout(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(animationOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animationScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationPlaying(false);
        // Reset animation values
        animationScale.setValue(1);
        animationOpacity.setValue(0);
      });
    }, duration);

    // Scroll to show animation immediately
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // LOCALIZED sound descriptions from manifest
  const getSoundDescription = (soundProfile: string): string => {
    // Check if translation exists in localization file
    const translationKey = `gifts.sounds.${soundProfile}`;
    
    // Fallback to manifest-based descriptions with localization support
    const soundDescriptions: Record<string, string> = {
      'crowd_boo': t.gifts?.sounds?.crowd_boo || 'Crowd booing sound',
      'tomato_splat': t.gifts?.sounds?.tomato_splat || 'Tomato splat sound effect',
      'sitcom_laugh': t.gifts?.sounds?.sitcom_laugh || 'Sitcom laugh track',
      'slap_sound': t.gifts?.sounds?.slap_sound || 'Slap sound effect',
      'cricket_chirp': t.gifts?.sounds?.cricket_chirp || 'Cricket chirping',
      'yawn_sound': t.gifts?.sounds?.yawn_sound || 'Yawning sound',
      'clown_horn': t.gifts?.sounds?.clown_horn || 'Clown horn honk',
      'trash_dump': t.gifts?.sounds?.trash_dump || 'Trash dumping sound',
      'death_sound': t.gifts?.sounds?.death_sound || 'Death sound effect',
      'fart_sound': t.gifts?.sounds?.fart_sound || 'Fart sound',
      'mic_drop_thud': t.gifts?.sounds?.mic_drop_thud || 'Mic drop thud',
      'airhorn_blast': t.gifts?.sounds?.airhorn_blast || 'Loud airhorn blast',
      'crowd_roar': t.gifts?.sounds?.crowd_roar || 'Crowd roaring',
      'boxing_bell': t.gifts?.sounds?.boxing_bell || 'Boxing bell ding',
      'fire_whoosh': t.gifts?.sounds?.fire_whoosh || 'Fire whoosh sound',
      'explosion_boom': t.gifts?.sounds?.explosion_boom || 'Explosion boom',
      'gasp_sound': t.gifts?.sounds?.gasp_sound || 'Shocked gasp',
      'savage_sound': t.gifts?.sounds?.savage_sound || 'Savage sound effect',
      'salt_pour': t.gifts?.sounds?.salt_pour || 'Salt pouring',
      'tea_spill': t.gifts?.sounds?.tea_spill || 'Tea spilling',
      'flamethrower': t.gifts?.sounds?.flamethrower || 'Flamethrower sound',
      'stamp_slam': t.gifts?.sounds?.stamp_slam || 'Stamp slamming',
      'gavel_bang': t.gifts?.sounds?.gavel_bang || 'Judge gavel bang',
      'crown_fanfare': t.gifts?.sounds?.crown_fanfare || 'Crown fanfare',
      'punch_knockout': t.gifts?.sounds?.punch_knockout || 'Knockout punch',
      'bomb_explosion': t.gifts?.sounds?.bomb_explosion || 'Bomb explosion',
      'thunder_crack': t.gifts?.sounds?.thunder_crack || 'Thunder crack',
      'trophy_win': t.gifts?.sounds?.trophy_win || 'Trophy win fanfare',
      'earthquake_rumble': t.gifts?.sounds?.earthquake_rumble || 'Earthquake rumble',
      'slow_motion': t.gifts?.sounds?.slow_motion || 'Slow motion effect',
      'spotlight_on': t.gifts?.sounds?.spotlight_on || 'Spotlight turning on',
      'mute_sound': t.gifts?.sounds?.mute_sound || 'Mute sound',
      'time_stop': t.gifts?.sounds?.time_stop || 'Time freeze effect',
      'nuke_explosion': t.gifts?.sounds?.nuke_explosion || 'Nuclear explosion',
      'shame_bell_ring': t.gifts?.sounds?.shame_bell_ring || 'Shame bell ringing',
      'meteor_impact': t.gifts?.sounds?.meteor_impact || 'Meteor impact',
      'funeral_march': t.gifts?.sounds?.funeral_march || 'Funeral march music',
      'riot_chaos': t.gifts?.sounds?.riot_chaos || 'Riot chaos sounds',
      'execution_sound': t.gifts?.sounds?.execution_sound || 'Execution sound',
      'game_over': t.gifts?.sounds?.game_over || 'Game over sound',
      'apocalypse_sound': t.gifts?.sounds?.apocalypse_sound || 'Apocalypse sound',
      'sigh_sound': t.gifts?.sounds?.sigh_sound || 'Sigh sound',
      'snore_sound': t.gifts?.sounds?.snore_sound || 'Snoring sound',
      'cringe_sound': t.gifts?.sounds?.cringe_sound || 'Cringe sound',
      'hammer_slam': t.gifts?.sounds?.hammer_slam || 'Hammer slam',
      'sword_slash': t.gifts?.sounds?.sword_slash || 'Sword slash',
      'shield_block': t.gifts?.sounds?.shield_block || 'Shield block',
      'dragon_roar': t.gifts?.sounds?.dragon_roar || 'Dragon roar',
      'siren': t.gifts?.sounds?.siren || 'Siren sound',
      'crowd_chant': t.gifts?.sounds?.crowd_chant || 'Crowd chanting',
      'church_bell': t.gifts?.sounds?.church_bell || 'Church bell',
    };

    const description = soundDescriptions[soundProfile];
    
    if (!description) {
      console.warn(`⚠️ [GiftInformationScreen] Missing sound description for: ${soundProfile}`);
      return 'Sound effect';
    }
    
    return description;
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

  // Render manifest error state
  if (manifestError) {
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

        {/* Error State */}
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="error"
            size={64}
            color={colors.error || '#FF3B30'}
          />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {manifestError.type === 'empty' ? 'No Gifts Available' : 'Unable to Load Gifts'}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {manifestError.message}
          </Text>
          
          {manifestError.canRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.brandPrimary }]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.supportButton, { borderColor: colors.border }]}
            onPress={() => {
              console.log('📧 [GiftInformationScreen] Contact support pressed');
              // TODO: Navigate to support screen
            }}
          >
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.supportButtonText, { color: colors.text }]}>Contact Support</Text>
          </TouchableOpacity>
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
        onRequestClose={() => {
          setShowDetailsModal(false);
          setAnimationPlaying(false);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowDetailsModal(false);
          setAnimationPlaying(false);
        }}>
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]} 
            onPress={(e) => e.stopPropagation()}
          >
            {selectedGift ? (
              <View style={styles.modalInnerContainer}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedGift.displayName}</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDetailsModal(false);
                    setAnimationPlaying(false);
                  }}>
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

                  {/* Sound Description - LOCALIZED */}
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

                  {/* INLINE Animation Preview - Renders BELOW the button with REAL animation */}
                  {animationPlaying && (
                    <Animated.View
                      style={[
                        styles.inlineAnimationContainer,
                        { 
                          backgroundColor: colors.backgroundAlt,
                          transform: [{ scale: animationScale }],
                          opacity: animationOpacity,
                        },
                      ]}
                    >
                      <Text style={styles.animationEmoji}>{selectedGift.emoji}</Text>
                      <Text style={[styles.animationText, { color: colors.text }]}>
                        {selectedGift.displayName}
                      </Text>
                      <Text style={[styles.animationSubtext, { color: colors.textSecondary }]}>
                        {selectedGift.tier} Tier • {(getRoastGiftAnimationDuration(selectedGift.tier) / 1000).toFixed(1)}s
                      </Text>
                      <View style={styles.animationSoundIndicator}>
                        <IconSymbol
                          ios_icon_name="speaker.wave.3.fill"
                          android_material_icon_name="volume_up"
                          size={16}
                          color={colors.brandPrimary}
                        />
                        <Text style={[styles.animationSoundText, { color: colors.textSecondary }]}>
                          {getSoundDescription(selectedGift.soundProfile)}
                        </Text>
                      </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    minWidth: 160,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: 160,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  animationSoundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  animationSoundText: {
    fontSize: 12,
    fontWeight: '500',
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
