
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import GradientButton from './GradientButton';
import { ReportCategory } from '@/app/services/enhancedContentSafetyService';

interface EnhancedReportModalProps {
  visible: boolean;
  onSubmit: (category: ReportCategory, notes?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  reportedUsername?: string;
}

export default function EnhancedReportModal({
  visible,
  onSubmit,
  onCancel,
  isLoading = false,
  reportedUsername,
}: EnhancedReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [notes, setNotes] = useState('');

  const categories: { value: ReportCategory; label: string; icon: string }[] = [
    { value: 'harassment_bullying', label: 'Harassment / Bullying', icon: '😠' },
    { value: 'violent_threats', label: 'Violent threats', icon: '⚠️' },
    { value: 'sexual_content_minors', label: 'Sexual content involving minors', icon: '🚫' },
    { value: 'illegal_content', label: 'Illegal content', icon: '⛔' },
    { value: 'self_harm_encouragement', label: 'Self-harm encouragement', icon: '💔' },
    { value: 'racism_identity_targeting', label: 'Racism or identity targeting', icon: '❌' },
    { value: 'spam_bot_behavior', label: 'Spam / Bot behavior', icon: '🤖' },
    { value: 'hate_extremist_messaging', label: 'Hate or extremist messaging', icon: '🔥' },
  ];

  const handleSubmit = () => {
    if (selectedCategory && !isLoading) {
      onSubmit(selectedCategory, notes.trim() || undefined);
      // Reset state
      setSelectedCategory(null);
      setNotes('');
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setSelectedCategory(null);
      setNotes('');
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color={colors.gradientEnd}
              />
              <Text style={styles.title}>Report Content</Text>
              {reportedUsername && (
                <Text style={styles.subtitle}>Reporting: @{reportedUsername}</Text>
              )}
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
              <Text style={styles.sectionTitle}>Select a reason:</Text>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.value && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.value)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.value && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                  {selectedCategory === category.value && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.gradientEnd}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.sectionTitle}>Additional details (optional):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Provide more context about this report..."
                placeholderTextColor={colors.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!isLoading}
              />
              <Text style={styles.characterCount}>{notes.length}/500</Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.infoText}>
                Reports are reviewed by our team. False reports may result in action against your account.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.submitButtonContainer}>
                <GradientButton
                  title={isLoading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                  onPress={handleSubmit}
                  size="medium"
                  disabled={!selectedCategory || isLoading}
                />
              </View>
            </View>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.gradientEnd} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  categoryButtonSelected: {
    borderColor: colors.gradientEnd,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoryLabelSelected: {
    color: colors.gradientEnd,
  },
  notesContainer: {
    marginBottom: 24,
    gap: 8,
  },
  notesInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: 'rgba(164, 0, 40, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
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
  },
});