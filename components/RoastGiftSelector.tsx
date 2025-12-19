
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
import { ROAST_GIFTS } from '@/constants/RoastGiftManifest';

interface RoastGiftSelectorProps {
  onSelectGift: (giftId: string) => void;
  creatorId: string;
}

export default function RoastGiftSelector({
  onSelectGift,
  creatorId,
}: RoastGiftSelectorProps) {
  const [gifts, setGifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      setGifts(ROAST_GIFTS);
    } catch (error) {
      console.error('Error loading gifts:', error);
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
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {gifts.map((gift) => (
        <TouchableOpacity
          key={gift.giftId}
          style={styles.giftCard}
          onPress={() => onSelectGift(gift.giftId)}
        >
          <Text style={styles.emoji}>{gift.emoji}</Text>
          <Text style={styles.name}>{gift.displayName}</Text>
          <Text style={styles.price}>{gift.priceSEK} kr</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
});
