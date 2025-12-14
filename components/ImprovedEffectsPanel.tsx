
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useCameraEffects, EFFECT_PRESETS } from '@/contexts/CameraEffectsContext';

interface ImprovedEffectsPanelProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * ImprovedEffectsPanel
 * 
 * Snapchat-style effect selector with:
 * - Grid layout for easy selection
 * - Instant preview
 * - Animated particle effects
 * - Never blocks camera view
 */
export default function ImprovedEffectsPanel({
  visible,
  onClose,
}: ImprovedEffectsPanelProps) {
  const { activeEffect, setActiveEffect, clearEffect } = useCameraEffects();

  const handleSelectEffect = (effect: typeof EFFECT_PRESETS[0]) => {
    console.log('✨ [Effects] Selected:', effect.name);
    setActiveEffect(effect);
  };

  const handleClearEffect = () => {
    console.log('🧹 [Effects] Cleared');
    clearEffect();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Effects</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Add animated particle effects layered on top of your camera feed. Effects are
              GPU-optimized and won&apos;t impact performance.
            </Text>

            {/* Effects Grid */}
            <View style={styles.effectsGrid}>
              {/* None Option */}
              <TouchableOpacity
                style={[styles.effectCard, !activeEffect && styles.effectCardActive]}
                onPress={handleClearEffect}
                activeOpacity={0.7}
              >
                <Text style={styles.effectIcon}>🚫</Text>
                <Text style={[styles.effectName, !activeEffect && styles.effectNameActive]}>
                  None
                </Text>
                <Text style={styles.effectDescription}>No effect</Text>
                {!activeEffect && (
                  <View style={styles.activeIndicator}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color={colors.brandPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Effect Options */}
              {EFFECT_PRESETS.map((effect) => {
                const isSelected = activeEffect?.id === effect.id;

                return (
                  <TouchableOpacity
                    key={effect.id}
                    style={[styles.effectCard, isSelected && styles.effectCardActive]}
                    onPress={() => handleSelectEffect(effect)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.effectIcon}>{effect.icon}</Text>
                    <Text style={[styles.effectName, isSelected && styles.effectNameActive]}>
                      {effect.name}
                    </Text>
                    <Text style={styles.effectDescription}>{effect.description}</Text>
                    {isSelected && (
                      <View style={styles.activeIndicator}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={20}
                          color={colors.brandPrimary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.infoText}>
                Effects are animated visual elements that layer on top of your camera feed. They
                use GPU-accelerated animations and never block your camera view. Only one effect
                can be active at a time.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
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
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  effectCard: {
    width: '48%',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  effectCardActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  effectIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  effectName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  effectNameActive: {
    color: colors.brandPrimary,
  },
  effectDescription: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
