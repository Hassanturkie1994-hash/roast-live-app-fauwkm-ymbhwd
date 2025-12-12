
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
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { reportingService, ReportType } from '@/app/services/reportingService';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
  streamerName: string;
  streamId?: string;
  reporterUserId: string;
}

const REPORT_CATEGORIES: { type: ReportType; label: string; icon: string; androidIcon: string }[] = [
  { type: 'harassment', label: 'Harassment', icon: 'exclamationmark.triangle.fill', androidIcon: 'warning' },
  { type: 'hate_speech', label: 'Hate Speech', icon: 'hand.raised.fill', androidIcon: 'block' },
  { type: 'adult_content', label: 'Adult Content', icon: 'eye.slash.fill', androidIcon: 'visibility_off' },
  { type: 'dangerous_behavior', label: 'Dangerous Behavior', icon: 'flame.fill', androidIcon: 'local_fire_department' },
  { type: 'spam_scam', label: 'Spam/Scam', icon: 'envelope.badge.fill', androidIcon: 'report' },
  { type: 'copyright_violation', label: 'Copyright Violation', icon: 'c.circle.fill', androidIcon: 'copyright' },
];

export default function ReportModal({
  visible,
  onClose,
  streamerId,
  streamerName,
  streamId,
  reporterUserId,
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a report category');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reportingService.submitReport(
        reporterUserId,
        streamerId,
        selectedType,
        streamId,
        description.trim() || undefined
      );

      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. Our team will review it shortly. The stream will continue uninterrupted.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedType(null);
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
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType(null);
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Content</Text>
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
            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.infoText}>
                Reporting @{streamerName}. Your identity will remain anonymous. The stream will not be interrupted.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Select a category:</Text>

            <View style={styles.categoriesContainer}>
              {REPORT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.type}
                  style={[
                    styles.categoryButton,
                    selectedType === category.type && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedType(category.type)}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={category.icon}
                    android_material_icon_name={category.androidIcon}
                    size={24}
                    color={selectedType === category.type ? colors.text : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedType === category.type && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Additional details (optional):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provide more context about this report..."
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.submitButtonContainer}>
              <GradientButton
                title={isSubmitting ? 'Submitting...' : 'Submit Report'}
                onPress={handleSubmit}
                size="medium"
                disabled={!selectedType || isSubmitting}
              />
            </View>
          </View>

          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
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
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
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
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  categoryButtonSelected: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryLabelSelected: {
    color: colors.text,
  },
  textInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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