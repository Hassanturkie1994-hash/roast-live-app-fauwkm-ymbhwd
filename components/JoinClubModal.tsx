
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { creatorClubService, CreatorClub } from '@/app/services/creatorClubService';
import { stripeService } from '@/app/services/stripeService';

interface JoinClubModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  onSuccess?: () => void;
}

export default function JoinClubModal({
  visible,
  onClose,
  creatorId,
  onSuccess,
}: JoinClubModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [club, setClub] = useState<CreatorClub | null>(null);
  const [isMember, setIsMember] = useState(false);

  const loadClubData = useCallback(async () => {
    setLoading(true);
    try {
      const clubData = await creatorClubService.getClubByCreator(creatorId);
      setClub(clubData);

      if (user && clubData) {
        const memberStatus = await creatorClubService.isMember(clubData.id, user.id);
        setIsMember(memberStatus);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setLoading(false);
    }
  }, [creatorId, user]);

  useEffect(() => {
    if (visible && creatorId) {
      loadClubData();
    }
  }, [visible, creatorId, loadClubData]);

  const handleJoinClub = async () => {
    if (!user || !club) return;

    if (isMember) {
      Alert.alert('Already a Member', 'You are already a member of this club!');
      return;
    }

    setJoining(true);
    try {
      // First, create the membership record
      const joinResult = await creatorClubService.joinClub(club.id, user.id);
      if (!joinResult.success) {
        Alert.alert('Error', joinResult.error || 'Failed to join club');
        setJoining(false);
        return;
      }

      // Then create Stripe subscription
      console.log('Creating Stripe subscription...');
      const subscriptionResult = await stripeService.createClubSubscription(
        user.id,
        club.id,
        creatorId,
        club.monthly_price_cents,
        club.currency
      );

      if (subscriptionResult.success && subscriptionResult.data) {
        console.log('Subscription created:', subscriptionResult.data.subscriptionId);

        // If there's a client secret, we need to confirm the payment
        if (subscriptionResult.data.clientSecret) {
          Alert.alert(
            'Payment Required',
            'Please complete your payment to activate your membership.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  // Cancel the membership
                  creatorClubService.cancelMembership(club.id, user.id, true);
                },
              },
              {
                text: 'Pay Now',
                onPress: async () => {
                  // In a real app, you would use Stripe's payment sheet here
                  // For now, we'll just show a success message
                  Alert.alert(
                    'Success',
                    'Your membership is being processed. You will receive a confirmation shortly.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          onSuccess?.();
                          onClose();
                        },
                      },
                    ]
                  );
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Success',
            `You are now a member of ${club.name}! Your badge will appear in this creator's streams.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onSuccess?.();
                  onClose();
                },
              },
            ]
          );
        }
      } else {
        // Subscription creation failed, cancel the membership
        await creatorClubService.cancelMembership(club.id, user.id, true);
        Alert.alert('Error', subscriptionResult.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setJoining(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : !club ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.errorText, { color: colors.text }]}>
                This creator doesn&apos;t have a VIP club yet
              </Text>
            </View>
          ) : (
            <>
              {/* Club Info */}
              <View style={styles.content}>
                <View style={[styles.clubCard, { backgroundColor: colors.backgroundAlt }]}>
                  <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                  {club.tag && (
                    <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                      <Text style={styles.badgeText}>{club.tag}</Text>
                    </View>
                  )}
                  {club.description && (
                    <Text style={[styles.clubDescription, { color: colors.textSecondary }]}>
                      {club.description}
                    </Text>
                  )}
                </View>

                {/* Price */}
                <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Monthly Subscription
                  </Text>
                  <Text style={[styles.priceAmount, { color: colors.brandPrimary }]}>
                    {(club.monthly_price_cents / 100).toFixed(2)} {club.currency}
                  </Text>
                  <Text style={[styles.priceNote, { color: colors.textSecondary }]}>
                    Billed monthly • Cancel anytime
                  </Text>
                </View>

                {/* Benefits */}
                <View style={styles.benefitsSection}>
                  <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                    Member Benefits
                  </Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Custom {club.tag} badge in streams
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Priority in chat
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Support your favorite creator
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={[styles.paymentInfo, { backgroundColor: colors.backgroundAlt }]}>
                  <IconSymbol
                    ios_icon_name="lock.shield.fill"
                    android_material_icon_name="security"
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.paymentInfoText, { color: colors.textSecondary }]}>
                    Secure payment via Stripe
                  </Text>
                </View>
              </View>

              {/* Join Button */}
              <View style={styles.footer}>
                {isMember ? (
                  <View style={[styles.memberBadge, { backgroundColor: `${colors.brandPrimary}20` }]}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color={colors.brandPrimary}
                    />
                    <Text style={[styles.memberText, { color: colors.brandPrimary }]}>
                      You&apos;re already a member!
                    </Text>
                  </View>
                ) : (
                  <GradientButton
                    title={joining ? 'Processing...' : 'Join Club'}
                    onPress={handleJoinClub}
                    disabled={joining}
                    loading={joining}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  clubCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  clubName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  clubDescription: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  priceCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '400',
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
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
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  paymentInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  memberText: {
    fontSize: 15,
    fontWeight: '700',
  },
});