
import React, { useState, useEffect, useCallback } from 'react';
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
import { roastGiftService } from '@/app/services/roastGiftService';
import { RoastGift, RoastGiftTier } from '@/constants/RoastGiftManifest';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';

interface RoastGiftSelectorProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  streamId?: string;
  onGiftSent?: (giftData: any) => void;
}

export default function RoastGiftSelector({
  visible,
  onClose,
  receiverId,
  receiverName,
  streamId,
  onGiftSent,
}: RoastGiftSelectorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [gifts, setGifts] = useState<RoastGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<RoastGift | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedTier, setSelectedTier] = useState<RoastGiftTier | 'ALL'>('ALL');

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load gifts from manifest
      const allGifts = roastGiftService.getAllGifts();
      setGifts(allGifts);

      // Load wallet balance
      const { data: wallet } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setWalletBalance(parseFloat(wallet.balance));
      } else {
        // Create wallet if doesn't exist
        await supabase.from('wallet').insert({ user_id: user.id, balance: 0 });
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user?.id || !selectedGift) return;

    if (walletBalance < selectedGift.priceSEK) {
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
      const result = await roastGiftService.purchaseGift(
        selectedGift.giftId,
        user.id,
        receiverId,
        streamId
      );

      if (result.success) {
        if (onGiftSent) {
          onGiftSent({
            giftId: selectedGift.giftId,
            displayName: selectedGift.displayName,
            emoji: selectedGift.emoji,
            priceSEK: selectedGift.priceSEK,
            tier: selectedGift.tier,
          });
        }

        Alert.alert(
          'Gift Sent! 🔥',
          `You sent ${selectedGift.emoji} ${selectedGift.displayName} to ${receiverName}!`,
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

        // Reload wallet balance
        const { data } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setWalletBalance(parseFloat(data.balance));
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to purchase gift');
      }
    } catch (error) {
      console.error('Error purchasing gift:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const getTierColor = (tier: RoastGiftTier): string => {
    switch (tier) {
      case 'ULTRA':
        return '#FFD700';
      case 'HIGH':
        return '#FF6B6B';
      case 'MID':
        return colors.gradientEnd;
      case 'LOW':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const filteredGifts = selectedTier === 'ALL' 
    ? gifts 
    : gifts.filter(g => g.tier === selectedTier);

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
              <Text style={styles.headerTitle}>Send Roast Gift 🔥</Text>
              <Text style={styles.headerSubtitle}>to {receiverName}</Text>
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
              {(['ALL', 'LOW', 'MID', 'HIGH', 'ULTRA'] as const).map((tier) => (
                <TouchableOpacity
                  key={tier}
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
                    {tier}
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
                  const isDisabled = walletBalance < gift.priceSEK;
                  const tierColor = getTierColor(gift.tier);
                  
                  return (
                    <TouchableOpacity
                      key={gift.giftId}
                      style={[
                        styles.giftCard,
                        selectedGift?.giftId === gift.giftId && styles.giftCardSelected,
                        isDisabled && styles.giftCardDisabled,
                        { borderColor: selectedGift?.giftId === gift.giftId ? tierColor : colors.border },
                      ]}
                      onPress={() => setSelectedGift(gift)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                        <Text style={styles.tierBadgeText}>{gift.tier}</Text>
                      </View>
                      
                      <View style={styles.giftEmojiContainer}>
                        <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                      </View>
                      
                      <Text style={styles.giftName} numberOfLines={2}>
                        {gift.displayName}
                      </Text>
                      
                      <Text
                        style={[
                          styles.giftPrice,
                          { color: tierColor },
                          isDisabled && styles.giftPriceDisabled,
                        ]}
                      >
                        {gift.priceSEK} kr
                      </Text>
                      
                      {selectedGift?.giftId === gift.giftId && (
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
                  <Text style={styles.selectedGiftEmoji}>{selectedGift.emoji}</Text>
                  <View>
                    <Text style={styles.selectedGiftName}>{selectedGift.displayName}</Text>
                    <Text style={styles.selectedGiftDesc} numberOfLines={1}>
                      {selectedGift.description}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.selectedGiftPrice,
                    { color: getTierColor(selectedGift.tier) },
                  ]}
                >
                  {selectedGift.priceSEK} kr
                </Text>
              </View>
              <View style={styles.footerButton}>
                <GradientButton
                  title={purchasing ? 'SENDING...' : 'SEND GIFT 🔥'}
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
