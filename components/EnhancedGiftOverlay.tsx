
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EnhancedGiftOverlayProps {
  visible: boolean;
  senderName: string;
  giftName: string;
  giftEmoji: string;
  amount: number;
  onComplete: () => void;
}

export default function EnhancedGiftOverlay({
  visible,
  senderName,
  giftName,
  giftEmoji,
  amount,
  onComplete,
}: EnhancedGiftOverlayProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [fadeAnim, scaleAnim, slideAnim, onComplete]);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate out after 3 seconds
      const timeout = setTimeout(() => {
        animateOut();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, animateOut]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.brandPrimary }]}>
          <Text style={styles.emoji}>{giftEmoji}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: colors.text }]}>
              <Text style={[styles.senderName, { color: colors.brandPrimary }]}>{senderName}</Text>
              {' sent '}
              <Text style={[styles.giftName, { color: colors.brandPrimary }]}>{giftName}</Text>
            </Text>
            <Text style={[styles.amount, { color: colors.brandPrimary }]}>
              worth {amount} kr!
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 3,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxWidth: screenWidth - 40,
  },
  emoji: {
    fontSize: 56,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 24,
  },
  senderName: {
    fontWeight: '800',
  },
  giftName: {
    fontWeight: '800',
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
  },
});