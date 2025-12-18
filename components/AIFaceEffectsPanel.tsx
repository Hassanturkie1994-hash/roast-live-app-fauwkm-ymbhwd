
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
import { AIFaceFilter } from './AIFaceFilterSystem';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';

interface AIFaceEffectsPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedEffect: AIFaceFilter | null;
  onSelectEffect: (effect: AIFaceFilter | null) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
}

export const AI_FACE_FILTERS: AIFaceFilter[] = [
  {
    id: 'big_eyes',
    name: 'Big Eyes',
    icon: '👁️',
    description: 'Enlarge eyes for a cute look',
    type: 'geometry',
    intensity: 0.7,
  },
  {
    id: 'big_nose',
    name: 'Big Nose',
    icon: '👃',
    description: 'Enlarge nose for comedy',
    type: 'geometry',
    intensity: 0.8,
  },
  {
    id: 'slim_face',
    name: 'Slim Face',
    icon: '🎯',
    description: 'Narrow face width',
    type: 'geometry',
    intensity: 0.6,
  },
  {
    id: 'smooth_skin',
    name: 'Smooth Skin',
    icon: '✨',
    description: 'Soften skin texture',
    type: 'texture',
    intensity: 0.5,
  },
  {
    id: 'funny_face',
    name: 'Funny Face',
    icon: '🤪',
    description: 'Distort face for laughs',
    type: 'hybrid',
    intensity: 0.9,
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: '💄',
    description: 'Enhance facial features',
    type: 'hybrid',
    intensity: 0.6,
  },
];

export default function AIFaceEffectsPanel({
  visible,
  onClose,
}: AIFaceEffectsPanelProps) {
  const { activeEffect, setActiveEffect, clearEffect } = useAIFaceEffects();

  const handleSelectEffect = (effect: AIFaceFilter) => {
    console.log('🤖 [AI Face Effects] Effect selected:', effect.name);
    if (activeEffect?.id === effect.id) {
      clearEffect();
    } else {
      setActiveEffect(effect);
    }
  };

  const handleClearEffect = () => {
    console.log('🧹 [AI Face Effects] Clearing effect');
    clearEffect();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>AI Face Effects</Text>
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
              Real-time AI face detection and transformation. Effects track your face and adapt to movement, rotation, and distance using TensorFlow.js and BlazeFace model.
            </Text>

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
                  <View style={styles.checkmark}>
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
              {AI_FACE_FILTERS.map((effect) => {
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
                    <View style={styles.effectTypeBadge}>
                      <Text style={styles.effectTypeText}>
                        {effect.type === 'geometry' && '📐 Geometry'}
                        {effect.type === 'texture' && '🎨 Texture'}
                        {effect.type === 'overlay' && '🖼️ Overlay'}
                        {effect.type === 'hybrid' && '🔀 Hybrid'}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkmark}>
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
                AI Face Effects use real-time face detection powered by TensorFlow.js and the BlazeFace model. Effects identify and track your face, then apply transformations only to facial regions. All processing happens on-device for privacy and low latency.
              </Text>
            </View>

            {/* Technical Note */}
            <View style={styles.technicalNote}>
              <Text style={styles.technicalNoteTitle}>🤖 How AI Face Detection Works</Text>
              <Text style={styles.technicalNoteText}>
                • Face Detection: BlazeFace model identifies human faces in camera feed{'\n'}
                • Face Tracking: Follows face movement in real-time at ~30 FPS{'\n'}
                • Landmark Detection: Locates eyes, nose, mouth, ears, face contours{'\n'}
                • Geometry Transform: Modifies facial structure and proportions{'\n'}
                • Texture Processing: Applies skin smoothing and enhancements{'\n'}
                • GPU Acceleration: Uses WebGL backend for optimal performance{'\n'}
                • Privacy First: All processing happens on your device
              </Text>
            </View>

            {/* Performance Note */}
            <View style={styles.performanceNote}>
              <Text style={styles.performanceTitle}>⚡ Performance</Text>
              <Text style={styles.performanceText}>
                • Runs at ~30 FPS on modern devices{'\n'}
                • GPU-accelerated via WebGL{'\n'}
                • Lightweight BlazeFace model (~1MB){'\n'}
                • Optimized for live streaming{'\n'}
                • Works with all zoom levels (0.5x / 1x / 2x)
              </Text>
            </View>
          </ScrollView>

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
    maxHeight: '85%',
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
    marginBottom: 8,
  },
  effectTypeBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  effectTypeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text,
  },
  checkmark: {
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
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  technicalNote: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderColor: 'rgba(74, 144, 226, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  technicalNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  technicalNoteText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  performanceNote: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderColor: 'rgba(0, 255, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  performanceText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
