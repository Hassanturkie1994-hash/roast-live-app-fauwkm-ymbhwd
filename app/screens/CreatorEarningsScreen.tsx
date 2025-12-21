
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { creatorEarningsService } from '@/app/services/creatorEarningsService';
import { identityVerificationService } from '@/app/services/identityVerificationService';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useRouter } from 'expo-router';

export default function CreatorEarningsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [taxForm, setTaxForm] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [canReceivePayouts, setCanReceivePayouts] = useState(false);
  const [verificationReason, setVerificationReason] = useState<string | null>(null);

  const checkVerificationStatus = useCallback(async () => {
    if (!user) return;

    try {
      const verificationCheck = await identityVerificationService.canReceivePayouts(user.id);
      setCanReceivePayouts(verificationCheck.canReceive);
      if (!verificationCheck.canReceive) {
        setVerificationReason(verificationCheck.reason || 'Identity verification required');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setCanReceivePayouts(false);
      setVerificationReason('Failed to check verification status');
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [summaryResult, taxFormResult, payoutsResult] = await Promise.all([
        creatorEarningsService.getEarningsSummary(user.id),
        creatorEarningsService.getTaxForm(user.id),
        creatorEarningsService.getPayouts(user.id),
      ]);

      if (summaryResult.success) {
        setSummary(summaryResult.summary);
      }

      if (taxFormResult.success) {
        setTaxForm(taxFormResult.taxForm);
      }

      if (payoutsResult.success) {
        setPayouts(payoutsResult.payouts || []);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkVerificationStatus();
    loadData();
  }, [checkVerificationStatus, loadData]);

  const handleRequestPayout = () => {
    if (!canReceivePayouts) {
      Alert.alert(
        'Verification Required',
        verificationReason || 'You must complete identity verification before requesting a payout.',
        [
          {
            text: 'Verify Now',
            onPress: () => router.push('/screens/IdentityVerificationScreen' as any),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!taxForm || !taxForm.verified) {
      Alert.alert(
        'Tax Form Required',
        'You must submit and verify your tax form before requesting a payout.',
        [
          {
            text: 'Submit Tax Form',
            onPress: () => {
              Alert.alert('Tax Form', 'Tax form submission screen coming soon');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    router.push('/screens/WithdrawScreen' as any);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} SEK`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E30052" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Creator Earnings</Text>

        {/* Verification Warning */}
        {!canReceivePayouts && (
          <View style={styles.verificationWarning}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color="#FFA500"
            />
            <View style={styles.verificationWarningText}>
              <Text style={styles.verificationWarningTitle}>Verification Required</Text>
              <Text style={styles.verificationWarningMessage}>{verificationReason}</Text>
            </View>
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => router.push('/screens/IdentityVerificationScreen' as any)}
            >
              <Text style={styles.verifyButtonText}>Verify Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly Earnings</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.monthlyEarnings || 0)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Lifetime Earnings</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.lifetimeEarnings || 0)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending Payouts</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.pendingPayouts || 0)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.totalPaid || 0)}
            </Text>
          </View>
        </View>

        {/* Tax Form Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Information</Text>
          {taxForm ? (
            <View style={styles.taxFormCard}>
              <View style={styles.taxFormRow}>
                <Text style={styles.taxFormLabel}>Form Type:</Text>
                <Text style={styles.taxFormValue}>{taxForm.form_type}</Text>
              </View>
              <View style={styles.taxFormRow}>
                <Text style={styles.taxFormLabel}>Status:</Text>
                <Text
                  style={[
                    styles.taxFormValue,
                    taxForm.verified ? styles.verified : styles.pending,
                  ]}
                >
                  {taxForm.verified ? 'Verified ✓' : 'Pending Review'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noTaxFormCard}>
              <Text style={styles.noTaxFormText}>
                No tax form submitted. You must submit a tax form before requesting payouts.
              </Text>
              <TouchableOpacity
                style={styles.submitTaxFormButton}
                onPress={() => Alert.alert('Tax Form', 'Tax form submission coming soon')}
              >
                <Text style={styles.submitTaxFormButtonText}>Submit Tax Form</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payout History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          {payouts.length > 0 ? (
            payouts.map((payout) => (
              <View key={payout.id} style={styles.payoutCard}>
                <View style={styles.payoutHeader}>
                  <Text style={styles.payoutAmount}>
                    {formatCurrency(Number(payout.amount))}
                  </Text>
                  <Text
                    style={[
                      styles.payoutStatus,
                      payout.status === 'paid' ? styles.statusPaid : styles.statusPending,
                    ]}
                  >
                    {payout.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.payoutDetails}>
                  <Text style={styles.payoutMethod}>Method: {payout.method}</Text>
                  <Text style={styles.payoutDate}>
                    {new Date(payout.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noPayoutsText}>No payout history yet</Text>
          )}
        </View>

        {/* Request Payout Button */}
        <GradientButton
          title="Request Payout"
          onPress={handleRequestPayout}
          style={styles.requestButton}
          disabled={!canReceivePayouts}
        />

        {/* Download Statement Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => Alert.alert('Download', 'Monthly statement download coming soon')}
        >
          <Text style={styles.downloadButtonText}>Download Monthly Statement</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  verificationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: '#FFA500',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  verificationWarningText: {
    flex: 1,
    gap: 4,
  },
  verificationWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  verificationWarningMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  verifyButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  taxFormCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  taxFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taxFormLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  taxFormValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  verified: {
    color: '#4CAF50',
  },
  pending: {
    color: '#FFA726',
  },
  noTaxFormCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  noTaxFormText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  submitTaxFormButton: {
    backgroundColor: '#E30052',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitTaxFormButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  payoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  payoutStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPaid: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4CAF50',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    color: '#FFA726',
  },
  payoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payoutMethod: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  payoutDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noPayoutsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  requestButton: {
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E30052',
  },
  downloadButtonText: {
    color: '#E30052',
    fontSize: 16,
    fontWeight: '600',
  },
});
