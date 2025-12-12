
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { premiumSubscriptionService, PremiumSubscription } from '@/app/services/premiumSubscriptionService';
import { supabase } from '@/app/integrations/supabase/client';

export default function PremiumMembershipScreen() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPremiumStatus();
    }
  }, [user]);

  const fetchPremiumStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const isPremiumUser = await premiumSubscriptionService.isPremiumMember(user.id);
      setIsPremium(isPremiumUser);

      if (isPremiumUser) {
        const sub = await premiumSubscriptionService.getPremiumSubscription(user.id);
        setSubscription(sub);
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivatePremium = async (provider: 'stripe' | 'paypal') => {
    if (!user) return;

    setIsProcessing(true);

    try {
      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
        body: {
          user_id: user.id,
          price_id: 'price_premium_89sek', // This should be configured in Stripe
          success_url: 'roastlive://premium-success',
          cancel_url: 'roastlive://premium-cancel',
          subscription_type: 'premium',
          provider: provider,
        },
      });

      if (error) {
        Alert.alert('Error', 'Failed to create checkout session. Please try again.');
        console.error('Checkout error:', error);
        return;
      }

      // In a real app, you would open the checkout URL in a browser or WebView
      Alert.alert(
        'Checkout',
        `Opening ${provider === 'stripe' ? 'Stripe' : 'PayPal'} checkout...`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Simulate successful subscription for demo
              // In production, this would be handled by webhook
              Alert.alert(
                'Demo Mode',
                'In production, you would complete payment through Stripe/PayPal. For demo purposes, would you like to simulate a successful subscription?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Simulate Success',
                    onPress: async () => {
                      const result = await premiumSubscriptionService.createPremiumSubscription(
                        user.id,
                        provider,
                        `demo_sub_${Date.now()}`,
                        `demo_cus_${Date.now()}`
                      );

                      if (result.success) {
                        Alert.alert('Success', 'Welcome to PREMIUM! 🎉');
                        fetchPremiumStatus();
                      } else {
                        Alert.alert('Error', result.error || 'Failed to activate premium');
                      }
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error activating premium:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!user || !subscription) return;

    Alert.alert(
      'Cancel PREMIUM Subscription',
      `Your PREMIUM benefits will remain active until ${new Date(subscription.renewed_at).toLocaleDateString()}. Are you sure you want to cancel?`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            const result = await premiumSubscriptionService.cancelPremiumSubscription(user.id);
            setIsProcessing(false);

            if (result.success) {
              Alert.alert('Subscription Canceled', 'Your PREMIUM subscription has been canceled.');
              fetchPremiumStatus();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const handleUpgradePayment = () => {
    Alert.alert('Upgrade Payment Method', 'This feature will open payment settings.');
  };

  const handleSupport = () => {
    router.push('/screens/ChatScreen' as any);
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PREMIUM Membership</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const benefits = premiumSubscriptionService.getPremiumBenefits();

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PREMIUM Membership</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!isPremium ? (
          <>
            {/* Hero Banner */}
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBanner}
            >
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace_premium"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.heroTitle}>Unlock Premium</Text>
              <Text style={styles.heroSubtitle}>
                Boost visibility, status, and features instantly
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>89 SEK</Text>
                <Text style={styles.priceLabel}>per month</Text>
              </View>
              <View style={styles.heroFeatures}>
                <View style={styles.heroFeature}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroFeatureText}>Recurring monthly subscription</Text>
                </View>
                <View style={styles.heroFeature}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroFeatureText}>Auto-renewal</Text>
                </View>
                <View style={styles.heroFeature}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroFeatureText}>Secure payments</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Payment Buttons */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.activateButton, isProcessing && styles.buttonDisabled]}
                onPress={() => handleActivatePremium('stripe')}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="creditcard.fill"
                        android_material_icon_name="credit_card"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.activateButtonText}>
                        Activate Premium – 89 SEK/mo (Stripe)
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.activateButton, isProcessing && styles.buttonDisabled]}
                onPress={() => handleActivatePremium('paypal')}
                disabled={isProcessing}
              >
                <View style={[styles.buttonGradient, styles.paypalButton]}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="dollarsign.circle.fill"
                        android_material_icon_name="account_balance"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.activateButtonText}>
                        Activate Premium – 89 SEK/mo (PayPal)
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Unlockable Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={20}
                  color="#FFD700"
                />
                {' '}Unlockable Benefits
              </Text>
              <Text style={styles.sectionSubtitle}>
                Everything you get with PREMIUM membership
              </Text>

              <View style={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <IconSymbol
                        ios_icon_name={benefit.icon}
                        android_material_icon_name="star"
                        size={24}
                        color="#FFD700"
                      />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Premium Exclusive Offers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <IconSymbol
                  ios_icon_name="gift.fill"
                  android_material_icon_name="card_giftcard"
                  size={20}
                  color={colors.gradientEnd}
                />
                {' '}Premium Exclusive Offers
              </Text>

              <View style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <IconSymbol
                    ios_icon_name="tag.fill"
                    android_material_icon_name="local_offer"
                    size={20}
                    color={colors.gradientEnd}
                  />
                  <Text style={styles.offerTitle}>Discounted Creator Subscriptions</Text>
                </View>
                <Text style={styles.offerDescription}>
                  Normal: VIP club costs $3.00/month
                </Text>
                <Text style={styles.offerHighlight}>
                  Premium: Get 20% discount → $2.40/month
                </Text>
              </View>

              <View style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <IconSymbol
                    ios_icon_name="percent"
                    android_material_icon_name="percent"
                    size={20}
                    color={colors.gradientEnd}
                  />
                  <Text style={styles.offerTitle}>Reduced Platform Fee</Text>
                </View>
                <Text style={styles.offerDescription}>
                  Normal: Platform takes 30% when gifting
                </Text>
                <Text style={styles.offerHighlight}>
                  Premium: Platform takes only 22%
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Active Subscription Management */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeCard}
              >
                <IconSymbol
                  ios_icon_name="crown.fill"
                  android_material_icon_name="workspace_premium"
                  size={48}
                  color="#FFFFFF"
                />
                <Text style={styles.activeTitle}>Premium Active</Text>
                <Text style={styles.activeSubtitle}>You&apos;re enjoying all premium benefits!</Text>
              </LinearGradient>
            </View>

            {/* Subscription Details */}
            {subscription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membership Details</Text>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {subscription.status === 'active' ? 'Premium Active' : subscription.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Since</Text>
                    <Text style={styles.detailValue}>
                      {new Date(subscription.started_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Renews</Text>
                    <Text style={styles.detailValue}>
                      {new Date(subscription.renewed_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider</Text>
                    <Text style={styles.detailValue}>
                      {subscription.subscription_provider === 'stripe' ? 'Stripe' : 'PayPal'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.detailValue}>89 SEK/month</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Management Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Manage Subscription</Text>

              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={handleCancelSubscription}
                disabled={isProcessing}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={colors.gradientEnd}
                />
                <Text style={styles.actionButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={handleUpgradePayment}
                disabled={isProcessing}
              >
                <IconSymbol
                  ios_icon_name="creditcard.fill"
                  android_material_icon_name="credit_card"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.actionButtonText}>Upgrade Payment Method</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={handleSupport}
                disabled={isProcessing}
              >
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="chat"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.actionButtonText}>Support & Billing Chat</Text>
              </TouchableOpacity>

              <View style={styles.cancellationNote}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.cancellationNoteText}>
                  Canceling will not immediately deactivate your Premium. You&apos;ll retain access until your billing period ends.
                </Text>
              </View>
            </View>

            {/* Active Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Active Benefits</Text>

              <View style={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <IconSymbol
                        ios_icon_name={benefit.icon}
                        android_material_icon_name="star"
                        size={24}
                        color="#FFD700"
                      />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  heroBanner: {
    margin: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  heroFeatures: {
    marginTop: 16,
    gap: 8,
    alignSelf: 'stretch',
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroFeatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  activateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  paypalButton: {
    backgroundColor: '#0070BA',
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  offerCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  offerDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  offerHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  activeCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  detailsCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cancellationNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancellationNoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});