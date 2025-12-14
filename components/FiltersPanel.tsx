
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Slider,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface FiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
  filterIntensity: number;
  onIntensityChange: (intensity: number) => void;
}

const FILTERS = [
  { id: 'none', name: 'None', icon: '🚫', color: '#FFFFFF' },
  { id: 'warm', name: 'Warm', icon: '🌅', color: '#FF8C42' },
  { id: 'cool', name: 'Cool', icon: '❄️', color: '#4A90E2' },
  { id: 'vintage', name: 'Vintage', icon: '📷', color: '#D4A574' },
  { id: 'dramatic', name: 'Dramatic', icon: '🎭', color: '#8B4789' },
  { id: 'bright', name: 'Bright', icon: '☀️', color: '#FFD700' },
  { id: 'noir', name: 'Noir', icon: '🎬', color: '#2C2C2C' },
  { id: 'vivid', name: 'Vivid', icon: '🌈', color: '#FF1744' },
];

const FACE_FILTERS = [
  { id: 'smooth', name: 'Smooth Skin', icon: '✨', description: 'Soften skin texture' },
  { id: 'brighten', name: 'Brighten Face', icon: '💡', description: 'Enhance brightness' },
  { id: 'slim', name: 'Slim Face', icon: '🎯', description: 'Subtle face slimming' },
  { id: 'eyes', name: 'Big Eyes', icon: '👁️', description: 'Enlarge eyes' },
];

export default function FiltersPanel({
  visible,
  onClose,
  selectedFilter,
  onSelectFilter,
  filterIntensity,
  onIntensityChange,
}: FiltersPanelProps) {
  const handleSelectFilter = (filterId: string) => {
    console.log('🎨 Filter selected:', filterId);
    if (filterId === 'none') {
      onSelectFilter(null);
    } else {
      onSelectFilter(filterId);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Color Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color Filters</Text>
              <Text style={styles.sectionDescription}>
                Apply color grading to your stream
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {FILTERS.map((filter) => {
                  const isSelected = filter.id === 'none' 
                    ? selectedFilter === null 
                    : selectedFilter === filter.id;

                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[styles.filterCard, isSelected && styles.filterCardActive]}
                      onPress={() => handleSelectFilter(filter.id)}
                      activeOpacity={0.7}
                    >
                      <View 
                        style={[
                          styles.filterPreview, 
                          { backgroundColor: filter.color }
                        ]} 
                      >
                        <Text style={styles.filterIcon}>{filter.icon}</Text>
                      </View>
                      <Text style={[styles.filterName, isSelected && styles.filterNameActive]}>
                        {filter.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmark}>
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

            {/* Face Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Face Filters</Text>
              <Text style={styles.sectionDescription}>
                Enhance your appearance
              </Text>
              <View style={styles.faceFiltersGrid}>
                {FACE_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={styles.faceFilterCard}
                    onPress={() => console.log('Face filter:', filter.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faceFilterIcon}>{filter.icon}</Text>
                    <Text style={styles.faceFilterName}>{filter.name}</Text>
                    <Text style={styles.faceFilterDescription}>{filter.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Intensity Slider */}
            {selectedFilter && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Filter Intensity</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Subtle</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={filterIntensity}
                    onValueChange={onIntensityChange}
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterCard: {
    alignItems: 'center',
    marginRight: 16,
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
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  faceFiltersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  faceFilterCard: {
    width: '48%',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  faceFilterIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  faceFilterName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  faceFilterDescription: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
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
