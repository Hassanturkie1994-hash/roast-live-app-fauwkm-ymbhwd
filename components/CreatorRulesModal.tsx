
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import GradientButton from './GradientButton';
import { useTranslation } from '@/hooks/useTranslation';

interface CreatorRulesModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CreatorRulesModal({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
}: CreatorRulesModalProps) {
  const [rule1Checked, setRule1Checked] = useState(false);
  const [rule2Checked, setRule2Checked] = useState(false);
  const [rule3Checked, setRule3Checked] = useState(false);
  const t = useTranslation();

  const allRulesChecked = rule1Checked && rule2Checked && rule3Checked;

  // Reset checkboxes when modal becomes visible
  useEffect(() => {
    if (visible) {
      setRule1Checked(false);
      setRule2Checked(false);
      setRule3Checked(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (allRulesChecked && !isLoading) {
      console.log('✅ Alla regler markerade, bekräftar...');
      onConfirm();
    } else {
      console.log('⚠️ Kan inte bekräfta: allRulesChecked =', allRulesChecked, 'isLoading =', isLoading);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      console.log('❌ Avbryter skaparregler...');
      // Reset checkboxes
      setRule1Checked(false);
      setRule2Checked(false);
      setRule3Checked(false);
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
                ios_icon_name="exclamationmark.shield.fill"
                android_material_icon_name="shield"
                size={48}
                color={colors.gradientEnd}
              />
              <Text style={styles.title}>{t.creatorRules.title}</Text>
              <Text style={styles.subtitle}>{t.creatorRules.subtitle}</Text>
            </View>

            {/* Rules Checkboxes */}
            <View style={styles.rulesContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRule1Checked(!rule1Checked)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rule1Checked && styles.checkboxChecked]}>
                  {rule1Checked && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color={colors.text}
                    />
                  )}
                </View>
                <Text style={styles.ruleText}>{t.creatorRules.rule1}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRule2Checked(!rule2Checked)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rule2Checked && styles.checkboxChecked]}>
                  {rule2Checked && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color={colors.text}
                    />
                  )}
                </View>
                <Text style={styles.ruleText}>{t.creatorRules.rule2}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRule3Checked(!rule3Checked)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rule3Checked && styles.checkboxChecked]}>
                  {rule3Checked && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color={colors.text}
                    />
                  )}
                </View>
                <Text style={styles.ruleText}>{t.creatorRules.rule3}</Text>
              </TouchableOpacity>
            </View>

            {/* Explanations */}
            <View style={styles.explanationsContainer}>
              <View style={styles.explanationRow}>
                <Text style={styles.explanationIcon}>🔴</Text>
                <Text style={styles.explanationText}>
                  {t.creatorRules.explanation1}
                </Text>
              </View>

              <View style={styles.explanationRow}>
                <Text style={styles.explanationIcon}>⚠️</Text>
                <Text style={styles.explanationText}>
                  {t.creatorRules.explanation2}
                </Text>
              </View>

              <View style={styles.explanationRow}>
                <Text style={styles.explanationIcon}>💬</Text>
                <Text style={styles.explanationText}>
                  {t.creatorRules.explanation3}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, isLoading && styles.textDisabled]}>{t.creatorRules.cancel}</Text>
              </TouchableOpacity>

              <View style={styles.confirmButtonContainer}>
                <GradientButton
                  title={isLoading ? t.creatorRules.starting : t.creatorRules.confirmAndGoLive}
                  onPress={handleConfirm}
                  size="medium"
                  disabled={!allRulesChecked || isLoading}
                />
              </View>
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.gradientEnd} />
                <Text style={styles.loadingText}>{t.creatorRules.startingStream}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
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
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rulesContainer: {
    gap: 20,
    marginBottom: 32,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  checkboxChecked: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  ruleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  explanationsContainer: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(164, 0, 40, 0.3)',
  },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  explanationIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.5,
  },
  confirmButtonContainer: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
