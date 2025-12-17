
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { userReportingService, UserReportReason } from '@/app/services/userReportingService';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId: string;
}

const REPORT_REASONS: { reason: UserReportReason; label: string; icon: string; androidIcon: string }[] = [
  { 
    reason: 'inappropriate_content', 
    label: 'Inappropriate content', 
    icon: 'exclamationmark.triangle.fill', 
    androidIcon: 'warning' 
  },
  { 
    reason: 'threats_harassment', 
    label: 'Threats / harassment', 
    icon: 'hand.raised.fill', 
    androidIcon: 'block' 
  },
  { 
    reason: 'spam_scam', 
    label: 'Spam / scam', 
    icon: 'envelope.badge.fill', 
    androidIcon: 'report' 
  },
  { 
    reason: 'hate_speech', 
    label: 'Hate speech', 
    icon: 'flame.fill', 
    androidIcon: 'local_fire_department' 
  },
  { 
    reason: 'other', 
    label: 'Other', 
    icon: 'ellipsis.circle.fill', 
    androidIcon: 'more_horiz' 
  },
];

export default function ReportUserModal({
  visible,
  onClose,
  reportedUserId,
  reportedUsername,
  reporterUserId,
}: ReportUserModalProps) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<UserReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await userReportingService.submitUserReport(
        reporterUserId,
        reportedUserId,
        selectedReason,
        description.trim() || undefined
      );

      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. Our moderation team will review it shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedReason(null);
                setDescription('');
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting user report:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(null);
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Report User</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.infoBox, { backgroundColor: `${colors.brandPrimary}15`, borderColor: colors.brandPrimary }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Reporting @{reportedUsername}. Your identity will remain anonymous.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a reason:</Text>

            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((item) => (
                <TouchableOpacity
                  key={`report-reason-${item.reason}`}
                  style={[
                    styles.reasonButton,
                    { 
                      backgroundColor: colors.backgroundAlt, 
                      borderColor: colors.border 
                    },
                    selectedReason === item.reason && { 
                      backgroundColor: colors.brandPrimary, 
                      borderColor: colors.brandPrimary 
                    },
                  ]}
                  onPress={() => setSelectedReason(item.reason)}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={item.icon}
                    android_material_icon_name={item.androidIcon}
                    size={24}
                    color={selectedReason === item.reason ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      { color: selectedReason === item.reason ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional details (optional):</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="Provide more context about this report..."
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{description.length}/500</Text>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.submitButtonContainer}>
              <GradientButton
                title={isSubmitting ? 'Submitting...' : 'Submit Report'}
                onPress={handleSubmit}
                size="medium"
                disabled={!selectedReason || isSubmitting}
              />
            </View>
          </View>

          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  reasonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
