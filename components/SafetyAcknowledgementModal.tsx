
import React, { useState } from 'react';
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
            <Text style={styles.title}>Welcome to Roast Live</Text>
            <Text style={styles.subtitle}>Keep Roast Live safe</Text>
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
                <Text style={styles.sectionTitle}>✅ Our Community Values</Text>
                <Text style={styles.sectionText}>
                  - Respect and kindness towards all members{'\n'}
                  - Creative and entertaining content{'\n'}
                  - Playful roasting that stays fun{'\n'}
                  - Supporting creators and fellow viewers{'\n'}
                  - Reporting violations when you see them
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>🚫 Zero Tolerance For</Text>
                <Text style={styles.sectionText}>
                  - Harassment, bullying, or hate speech{'\n'}
                  - Threats of violence or harm{'\n'}
                  - Sexual content involving minors{'\n'}
                  - Sharing private information{'\n'}
                  - Illegal activities or content{'\n'}
                  - Spam or bot behavior
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>⚠️ Important Notes</Text>
                <Text style={styles.sectionText}>
                  - You must accept these guidelines to livestream{'\n'}
                  - Violations may result in warnings, suspensions, or bans{'\n'}
                  - Strikes expire after 7-60 days depending on severity{'\n'}
                  - Multiple reports may trigger safety reviews{'\n'}
                  - False reports may result in action against your account
                </Text>
              </View>

              <View style={styles.guidelineSection}>
                <Text style={styles.sectionTitle}>💬 Your Responsibilities</Text>
                <Text style={styles.sectionText}>
                  - Follow all community guidelines{'\n'}
                  - Respect content ratings (Family Friendly, Roast Mode, 18+){'\n'}
                  - Moderate your own chat if you&apos;re a creator{'\n'}
                  - Report violations you encounter{'\n'}
                  - Keep your account secure
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
                  By accepting, you agree to follow these guidelines and understand that violations may result in account restrictions.
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
              <Text style={styles.scrollIndicatorText}>Scroll to continue</Text>
            </View>
          )}

          {/* Accept Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title={isLoading ? 'ACCEPTING...' : 'Accept Community Guidelines'}
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