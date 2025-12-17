
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { termsPrivacyService } from '@/app/services/termsPrivacyService';

export default function TermsOfServiceScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAcceptanceStatus = useCallback(async () => {
    if (!user) return;

    try {
      const accepted = await termsPrivacyService.hasAcceptedTerms(user.id);
      setHasAccepted(accepted);
    } catch (error) {
      console.error('Error loading acceptance status:', error);
    }
  }, [user]);

  useEffect(() => {
    loadAcceptanceStatus();
  }, [loadAcceptanceStatus]);

  const handleAccept = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await termsPrivacyService.recordTermsAcceptance(user.id);
      
      if (result.success) {
        setHasAccepted(true);
        Alert.alert('Success', 'Terms of Service accepted');
      } else {
        Alert.alert('Error', result.error || 'Failed to record acceptance');
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
      Alert.alert('Error', 'Failed to accept terms');
    } finally {
      setLoading(false);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Roast Live Terms of Service</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0 • Last updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              By accessing or using Roast Live, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. User Accounts</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Content Guidelines</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Users must comply with our Community Guidelines. Prohibited content includes but is not limited to: harassment, hate speech, adult content, dangerous behavior, spam, and copyright violations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Streaming Rules</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Streamers must follow all platform rules and content labels. Violations may result in warnings, timeouts, or permanent bans.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Virtual Gifts & Payments</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              All virtual gift purchases are final. Creators receive 70% of gift revenue. Platform fees are non-refundable.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Termination</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              We reserve the right to terminate or suspend accounts that violate these terms or engage in harmful behavior.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Limitation of Liability</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Roast Live is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from use of the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to Terms</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.
            </Text>
          </View>

          {hasAccepted && (
            <View style={[styles.acceptedBanner, { backgroundColor: `${colors.brandPrimary}15`, borderColor: colors.brandPrimary }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={[styles.acceptedText, { color: colors.brandPrimary }]}>
                You have accepted the Terms of Service
              </Text>
            </View>
          )}

          {!hasAccepted && (
            <View style={styles.acceptButtonContainer}>
              <GradientButton
                title={loading ? 'Accepting...' : 'Accept Terms of Service'}
                onPress={handleAccept}
                size="large"
                disabled={loading}
              />
            </View>
          )}
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
    marginTop: 24,
  },
  acceptedText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  acceptButtonContainer: {
    marginTop: 24,
  },
});
