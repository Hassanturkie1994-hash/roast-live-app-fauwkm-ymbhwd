
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import GradientButton from './GradientButton';
import * as Network from 'expo-network';
import { supabase } from '@/app/integrations/supabase/client';

interface CommunityGuidelinesModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CommunityGuidelinesModal({
  visible,
  onAccept,
  onCancel,
  isLoading = false,
}: CommunityGuidelinesModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptChecked, setAcceptChecked] = useState(false);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(false);
      setAcceptChecked(false);
    }
  }, [visible]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!acceptChecked || isLoading) {
      return;
    }

    onAccept();
  };

  const handleCancel = () => {
    if (!isLoading) {
      setAcceptChecked(false);
      setHasScrolledToBottom(false);
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
          {/* Header */}
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="shield.checkered"
              android_material_icon_name="verified_user"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.title}>Community Guidelines</Text>
            <Text style={styles.subtitle}>Please read and accept to continue</Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Allowed Content</Text>
              <Text style={styles.sectionText}>
                - Comedy and humorous content{'\n'}
                - Playful roasting and banter{'\n'}
                - Satirical commentary{'\n'}
                - Light-hearted jokes{'\n'}
                - Dramatic content{'\n'}
                - Friendly roast battles{'\n'}
                - Fun challenges
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚫 Strictly Prohibited</Text>
              <Text style={styles.sectionText}>
                - Hate speech or discriminatory language{'\n'}
                - Sexual harassment or unwanted advances{'\n'}
                - Threats of violence or physical harm{'\n'}
                - Sharing private information without consent{'\n'}
                - Encouraging self-harm or suicide{'\n'}
                - Exploitation of minors{'\n'}
                - Harassment targeting identity{'\n'}
                - Non-consensual content sharing
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚖️ Consequences</Text>
              <Text style={styles.sectionText}>
                Violations will result in:{'\n\n'}
                1. Warning - First offense{'\n'}
                2. Timeout - Temporary chat restriction (1-60 minutes){'\n'}
                3. Suspension - Account suspended (7-30 days){'\n'}
                4. Ban - Permanent streaming ban
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Chat Rules</Text>
              <Text style={styles.sectionText}>
                - No spam (5 messages in 3 seconds = auto-warning){'\n'}
                - No hate keywords (automatically blocked){'\n'}
                - No repeated harassment (results in timeout)
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎁 Gift Rules</Text>
              <Text style={styles.sectionText}>
                - Gifts are non-refundable unless fraud is detected{'\n'}
                - Platform takes a commission from all gifts{'\n'}
                - Gifting shows support but doesn&apos;t grant special privileges
              </Text>
            </View>

            <View style={styles.importantBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={24}
                color={colors.gradientEnd}
              />
              <Text style={styles.importantText}>
                By accepting these guidelines, you agree to follow all community rules and understand that violations may result in account restrictions or permanent bans.
              </Text>
            </View>
          </ScrollView>

          {/* Scroll Indicator */}
          {!hasScrolledToBottom && (
            <View style={styles.scrollIndicator}>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="keyboard_arrow_down"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.scrollIndicatorText}>Scroll to read all guidelines</Text>
            </View>
          )}

          {/* Acceptance Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptChecked(!acceptChecked)}
              activeOpacity={0.7}
              disabled={!hasScrolledToBottom || isLoading}
            >
              <View style={[
                styles.checkbox, 
                acceptChecked && styles.checkboxChecked,
                !hasScrolledToBottom && styles.checkboxDisabled
              ]}>
                {acceptChecked && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={16}
                    color={colors.text}
                  />
                )}
              </View>
              <Text style={[
                styles.checkboxText,
                !hasScrolledToBottom && styles.checkboxTextDisabled
              ]}>
                I have read and accept the Community Guidelines
              </Text>
            </TouchableOpacity>
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

            <View style={styles.acceptButtonContainer}>
              <GradientButton
                title={isLoading ? 'ACCEPTING...' : 'ACCEPT & CONTINUE'}
                onPress={handleAccept}
                size="medium"
                disabled={!acceptChecked || !hasScrolledToBottom || isLoading}
              />
            </View>
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.gradientEnd} />
              <Text style={styles.loadingText}>Recording acceptance...</Text>
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  importantBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(164, 0, 40, 0.3)',
    marginTop: 8,
  },
  importantText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  scrollIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
  checkboxContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  checkboxTextDisabled: {
    opacity: 0.5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  acceptButtonContainer: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
