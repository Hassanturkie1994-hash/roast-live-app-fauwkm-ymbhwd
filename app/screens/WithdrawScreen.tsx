
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { identityVerificationService } from '@/app/services/identityVerificationService';
import { payoutService } from '@/app/services/payoutService';

export default function WithdrawScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [verificationReason, setVerificationReason] = useState<string | null>(null);

  const checkVerificationStatus = useCallback(async () => {
    if (!user) return;

    try {
      setCheckingVerification(true);
      const verificationCheck = await identityVerificationService.canReceivePayouts(user.id);
      
      setCanWithdraw(verificationCheck.canReceive);
      if (!verificationCheck.canReceive) {
        setVerificationReason(verificationCheck.reason || 'Identity verification required');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setCanWithdraw(false);
      setVerificationReason('Failed to check verification status');
    } finally {
      setCheckingVerification(false);
    }
  }, [user]);

  const fetchWalletBalance = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }

      if (data) {
        setWalletBalance(parseFloat(data.balance));
      }
    } catch (error) {
      console.error('Error in fetchWalletBalance:', error);
    }
  }, [user]);

  useEffect(() => {
    checkVerificationStatus();
    fetchWalletBalance();
  }, [checkVerificationStatus, fetchWalletBalance]);

  const handleWithdraw = async () => {
    if (!user) return;

    if (!canWithdraw) {
      Alert.alert(
        'Verification Required',
        verificationReason || 'You must complete identity verification before withdrawing funds.',
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

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount > walletBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (withdrawAmount < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is 100 SEK');
      return;
    }

    setLoading(true);

    try {
      const result = await payoutService.createPayoutRequest(
        user.id,
        Math.round(withdrawAmount * 100), // Convert to cents
        user.user_metadata?.full_name || user.email || 'Unknown',
        'SE' // Default to Sweden, should be from user profile
      );

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create withdrawal request');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Withdrawal request submitted successfully. It will be processed within 3-5 business days.');
      router.back();
    } catch (error) {
      console.error('Error in handleWithdraw:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingVerification) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.gradientEnd} />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!canWithdraw && (
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

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Withdrawal Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={canWithdraw}
              />
            </View>
            <View style={styles.quickAmounts}>
              <TouchableOpacity
                style={[styles.quickAmountButton, !canWithdraw && styles.quickAmountButtonDisabled]}
                onPress={() => canWithdraw && setAmount((walletBalance * 0.25).toFixed(2))}
                disabled={!canWithdraw}
              >
                <Text style={styles.quickAmountText}>25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAmountButton, !canWithdraw && styles.quickAmountButtonDisabled]}
                onPress={() => canWithdraw && setAmount((walletBalance * 0.5).toFixed(2))}
                disabled={!canWithdraw}
              >
                <Text style={styles.quickAmountText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAmountButton, !canWithdraw && styles.quickAmountButtonDisabled]}
                onPress={() => canWithdraw && setAmount((walletBalance * 0.75).toFixed(2))}
                disabled={!canWithdraw}
              >
                <Text style={styles.quickAmountText}>75%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAmountButton, !canWithdraw && styles.quickAmountButtonDisabled]}
                onPress={() => canWithdraw && setAmount(walletBalance.toFixed(2))}
                disabled={!canWithdraw}
              >
                <Text style={styles.quickAmountText}>100%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              Withdrawals are processed within 3-5 business days. Minimum withdrawal amount is 100 SEK. A small processing fee may apply.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title={loading ? 'PROCESSING...' : 'WITHDRAW'}
              onPress={handleWithdraw}
              disabled={loading || !amount || parseFloat(amount) <= 0 || !canWithdraw}
            />
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
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
  verificationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: '#FFA500',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    margin: 20,
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
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickAmountButtonDisabled: {
    opacity: 0.5,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
