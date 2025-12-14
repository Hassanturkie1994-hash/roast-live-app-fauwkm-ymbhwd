
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useCameraEffects, FILTER_PRESETS } from '@/contexts/CameraEffectsContext';

interface ImprovedFiltersPanelProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * ImprovedFiltersPanel
 * 
 * Snapchat-style filter selector with:
 * - Horizontal scroll of filters
 * - Instant preview on selection
 * - Smooth transitions
 * - Intensity slider
 * - Always shows camera feed
 */
export default function ImprovedFiltersPanel({
  visible,
  onClose,
}: ImprovedFiltersPanelProps) {
  const {
    activeFilter,
    filterIntensity,
    setActiveFilter,
    setFilterIntensity,
    clearFilter,
  } = useCameraEffects();

  const handleSelectFilter = (filter: typeof FILTER_PRESETS[0]) => {
    console.log('🎨 [Filters] Selected:', filter.name);
    setActiveFilter(filter);
  };

  const handleClearFilter = () => {
    console.log('🧹 [Filters] Cleared');
    clearFilter();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Horizontal Filter Scroll */}
          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollContent}
            >
              {/* None Option */}
              <TouchableOpacity
                style={[
                  styles.filterCard,
                  !activeFilter && styles.filterCardActive,
                ]}
                onPress={handleClearFilter}
                activeOpacity={0.7}
              >
                <View style={[styles.filterPreview, styles.filterPreviewNone]}>
                  <Text style={styles.filterIcon}>🚫</Text>
                </View>
                <Text style={[styles.filterName, !activeFilter && styles.filterNameActive]}>
                  None
                </Text>
              </TouchableOpacity>

              {/* Filter Options */}
              {FILTER_PRESETS.map((filter) => {
                const isSelected = activeFilter?.id === filter.id;

                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterCard, isSelected && styles.filterCardActive]}
                    onPress={() => handleSelectFilter(filter)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.filterPreview,
                        {
                          backgroundColor: filter.overlayColor || colors.backgroundAlt,
                        },
                      ]}
                    >
                      <Text style={styles.filterIcon}>{filter.icon}</Text>
                    </View>
                    <Text style={[styles.filterName, isSelected && styles.filterNameActive]}>
                      {filter.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.activeIndicator}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={16}
                          color={colors.brandPrimary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Intensity Slider */}
          {activeFilter && (
            <View style={styles.intensitySection}>
              <Text style={styles.sectionTitle}>Filter Intensity</Text>
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

          {/* Info Box */}
          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={styles.infoText}>
              Filters use subtle color grading to enhance your camera feed. Your face and
              background remain fully visible. Scroll horizontally to preview filters instantly.
            </Text>
          </View>

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
    maxHeight: '70%',
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
  filtersSection: {
    paddingVertical: 20,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  filterCard: {
    alignItems: 'center',
    position: 'relative',
  },
  filterCardActive: {
    transform: [{ scale: 1.05 }],
  },
  filterPreview: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  filterPreviewNone: {
    backgroundColor: colors.backgroundAlt,
  },
  filterIcon: {
    fontSize: 28,
  },
  filterName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  filterNameActive: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  intensitySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
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
