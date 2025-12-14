
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import CreatorRulesModal from '@/components/CreatorRulesModal';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';

export default function GoLiveModal() {
  const { user } = useAuth();
  const { setIsStreaming } = useStreaming();
  const [streamTitle, setStreamTitle] = useState('');
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [showCreatorRulesModal, setShowCreatorRulesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    console.log('❌ Go Live setup cancelled');
    setStreamTitle('');
    setContentLabel(null);
    router.back();
  };

  const handleConfirm = async () => {
    console.log('✅ Go Live setup confirmed');

    if (!streamTitle.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    try {
      setIsLoading(true);

      // Check if user can stream
      const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
      if (!canStream.canStream) {
        Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
        return;
      }

      // Show content label selection
      setShowContentLabelModal(true);
    } catch (error) {
      console.error('Error checking stream eligibility:', error);
      Alert.alert('Error', 'Failed to validate stream start. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentLabelSelected = (label: ContentLabel) => {
    console.log('🏷️ Content label selected:', label);
    setContentLabel(label);
    setShowContentLabelModal(false);
    setShowCreatorRulesModal(true);
  };

  const handleCreatorRulesConfirm = async () => {
    console.log('✅ Creator rules confirmed, navigating to broadcaster screen');

    if (!user || !streamTitle || !contentLabel) {
      console.error('❌ Missing required data');
      return;
    }

    try {
      setIsLoading(true);

      // Log creator rules acceptance
      await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);

      // Navigate to broadcaster screen with params
      console.log('🚀 Navigating to broadcaster with params:', {
        streamTitle,
        contentLabel,
      });

      // IMMEDIATELY navigate - do NOT wait for stream creation
      router.push({
        pathname: '/(tabs)/broadcast',
        params: {
          streamTitle,
          contentLabel,
        },
      });
    } catch (error) {
      console.error('Error in handleCreatorRulesConfirm:', error);
      Alert.alert('Error', 'Failed to start stream setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <AppLogo size="medium" alignment="center" style={styles.modalLogo} />
          <Text style={styles.modalTitle}>Setup Your Stream</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Stream Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you streaming?"
              placeholderTextColor={colors.placeholder}
              value={streamTitle}
              onChangeText={setStreamTitle}
              maxLength={100}
              autoFocus
              editable={!isLoading}
            />
          </View>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              Your stream will be broadcast live to all viewers. Make sure you have a stable internet connection!
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.confirmButtonContainer}>
              <GradientButton
                title={isLoading ? 'LOADING...' : 'Confirm'}
                onPress={handleConfirm}
                size="medium"
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Content Label Selection Modal */}
      <ContentLabelModal
        visible={showContentLabelModal}
        onSelect={handleContentLabelSelected}
        onCancel={() => {
          setShowContentLabelModal(false);
        }}
      />

      {/* Creator Rules Modal */}
      <CreatorRulesModal
        visible={showCreatorRulesModal}
        onConfirm={handleCreatorRulesConfirm}
        onCancel={() => {
          setShowCreatorRulesModal(false);
        }}
        isLoading={isLoading}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalLogo: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalButtons: {
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
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButtonContainer: {
    flex: 1,
  },
});
