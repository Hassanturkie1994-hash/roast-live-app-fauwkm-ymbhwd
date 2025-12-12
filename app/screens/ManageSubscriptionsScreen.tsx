
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { creatorClubService, CreatorClubMembership } from '@/app/services/creatorClubService';
import { stripeService } from '@/app/services/stripeService';

export default function ManageSubscriptionsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberships, setMemberships] = useState<CreatorClubMembership[]>([]);

  const fetchMemberships = useCallback(async () => {
    if (!user) return;

    try {
      const data = await creatorClubService.getUserMemberships(user.id);
      setMemberships(data);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMemberships();
  };

  const handleCancelSubscription = (membership: CreatorClubMembership) => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your subscription to ${membership.creator_clubs?.name}? You will lose access at the end of your billing period.`,
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!membership.stripe_subscription_id) {
              Alert.alert('Error', 'No subscription ID found');
              return;
            }

            try {
              const result = await stripeService.cancelSubscription(
                membership.stripe_subscription_id,
                false // Cancel at period end
              );

              if (result.success) {
                // Update local state
                await creatorClubService.cancelMembership(
                  membership.club_id,
                  membership.member_id,
                  false
                );

                Alert.alert(
                  'Subscription Canceled',
                  'Your subscription will remain active until the end of your billing period.'
                );

                fetchMemberships();
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel subscription');
              }
            } catch (error) {
              console.error('Error canceling subscription:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Subscriptions</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brandPrimary} />
          }
        >
          {memberships.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="star.slash"
                android_material_icon_name="star_border"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No active subscriptions</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Join a creator&apos;s VIP club to get exclusive benefits
              </Text>
            </View>
          ) : (
            <View style={styles.membershipsList}>
              {memberships.map((membership, index) => (
                <View
                  key={index}
                  style={[
                    styles.membershipCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.membershipHeader}>
                    <View style={styles.membershipInfo}>
                      <Text style={[styles.clubName, { color: colors.text }]}>
                        {membership.creator_clubs?.name || 'Unknown Club'}
                      </Text>
                      {membership.creator_clubs?.tag && (
                        <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                          <Text style={styles.badgeText}>{membership.creator_clubs.tag}</Text>
                        </View>
                      )}
                    </View>
                    {membership.is_active && !membership.cancel_at_period_end && (
                      <View style={[styles.statusBadge, { backgroundColor: `${colors.brandPrimary}20` }]}>
                        <Text style={[styles.statusText, { color: colors.brandPrimary }]}>Active</Text>
                      </View>
                    )}
                    {membership.cancel_at_period_end && (
                      <View style={[styles.statusBadge, { backgroundColor: '#FFC10720' }]}>
                        <Text style={[styles.statusText, { color: '#FFC107' }]}>Canceling</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.membershipDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="calendar_today"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Started: {formatDate(membership.started_at)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="arrow.clockwise"
                        android_material_icon_name="refresh"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {membership.cancel_at_period_end
                          ? `Ends: ${formatDate(membership.renews_at)}`
                          : `Renews: ${formatDate(membership.renews_at)}`}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="creditcard"
                        android_material_icon_name="credit_card"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {((membership.creator_clubs?.monthly_price_cents || 0) / 100).toFixed(2)}{' '}
                        {membership.creator_clubs?.currency || 'SEK'}/month
                      </Text>
                    </View>
                  </View>

                  {membership.is_active && !membership.cancel_at_period_end && (
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: colors.border }]}
                      onPress={() => handleCancelSubscription(membership)}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                        Cancel Subscription
                      </Text>
                    </TouchableOpacity>
                  )}

                  {membership.cancel_at_period_end && (
                    <View style={[styles.cancelNotice, { backgroundColor: colors.backgroundAlt }]}>
                      <IconSymbol
                        ios_icon_name="info.circle"
                        android_material_icon_name="info"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.cancelNoticeText, { color: colors.textSecondary }]}>
                        Your subscription will end on {formatDate(membership.renews_at)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Subscriptions are managed through Stripe. You can update your payment method or view billing history in your Stripe customer portal.
            </Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  membershipsList: {
    padding: 20,
    gap: 16,
  },
  membershipCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  membershipInfo: {
    flex: 1,
    gap: 8,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  membershipDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  cancelNoticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});