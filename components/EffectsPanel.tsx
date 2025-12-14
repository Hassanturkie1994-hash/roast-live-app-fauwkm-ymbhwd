
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

interface EffectsPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedEffect: string | null;
  onSelectEffect: (effect: string | null) => void;
}

const EFFECTS = [
  { id: 'none', name: 'None', icon: '🚫', description: 'No effect' },
  { id: 'fire', name: 'Roast Flames', icon: '🔥', description: 'Animated flame particles rising' },
  { id: 'sparkles', name: 'Sparkles', icon: '✨', description: 'Magical sparkle particles' },
  { id: 'hearts', name: 'Hearts', icon: '❤️', description: 'Floating heart animations' },
  { id: 'stars', name: 'Stars', icon: '⭐', description: 'Twinkling star particles' },
  { id: 'confetti', name: 'Confetti', icon: '🎉', description: 'Celebration confetti burst' },
  { id: 'smoke', name: 'Smoke', icon: '💨', description: 'Subtle smoke particles' },
  { id: 'lightning', name: 'Lightning', icon: '⚡', description: 'Electric bolt effects' },
];

export default function EffectsPanel({
  visible,
  onClose,
  selectedEffect,
  onSelectEffect,
}: EffectsPanelProps) {
  const handleSelectEffect = (effectId: string) => {
    console.log('🎨 Effect selected:', effectId);
    if (effectId === 'none') {
      onSelectEffect(null);
    } else {
      onSelectEffect(effectId);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
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
              Add animated particle effects layered on top of your camera feed. Effects are GPU-optimized and won&apos;t impact performance or hide your face.
            </Text>

            <View style={styles.effectsGrid}>
              {EFFECTS.map((effect) => {
                const isSelected = effect.id === 'none' 
                  ? selectedEffect === null 
                  : selectedEffect === effect.id;

                return (
                  <TouchableOpacity
                    key={effect.id}
                    style={[styles.effectCard, isSelected && styles.effectCardActive]}
                    onPress={() => handleSelectEffect(effect.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.effectIcon}>{effect.icon}</Text>
                    <Text style={[styles.effectName, isSelected && styles.effectNameActive]}>
                      {effect.name}
                    </Text>
                    <Text style={styles.effectDescription}>{effect.description}</Text>
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
                Effects are animated visual elements that layer on top of your camera feed. They use GPU-accelerated animations and never block or tint your camera view. You can toggle effects during your live stream without interruption. Only one effect can be active at a time.
              </Text>
            </View>

            {/* Technical Note */}
            <View style={styles.technicalNote}>
              <Text style={styles.technicalNoteTitle}>🎬 How Effects Work</Text>
              <Text style={styles.technicalNoteText}>
                • Particle System: Each effect generates multiple animated particles{'\n'}
                • GPU Optimized: Uses native driver for smooth 60 FPS animations{'\n'}
                • Non-Blocking: Effects render as overlays, never hiding the camera{'\n'}
                • Dynamic: Particles continuously spawn and animate in loops{'\n'}
                • Customizable: Each effect has unique colors, speeds, and behaviors
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
    maxHeight: '80%',
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
