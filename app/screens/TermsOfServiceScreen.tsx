
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { termsPrivacyService } from '@/app/services/termsPrivacyService';
import GradientButton from '@/components/GradientButton';

export default function TermsOfServiceScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAcceptanceStatus = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const acceptance = await termsPrivacyService.getTermsAcceptance(user.id);
    if (acceptance) {
      setHasAccepted(true);
      setAcceptedDate(acceptance.accepted_at);
      setAgreed(true);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAcceptanceStatus();
  }, [loadAcceptanceStatus]);

  const handleAccept = async () => {
    if (!user) return;
    if (!agreed) {
      Alert.alert('Agreement Required', 'Please check the box to agree to the Terms of Service.');
      return;
    }

    const result = await termsPrivacyService.acceptTermsOfService(user.id);
    if (result.success) {
      Alert.alert('Success', 'You have accepted the Terms of Service.');
      await loadAcceptanceStatus();
    } else {
      Alert.alert('Error', result.error || 'Failed to save acceptance.');
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Usage Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {hasAccepted && acceptedDate && (
          <View style={[styles.acceptedBanner, { backgroundColor: colors.brandPrimary + '20', borderColor: colors.brandPrimary }]}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check_circle"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.acceptedText, { color: colors.brandPrimary }]}>
              Accepted on {new Date(acceptedDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Platform Usage Rules</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Users are responsible for all published content.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Content must follow safety guidelines.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Users must be 16+ to stream or participate.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Earnings belong to the owner of the account receiving gifts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Behavior Rules</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - No harassment, abuse, or discrimination.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - No revealing private or confidential data.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Roast content is entertainment only, not harassment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Purchases and Gifting Terms</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Digital assets (gifts) cannot be refunded unless fraudulent.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Credit balance cannot be transferred to other users unless platform allows.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Platform takes commission on all purchases and payouts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Account Responsibility</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - User must secure login credentials.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Platform reserves right to suspend users violating policy.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Users agree content may be removed if breaking rules.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Appeals Flow Summary</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Users can appeal strikes and violations through Settings → Appeals & Violations.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Appeals are reviewed by administrators.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Users will be notified of appeal decisions via inbox.
          </Text>
        </View>

        {!hasAccepted && (
          <>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: agreed ? colors.brandPrimary : 'transparent' }]}>
                {agreed && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                I Agree to Terms of Service
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Accept Terms"
                onPress={handleAccept}
                disabled={!agreed || loading}
              />
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
});