
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useCameraEffects, FILTER_PRESETS, EFFECT_PRESETS } from '@/contexts/CameraEffectsContext';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';
import { AI_FACE_FILTERS } from '@/components/AIFaceEffectsPanel';

interface FiltersEffectsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function FiltersEffectsBottomSheet({
  visible,
  onClose,
}: FiltersEffectsBottomSheetProps) {
  const {
    activeFilter,
    activeEffect,
    filterIntensity,
    setActiveFilter,
    setActiveEffect,
    setFilterIntensity,
    clearFilter,
    clearEffect,
  } = useCameraEffects();

  const {
    activeEffect: activeFaceEffect,
    setActiveEffect: setActiveFaceEffect,
    clearEffect: clearFaceEffect,
  } = useAIFaceEffects();

  const [selectedTab, setSelectedTab] = useState<'filters' | 'effects' | 'face'>('filters');

  const handleSelectFilter = (filter: typeof FILTER_PRESETS[0]) => {
    console.log('🎨 Filter selected:', filter.name);
    setActiveFilter(filter);
  };

  const handleSelectEffect = (effect: typeof EFFECT_PRESETS[0]) => {
    console.log('✨ Effect selected:', effect.name);
    setActiveEffect(effect);
  };

  const handleSelectFaceEffect = (effect: typeof AI_FACE_FILTERS[0]) => {
    console.log('🤖 Face effect selected:', effect.name);
    if (activeFaceEffect?.id === effect.id) {
      clearFaceEffect();
    } else {
      setActiveFaceEffect(effect);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters & Effects</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'filters' && styles.tabActive]}
              onPress={() => setSelectedTab('filters')}
            >
              <Text style={[styles.tabText, selectedTab === 'filters' && styles.tabTextActive]}>
                Color Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'effects' && styles.tabActive]}
              onPress={() => setSelectedTab('effects')}
            >
              <Text style={[styles.tabText, selectedTab === 'effects' && styles.tabTextActive]}>
                Particle Effects
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'face' && styles.tabActive]}
              onPress={() => setSelectedTab('face')}
            >
              <Text style={[styles.tabText, selectedTab === 'face' && styles.tabTextActive]}>
                Face Effects
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {selectedTab === 'filters' && (
              <View style={styles.section}>
                <Text style={styles.sectionDescription}>
                  Subtle color grading that enhances your camera feed
                </Text>

                {/* None Option */}
                <TouchableOpacity
                  style={[styles.optionCard, !activeFilter && styles.optionCardActive]}
                  onPress={() => clearFilter()}
                >
                  <Text style={styles.optionIcon}>🚫</Text>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, !activeFilter && styles.optionNameActive]}>
                      None
                    </Text>
                    <Text style={styles.optionDescription}>No filter</Text>
                  </View>
                  {!activeFilter && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.brandPrimary}
                    />
                  )}
                </TouchableOpacity>

                {/* Filter Options */}
                {FILTER_PRESETS.map((filter) => {
                  const isSelected = activeFilter?.id === filter.id;
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[styles.optionCard, isSelected && styles.optionCardActive]}
                      onPress={() => handleSelectFilter(filter)}
                    >
                      <Text style={styles.optionIcon}>{filter.icon}</Text>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                          {filter.name}
                        </Text>
                        <Text style={styles.optionDescription}>{filter.description}</Text>
                      </View>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={24}
                          color={colors.brandPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Intensity Slider */}
                {activeFilter && (
                  <View style={styles.sliderSection}>
                    <Text style={styles.sliderTitle}>Filter Intensity</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>Subtle</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        value={filterIntensity}
                        onValueChange={setFilterIntensity}
                        minimumTrackTintColor={colors.brandPrimary}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.brandPrimary}
                      />
                      <Text style={styles.sliderLabel}>Strong</Text>
                    </View>
                    <Text style={styles.intensityValue}>
                      {Math.round(filterIntensity * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            )}

            {selectedTab === 'effects' && (
              <View style={styles.section}>
                <Text style={styles.sectionDescription}>
                  Animated particle effects layered on top of your camera
                </Text>

                {/* None Option */}
                <TouchableOpacity
                  style={[styles.optionCard, !activeEffect && styles.optionCardActive]}
                  onPress={() => clearEffect()}
                >
                  <Text style={styles.optionIcon}>🚫</Text>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, !activeEffect && styles.optionNameActive]}>
                      None
                    </Text>
                    <Text style={styles.optionDescription}>No effect</Text>
                  </View>
                  {!activeEffect && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.brandPrimary}
                    />
                  )}
                </TouchableOpacity>

                {/* Effect Options */}
                {EFFECT_PRESETS.map((effect) => {
                  const isSelected = activeEffect?.id === effect.id;
                  return (
                    <TouchableOpacity
                      key={effect.id}
                      style={[styles.optionCard, isSelected && styles.optionCardActive]}
                      onPress={() => handleSelectEffect(effect)}
                    >
                      <Text style={styles.optionIcon}>{effect.icon}</Text>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                          {effect.name}
                        </Text>
                        <Text style={styles.optionDescription}>{effect.description}</Text>
                      </View>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={24}
                          color={colors.brandPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {selectedTab === 'face' && (
              <View style={styles.section}>
                <Text style={styles.sectionDescription}>
                  Real-time AI face detection and transformation
                </Text>

                {/* None Option */}
                <TouchableOpacity
                  style={[styles.optionCard, !activeFaceEffect && styles.optionCardActive]}
                  onPress={() => clearFaceEffect()}
                >
                  <Text style={styles.optionIcon}>🚫</Text>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, !activeFaceEffect && styles.optionNameActive]}>
                      None
                    </Text>
                    <Text style={styles.optionDescription}>No face effect</Text>
                  </View>
                  {!activeFaceEffect && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.brandPrimary}
                    />
                  )}
                </TouchableOpacity>

                {/* Face Effect Options */}
                {AI_FACE_FILTERS.map((effect) => {
                  const isSelected = activeFaceEffect?.id === effect.id;
                  return (
                    <TouchableOpacity
                      key={effect.id}
                      style={[styles.optionCard, isSelected && styles.optionCardActive]}
                      onPress={() => handleSelectFaceEffect(effect)}
                    >
                      <Text style={styles.optionIcon}>{effect.icon}</Text>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                          {effect.name}
                        </Text>
                        <Text style={styles.optionDescription}>{effect.description}</Text>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>
                            {effect.type === 'geometry' && '📐 Geometry'}
                            {effect.type === 'texture' && '🎨 Texture'}
                            {effect.type === 'overlay' && '🖼️ Overlay'}
                            {effect.type === 'hybrid' && '🔀 Hybrid'}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={24}
                          color={colors.brandPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brandPrimary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  section: {
    gap: 12,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  optionCardActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  optionNameActive: {
    color: colors.brandPrimary,
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  sliderSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sliderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  intensityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brandPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
