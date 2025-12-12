
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { stripeVIPService } from '@/app/services/stripeVIPService';
import { useAuth } from '@/contexts/AuthContext';

interface JoinVIPClubModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  clubName: string;
  badgeColor: string;
}

export default function JoinVIPClubModal({
  visible,
  onClose,
  creatorId,
  creatorName,
  clubName,
  badgeColor,
}: JoinVIPClubModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleJoinClub = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a VIP club');
      return;
    }

    setIsProcessing(true);
    try {
      // Create Stripe checkout session
      const result = await stripeVIPService.createCheckoutSession(
        creatorId,
        user.id,
        'https://natively.dev/vip-success', // Success URL
        'https://natively.dev/vip-cancel' // Cancel URL
      );

      if (!result.success || !result.data) {
        Alert.alert('Error', result.error || 'Failed to create checkout session');
        return;
      }

      // Open Stripe checkout (in production, this would open a web view or redirect)
      console.log('Checkout URL:', result.data.url);
      Alert.alert(
        'Checkout Ready',
        'In production, this would open Stripe checkout. For now, subscription will be created directly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // For demo purposes, simulate successful payment
              onClose();
              Alert.alert(
                'Success!',
                `You are now a member of ${creatorName}'s VIP Club!`
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error joining club:', error);
      Alert.alert('Error', 'Failed to join VIP club. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Join VIP Club</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Club Info */}
          <View style={styles.clubInfo}>
            <View style={[styles.badgePreview, { backgroundColor: badgeColor }]}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.badgeText}>{clubName.toUpperCase()}</Text>
            </View>
            <Text style={[styles.creatorName, { color: colors.text }]}>
              {creatorName}'s VIP Club
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <Text style={[styles.benefitsTitle, { color: colors.text }]}>
              VIP Member Benefits
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Exclusive VIP badge in streams
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Priority visibility in chat
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Exclusive club announcements
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Support your favorite creator
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={[styles.pricing, { backgroundColor: colors.backgroundAlt }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                Monthly Subscription
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>$3.00</Text>
            </View>
            <Text style={[styles.priceNote, { color: colors.textSecondary }]}>
              Cancel anytime • 70% goes to creator
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinClub}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="favorite"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.joinButtonText}>Join VIP Club</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    alignItems: 'center',
    gap: 12,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '700',
  },
  benefits: {
    gap: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  pricing: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  joinButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});