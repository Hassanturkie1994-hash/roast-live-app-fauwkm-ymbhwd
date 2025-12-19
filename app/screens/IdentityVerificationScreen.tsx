
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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { identityVerificationService, IdentityVerificationData } from '@/app/services/identityVerificationService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Identity Verification Screen
 * 
 * Required before:
 * - Going live
 * - Receiving payouts (PayPal or Stripe)
 * 
 * Collects:
 * - Full legal name
 * - Personal ID number
 * - Country
 * - Address/State/City
 * - Date of birth
 * - Identity verification document (Passport, National ID, or Driver's License)
 */
export default function IdentityVerificationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState<any>(null);

  // Form state
  const [fullLegalName, setFullLegalName] = useState('');
  const [personalIdNumber, setPersonalIdNumber] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentType, setDocumentType] = useState<'passport' | 'national_id' | 'drivers_license'>('passport');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentExpiryDate, setDocumentExpiryDate] = useState(new Date());
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const loadExistingVerification = useCallback(async () => {
    if (!user) return;

    try {
      const verification = await identityVerificationService.getUserVerification(user.id);
      setExistingVerification(verification);

      if (verification && verification.verification_status === 'pending') {
        // Pre-fill form with existing data
        setFullLegalName(verification.full_legal_name);
        setPersonalIdNumber(verification.personal_id_number);
        setCountry(verification.country);
        setAddress(verification.address);
        setCity(verification.city);
        setStateProvince(verification.state_province || '');
        setPostalCode(verification.postal_code || '');
        setDateOfBirth(new Date(verification.date_of_birth));
        setDocumentType(verification.document_type as any);
        setDocumentNumber(verification.document_number);
        setDocumentUrl(verification.document_url);
        if (verification.document_expiry_date) {
          setDocumentExpiryDate(new Date(verification.document_expiry_date));
        }
      }
    } catch (error) {
      console.error('Error loading verification:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadExistingVerification();
  }, [loadExistingVerification]);

  const handlePickDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to upload your ID document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled) {
        setDocumentUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!fullLegalName.trim()) {
      Alert.alert('Error', 'Please enter your full legal name');
      return;
    }

    if (!personalIdNumber.trim()) {
      Alert.alert('Error', 'Please enter your personal ID number');
      return;
    }

    if (!country.trim()) {
      Alert.alert('Error', 'Please enter your country');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }

    if (!documentNumber.trim()) {
      Alert.alert('Error', 'Please enter your document number');
      return;
    }

    if (!documentUri && !documentUrl) {
      Alert.alert('Error', 'Please upload a photo of your ID document');
      return;
    }

    setSubmitting(true);

    try {
      let uploadedDocumentUrl = documentUrl;

      // Upload document if new file selected
      if (documentUri && !documentUrl) {
        const uploadResult = await identityVerificationService.uploadVerificationDocument(
          user.id,
          documentUri,
          documentType
        );

        if (!uploadResult.success || !uploadResult.url) {
          Alert.alert('Error', uploadResult.error || 'Failed to upload document');
          setSubmitting(false);
          return;
        }

        uploadedDocumentUrl = uploadResult.url;
      }

      if (!uploadedDocumentUrl) {
        Alert.alert('Error', 'Document upload failed');
        setSubmitting(false);
        return;
      }

      // Submit verification
      const verificationData: IdentityVerificationData = {
        fullLegalName,
        personalIdNumber,
        country,
        address,
        city,
        stateProvince: stateProvince || undefined,
        postalCode: postalCode || undefined,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        documentType,
        documentUrl: uploadedDocumentUrl,
        documentNumber,
        documentExpiryDate: documentExpiryDate.toISOString().split('T')[0],
      };

      const result = await identityVerificationService.submitVerification(user.id, verificationData);

      if (result.success) {
        Alert.alert(
          'Verification Submitted',
          'Your identity verification has been submitted for review. You will be notified once it is approved.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  // Show status if already verified or pending
  if (existingVerification && existingVerification.verification_status === 'approved') {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.centerContent}>
          <View style={[styles.successIcon, { backgroundColor: '#00C853' }]}>
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="verified"
              size={64}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Verified</Text>
          <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
            Your identity has been verified. You can now go live and receive payouts.
          </Text>
          <Text style={[styles.verifiedDate, { color: colors.textSecondary }]}>
            Verified on {new Date(existingVerification.verified_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  }

  if (existingVerification && existingVerification.verification_status === 'pending') {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.centerContent}>
          <View style={[styles.pendingIcon, { backgroundColor: '#FFA500' }]}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={64}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.pendingTitle, { color: colors.text }]}>Verification Pending</Text>
          <Text style={[styles.pendingDescription, { color: colors.textSecondary }]}>
            Your identity verification is being reviewed. This usually takes 1-3 business days.
          </Text>
          <Text style={[styles.submittedDate, { color: colors.textSecondary }]}>
            Submitted on {new Date(existingVerification.submitted_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.brandPrimary}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Identity verification is required before you can go live or receive payouts. 
            All information is stored securely and used only for verification purposes.
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Full Legal Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="As shown on your ID"
            placeholderTextColor={colors.textSecondary}
            value={fullLegalName}
            onChangeText={setFullLegalName}
          />

          <Text style={[styles.label, { color: colors.text }]}>Personal ID Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="National ID or SSN"
            placeholderTextColor={colors.textSecondary}
            value={personalIdNumber}
            onChangeText={setPersonalIdNumber}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.text }]}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {dateOfBirth.toLocaleDateString()}
            </Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar_today"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Address Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Country *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            value={country}
            onChangeText={setCountry}
          />

          <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={[styles.label, { color: colors.text }]}>City *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />

          <Text style={[styles.label, { color: colors.text }]}>State/Province</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="State or Province (optional)"
            placeholderTextColor={colors.textSecondary}
            value={stateProvince}
            onChangeText={setStateProvince}
          />

          <Text style={[styles.label, { color: colors.text }]}>Postal Code</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="Postal code (optional)"
            placeholderTextColor={colors.textSecondary}
            value={postalCode}
            onChangeText={setPostalCode}
          />
        </View>

        {/* Document Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity Document</Text>

          <Text style={[styles.label, { color: colors.text }]}>Document Type *</Text>
          <View style={styles.documentTypeButtons}>
            <TouchableOpacity
              style={[
                styles.documentTypeButton,
                { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                documentType === 'passport' && { borderColor: colors.brandPrimary, borderWidth: 2 },
              ]}
              onPress={() => setDocumentType('passport')}
            >
              <IconSymbol
                ios_icon_name="book.closed.fill"
                android_material_icon_name="book"
                size={24}
                color={documentType === 'passport' ? colors.brandPrimary : colors.textSecondary}
              />
              <Text style={[styles.documentTypeText, { color: documentType === 'passport' ? colors.brandPrimary : colors.text }]}>
                Passport
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.documentTypeButton,
                { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                documentType === 'national_id' && { borderColor: colors.brandPrimary, borderWidth: 2 },
              ]}
              onPress={() => setDocumentType('national_id')}
            >
              <IconSymbol
                ios_icon_name="person.text.rectangle.fill"
                android_material_icon_name="badge"
                size={24}
                color={documentType === 'national_id' ? colors.brandPrimary : colors.textSecondary}
              />
              <Text style={[styles.documentTypeText, { color: documentType === 'national_id' ? colors.brandPrimary : colors.text }]}>
                National ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.documentTypeButton,
                { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                documentType === 'drivers_license' && { borderColor: colors.brandPrimary, borderWidth: 2 },
              ]}
              onPress={() => setDocumentType('drivers_license')}
            >
              <IconSymbol
                ios_icon_name="car.fill"
                android_material_icon_name="directions_car"
                size={24}
                color={documentType === 'drivers_license' ? colors.brandPrimary : colors.textSecondary}
              />
              <Text style={[styles.documentTypeText, { color: documentType === 'drivers_license' ? colors.brandPrimary : colors.text }]}>
                Driver's License
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Document Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            placeholder="Document number"
            placeholderTextColor={colors.textSecondary}
            value={documentNumber}
            onChangeText={setDocumentNumber}
          />

          <Text style={[styles.label, { color: colors.text }]}>Document Expiry Date</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={() => setShowExpiryDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {documentExpiryDate.toLocaleDateString()}
            </Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar_today"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showExpiryDatePicker && (
            <DateTimePicker
              value={documentExpiryDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowExpiryDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDocumentExpiryDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>Upload Document Photo *</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
            onPress={handlePickDocument}
          >
            <IconSymbol
              ios_icon_name="camera.fill"
              android_material_icon_name="camera_alt"
              size={32}
              color={colors.brandPrimary}
            />
            <Text style={[styles.uploadButtonText, { color: colors.text }]}>
              {documentUri || documentUrl ? 'Document Uploaded ✓' : 'Upload Photo of ID'}
            </Text>
            <Text style={[styles.uploadButtonSubtext, { color: colors.textSecondary }]}>
              Clear photo showing all details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <IconSymbol
            ios_icon_name="lock.shield.fill"
            android_material_icon_name="security"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your information is encrypted and stored securely. We will never share your personal data with third parties.
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <GradientButton
            title={submitting ? 'Submitting...' : 'Submit for Verification'}
            onPress={handleSubmit}
            disabled={submitting}
            size="large"
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    padding: 20,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '400',
  },
  documentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  documentTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  documentTypeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadButton: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  submitContainer: {
    marginBottom: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  verifiedDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pendingTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  pendingDescription: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  submittedDate: {
    fontSize: 14,
    fontWeight: '600',
  },
});
