
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import GradientButton from '@/components/GradientButton';
import { stripeService } from '@/app/services/stripeService';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function AddBalanceScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const getAmountInCents = (): number | null => {
    if (selectedAmount) {
      return selectedAmount * 100;
    }
    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (!isNaN(amount) && amount > 0) {
        return Math.round(amount * 100);
      }
    }
    return null;
  };

  const handleAddBalance = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add balance');
      return;
    }

    const amountCents = getAmountInCents();
    if (!amountCents) {
      Alert.alert('Error', 'Please select or enter a valid amount');
      return;
    }

    if (amountCents < 100) {
      Alert.alert('Error', 'Minimum amount is 1 SEK');
      return;
    }

    if (amountCents > 100000) {
      Alert.alert('Error', 'Maximum amount is 1000 SEK');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating checkout session for amount:', amountCents);

      const result = await stripeService.createWalletTopUpSession(
        user.id,
        amountCents,
        'SEK'
      );

      if (result.success && result.data) {
        console.log('Checkout session created:', result.data.sessionId);

        // Open Stripe checkout in browser
        const supported = await Linking.canOpenURL(result.data.url);
        if (supported) {
          await Linking.openURL(result.data.url);
          
          // Show info message
          Alert.alert(
            'Payment Processing',
            'Complete your payment in the browser. Your balance will be updated automatically.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Cannot open payment page');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Balance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: `${colors.brandPrimary}15` }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            Add funds to your wallet to purchase gifts and support creators during live streams.
          </Text>
        </View>

        {/* Preset Amounts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Amount (SEK)</Text>
          <View style={styles.amountGrid}>
            {PRESET_AMOUNTS.map((amount, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.amountButton,
                  {
                    backgroundColor: selectedAmount === amount ? colors.brandPrimary : colors.backgroundAlt,
                    borderColor: selectedAmount === amount ? colors.brandPrimary : colors.border,
                  },
                ]}
                onPress={() => handleAmountSelect(amount)}
              >
                <Text
                  style={[
                    styles.amountButtonText,
                    {
                      color: selectedAmount === amount ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {amount} kr
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Or Enter Custom Amount</Text>
          <View style={styles.customAmountContainer}>
            <Text style={[styles.currencySymbol, { color: colors.text }]}>kr</Text>
            <TextInput
              style={[
                styles.customAmountInput,
                {
                  backgroundColor: colors.backgroundAlt,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              placeholder="Enter amount (1-1000)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Minimum: 1 SEK • Maximum: 1000 SEK
          </Text>
        </View>

        {/* Payment Summary */}
        {displayAmount > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {displayAmount.toFixed(2)} SEK
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' }]}>
                Total
              </Text>
              <Text style={[styles.summaryValue, { color: colors.brandPrimary, fontWeight: '800' }]}>
                {displayAmount.toFixed(2)} SEK
              </Text>
            </View>
          </View>
        )}

        {/* Payment Methods Info */}
        <View style={[styles.paymentMethodsCard, { backgroundColor: colors.backgroundAlt }]}>
          <Text style={[styles.paymentMethodsTitle, { color: colors.text }]}>
            Accepted Payment Methods
          </Text>
          <View style={styles.paymentMethodsList}>
            <View style={styles.paymentMethodItem}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="credit_card"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                Credit/Debit Card
              </Text>
            </View>
            <View style={styles.paymentMethodItem}>
              <IconSymbol
                ios_icon_name="apple.logo"
                android_material_icon_name="apple"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>Apple Pay</Text>
            </View>
            <View style={styles.paymentMethodItem}>
              <IconSymbol
                ios_icon_name="g.circle.fill"
                android_material_icon_name="g_translate"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>Google Pay</Text>
            </View>
          </View>
        </View>

        {/* Security Info */}
        <View style={[styles.securityCard, { backgroundColor: colors.backgroundAlt }]}>
          <IconSymbol
            ios_icon_name="lock.shield.fill"
            android_material_icon_name="security"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Payments are securely processed by Stripe. Your payment information is never stored on our servers.
          </Text>
        </View>

        {/* Add Balance Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={loading ? 'Processing...' : `Add ${displayAmount.toFixed(2)} SEK`}
            onPress={handleAddBalance}
            disabled={loading || displayAmount === 0}
            loading={loading}
          />
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  customAmountInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 8,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  paymentMethodsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '400',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
});