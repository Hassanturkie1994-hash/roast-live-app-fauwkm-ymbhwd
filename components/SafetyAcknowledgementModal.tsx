
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import GradientButton from './GradientButton';
import { useTranslation } from '@/hooks/useTranslation';

interface SafetyAcknowledgementModalProps {
  visible: boolean;
  onAccept: () => void;
  isLoading?: boolean;
}

export default function SafetyAcknowledgementModal({
  visible,
  onAccept,
  isLoading = false,
}: SafetyAcknowledgementModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const t = useTranslation();

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="shield.checkered"
              android_material_icon_name="verified_user"
              size={64}
              color={colors.gradientEnd}
            />
            <Text style={styles.title}>{t.safety.acknowledgement.title}</Text>
            <Text style={styles.subtitle}>{t.safety.acknowledgement.subtitle}</Text>
          </View>

          {/* Guidelines Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.guidelinesContainer}>
              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>{t.safety.acknowledgement.communityValues}</Text>
                <Text style={styles.sectionText}>
                  {t.safety.acknowledgement.communityValuesText}
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>{t.safety.acknowledgement.zeroTolerance}</Text>
                <Text style={styles.sectionText}>
                  {t.safety.acknowledgement.zeroToleranceText}
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>{t.safety.acknowledgement.importantNotes}</Text>
                <Text style={styles.sectionText}>
                  {t.safety.acknowledgement.importantNotesText}
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>{t.safety.acknowledgement.responsibilities}</Text>
                <Text style={styles.sectionText}>
                  {t.safety.acknowledgement.responsibilitiesText}
                </Text>
              </View>

              <View style={styles.highlightBox}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={24}
                  color={colors.gradientEnd}
                />
                <Text style={styles.highlightText}>
                  {t.safety.acknowledgement.highlightText}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Scroll Indicator */}
          {!hasScrolledToBottom && (
            <View style={styles.scrollIndicator}>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="keyboard_arrow_down"
                size={24}
                color={colors.textSecondary}
              />
              <Text style={styles.scrollIndicatorText}>{t.safety.acknowledgement.scrollToContinue}</Text>
            </View>
          )}

          {/* Accept Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title={isLoading ? t.safety.acknowledgement.accepting : t.safety.acknowledgement.accept}
              onPress={onAccept}
              size="large"
              disabled={!hasScrolledToBottom || isLoading}
            />
          </View>

          {isLoading && (
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  guidelinesContainer: {
    gap: 24,
  },
  guidelineSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  highlightBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: 'rgba(164, 0, 40, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  scrollIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
