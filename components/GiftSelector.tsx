
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { fetchGifts, purchaseGift, Gift, GiftTier } from '@/app/services/giftService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';

interface GiftSelectorProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  livestreamId?: string;
  onGiftSent?: (giftEvent: any) => void;
}

/**
 * GiftSelector - Fully Defensive Component
 * 
 * STABILITY FIXES APPLIED:
 * - All user data validated before operations
 * - All gift data validated before rendering
 * - Graceful fallbacks for missing data
 * - No assumptions about data shape
 */
export default function GiftSelector({
  visible,
  onClose,
  receiverId,
  receiverName,
  livestreamId,
  onGiftSent,
}: GiftSelectorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedTier, setSelectedTier] = useState<GiftTier | 'ALL'>('ALL');

  // DEFENSIVE: Validate required props
  useEffect(() => {
    if (!receiverId) {
      console.error('❌ [GiftSelector] receiverId is required');
    }
    if (!receiverName) {
      console.warn('⚠️ [GiftSelector] receiverName is missing');
    }
  }, [receiverId, receiverName]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    if (!user) {
      console.warn('⚠️ [GiftSelector] Cannot load data: user is null');
      setLoading(false);
      return;
    }

    if (!user.id) {
      console.error('❌ [GiftSelector] Cannot load data: user.id is missing');
      setLoading(false);
      return;
    }

    try {
      // DEFENSIVE: Check supabase exists
      if (!supabase) {
        console.error('❌ [GiftSelector] supabase client is undefined');
        setLoading(false);
        return;
      }

      // DEFENSIVE: Wrap fetchGifts in try-catch
      let giftsResult;
      try {
        giftsResult = await fetchGifts();
      } catch (giftsError) {
        console.error('❌ [GiftSelector] Error fetching gifts:', giftsError);
        giftsResult = { data: [] };
      }

      // DEFENSIVE: Validate gifts data
      if (giftsResult.data && Array.isArray(giftsResult.data)) {
        // Filter out invalid gifts
        const validGifts = giftsResult.data.filter((gift: any) => {
          if (!gift) {
            console.warn('⚠️ [GiftSelector] Filtered out null gift');
            return false;
          }
          if (!gift.id) {
            console.warn('⚠️ [GiftSelector] Filtered out gift with no id');
            return false;
          }
          if (typeof gift.price_sek !== 'number') {
            console.warn('⚠️ [GiftSelector] Filtered out gift with invalid price:', gift.id);
            return false;
          }
          return true;
        });
        setGifts(validGifts);
      } else {
        console.warn('⚠️ [GiftSelector] Gifts data is not an array');
        setGifts([]);
      }

      // DEFENSIVE: Fetch wallet with error handling
      try {
        const walletResult = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (walletResult.data) {
          const balance = parseFloat(walletResult.data.balance);
          setWalletBalance(isNaN(balance) ? 0 : balance);
        } else {
          // Create wallet if it doesn't exist
          try {
            await supabase.from('wallet').insert({ user_id: user.id, balance: 0 });
            setWalletBalance(0);
          } catch (insertError) {
            console.error('❌ [GiftSelector] Error creating wallet:', insertError);
            setWalletBalance(0);
          }
        }
      } catch (walletError) {
        console.error('❌ [GiftSelector] Error fetching wallet:', walletError);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('❌ [GiftSelector] Error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      console.warn('⚠️ [GiftSelector] Cannot purchase: user is null');
      Alert.alert('Error', 'You must be logged in to send gifts');
      return;
    }

    if (!user.id) {
      console.error('❌ [GiftSelector] Cannot purchase: user.id is missing');
      Alert.alert('Error', 'User ID is missing');
      return;
    }

    if (!selectedGift) {
      console.warn('⚠️ [GiftSelector] Cannot purchase: no gift selected');
      return;
    }

    if (!selectedGift.id) {
      console.error('❌ [GiftSelector] Cannot purchase: gift.id is missing');
      Alert.alert('Error', 'Invalid gift selected');
      return;
    }

    if (!receiverId) {
      console.error('❌ [GiftSelector] Cannot purchase: receiverId is missing');
      Alert.alert('Error', 'Receiver ID is missing');
      return;
    }

    if (walletBalance < selectedGift.price_sek) {
      Alert.alert(
        'Insufficient Balance',
        'You need to add money to send gifts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Balance',
            onPress: () => {
              onClose();
              router.push('/screens/AddBalanceScreen');
            },
          },
        ]
      );
      return;
    }

    setPurchasing(true);

    try {
      const result = await purchaseGift(
        selectedGift.id,
        user.id,
        receiverId,
        livestreamId
      );

      // DEFENSIVE: Validate result
      if (!result) {
        console.error('❌ [GiftSelector] purchaseGift returned null/undefined');
        Alert.alert('Error', 'Failed to purchase gift');
        setPurchasing(false);
        return;
      }

      if (result.success && result.giftEvent) {
        // Broadcast gift with emoji and tier
        const giftEventData = {
          ...result.giftEvent,
          gift_emoji: selectedGift.emoji_icon || '🎁',
          tier: selectedGift.tier || 'A',
        };

        if (onGiftSent && typeof onGiftSent === 'function') {
          try {
            onGiftSent(giftEventData);
          } catch (callbackError) {
            console.error('❌ [GiftSelector] Error in onGiftSent callback:', callbackError);
          }
        }

        Alert.alert(
          'Gift Sent! 🎁',
          `You sent ${selectedGift.emoji_icon || '🎁'} ${selectedGift.name || 'a gift'} to ${receiverName || 'the receiver'}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedGift(null);
                onClose();
              },
            },
          ]
        );

        // DEFENSIVE: Update wallet balance with error handling
        try {
          if (supabase) {
            const { data } = await supabase
              .from('wallet')
              .select('balance')
              .eq('user_id', user.id)
              .single();
            
            if (data) {
              const balance = parseFloat(data.balance);
              setWalletBalance(isNaN(balance) ? 0 : balance);
            }
          }
        } catch (balanceError) {
          console.error('❌ [GiftSelector] Error updating balance:', balanceError);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to purchase gift');
      }
    } catch (error) {
      console.error('❌ [GiftSelector] Error purchasing gift:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const getTierColor = (tier: GiftTier | null | undefined): string => {
    switch (tier) {
      case 'C':
        return '#FFD700';
      case 'B':
        return colors.gradientEnd;
      case 'A':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getTierLabel = (tier: GiftTier | null | undefined): string => {
    switch (tier) {
      case 'C':
        return 'PREMIUM';
      case 'B':
        return 'MEDIUM';
      case 'A':
        return 'CHEAP';
      default:
        return 'BASIC';
    }
  };

  const filteredGifts = selectedTier === 'ALL' 
    ? gifts 
    : gifts.filter(g => g && g.tier === selectedTier);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Send Gift</Text>
              <Text style={styles.headerSubtitle}>to {receiverName || 'Unknown'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceBar}>
            <View style={styles.balanceLeft}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.balanceText}>Balance: {walletBalance.toFixed(2)} kr</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push('/screens/AddBalanceScreen');
              }}
            >
              <Text style={styles.addBalanceText}>Add +</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tierFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierFilterContent}>
              {(['ALL', 'A', 'B', 'C'] as const).map((tier) => (
                <TouchableOpacity
                  key={`tier-${tier}`}
                  style={[
                    styles.tierButton,
                    selectedTier === tier && styles.tierButtonActive,
                    selectedTier === tier && tier !== 'ALL' && { borderColor: getTierColor(tier) },
                  ]}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Text
                    style={[
                      styles.tierButtonText,
                      selectedTier === tier && styles.tierButtonTextActive,
                      selectedTier === tier && tier !== 'ALL' && { color: getTierColor(tier) },
                    ]}
                  >
                    {tier === 'ALL' ? 'ALL' : getTierLabel(tier)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.giftsGrid}>
                {filteredGifts.map((gift) => {
                  // DEFENSIVE: Validate gift data
                  if (!gift || !gift.id) {
                    return null;
                  }

                  const isDisabled = walletBalance < (gift.price_sek || 0);
                  const tierColor = getTierColor(gift.tier);
                  
                  return (
                    <TouchableOpacity
                      key={`gift-${gift.id}`}
                      style={[
                        styles.giftCard,
                        selectedGift?.id === gift.id && styles.giftCardSelected,
                        isDisabled && styles.giftCardDisabled,
                        { borderColor: selectedGift?.id === gift.id ? tierColor : colors.border },
                      ]}
                      onPress={() => setSelectedGift(gift)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                        <Text style={styles.tierBadgeText}>{getTierLabel(gift.tier)}</Text>
                      </View>
                      
                      <View style={styles.giftEmojiContainer}>
                        <Text style={styles.giftEmoji}>{gift.emoji_icon || '🎁'}</Text>
                      </View>
                      
                      <Text style={styles.giftName} numberOfLines={2}>
                        {gift.name || 'Gift'}
                      </Text>
                      
                      <Text
                        style={[
                          styles.giftPrice,
                          { color: tierColor },
                          isDisabled && styles.giftPriceDisabled,
                        ]}
                      >
                        {(gift.price_sek || 0).toFixed(2)} kr
                      </Text>
                      
                      {selectedGift?.id === gift.id && (
                        <View style={styles.selectedBadge}>
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={20}
                            color={tierColor}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {selectedGift && (
            <View style={styles.footer}>
              <View style={styles.selectedGiftInfo}>
                <View style={styles.selectedGiftLeft}>
                  <Text style={styles.selectedGiftEmoji}>{selectedGift.emoji_icon || '🎁'}</Text>
                  <View>
                    <Text style={styles.selectedGiftName}>{selectedGift.name || 'Gift'}</Text>
                    <Text style={styles.selectedGiftDesc} numberOfLines={1}>
                      {selectedGift.description || 'A special gift'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.selectedGiftPrice,
                    { color: getTierColor(selectedGift.tier) },
                  ]}
                >
                  {(selectedGift.price_sek || 0).toFixed(2)} kr
                </Text>
              </View>
              <View style={styles.footerButton}>
                <GradientButton
                  title={purchasing ? 'SENDING...' : 'SEND GIFT'}
                  onPress={handlePurchase}
                  disabled={purchasing}
                  size="medium"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  tierFilter: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tierFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tierButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tierButtonActive: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.gradientEnd,
  },
  tierButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tierButtonTextActive: {
    color: colors.gradientEnd,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  giftCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  giftCardSelected: {
    backgroundColor: colors.backgroundAlt,
  },
  giftCardDisabled: {
    opacity: 0.4,
  },
  tierBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#000',
  },
  giftEmojiContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  giftEmoji: {
    fontSize: 48,
  },
  giftName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
    minHeight: 28,
  },
  giftPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  giftPriceDisabled: {
    color: colors.textSecondary,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  selectedGiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedGiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectedGiftEmoji: {
    fontSize: 40,
  },
  selectedGiftName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedGiftDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedGiftPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  footerButton: {
    width: '100%',
  },
});
