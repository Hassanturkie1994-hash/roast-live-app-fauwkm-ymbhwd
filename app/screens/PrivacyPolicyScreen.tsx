
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

export default function PrivacyPolicyScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcceptanceStatus();
  }, [user]);

  const loadAcceptanceStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    const acceptance = await termsPrivacyService.getPrivacyAcceptance(user.id);
    if (acceptance) {
      setHasAccepted(true);
      setAcceptedDate(acceptance.accepted_at);
      setAgreed(true);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user) return;
    if (!agreed) {
      Alert.alert('Agreement Required', 'Please check the box to accept the Privacy Policy.');
      return;
    }

    const result = await termsPrivacyService.acceptPrivacyPolicy(user.id);
    if (result.success) {
      Alert.alert('Success', 'You have accepted the Privacy Policy.');
      await loadAcceptanceStatus();
    } else {
      Alert.alert('Error', result.error || 'Failed to save acceptance.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This feature will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon.') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export will be sent to your email within 24 hours.');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings can be managed in Settings → Account Settings.');
  };

  const handleChangePassword = () => {
    router.push('/screens/AccountSecurityScreen');
  };

  const handleEnable2FA = () => {
    router.push('/screens/AccountSecurityScreen');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Data Handling</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Data Collected</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Email or phone (for login)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Public username
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Profile picture
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Posts, stories, and live recordings
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Followers and interactions
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Gift purchase history
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Balance and payouts
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Device info for security (IP, OS, device ID)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Data is Collected</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Account identity
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Prevent fraud & safety violations
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Personalized content relevance
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Transaction history compliance
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Sharing</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Data is NOT shared externally except:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Payment processors (Stripe/PayPal)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            - Legal compliance if required
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Rights</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Delete Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handleExportData}
          >
            <IconSymbol
              ios_icon_name="arrow.down.doc.fill"
              android_material_icon_name="download"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handleNotifications}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Turn Off Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handleEnable2FA}
          >
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="security"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Enable 2FA</Text>
          </TouchableOpacity>
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
                I Understand & Accept Privacy Policy
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Accept Privacy Policy"
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
  text: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
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