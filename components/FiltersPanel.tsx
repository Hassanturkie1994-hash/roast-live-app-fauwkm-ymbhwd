
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

interface FiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
  filterIntensity: number;
  onIntensityChange: (intensity: number) => void;
}

const FILTERS = [
  { id: 'none', name: 'None', icon: '🚫', color: '#FFFFFF', description: 'No filter' },
  { id: 'warm', name: 'Warm', icon: '🌅', color: '#FF8C42', description: 'Warmer skin tones' },
  { id: 'cool', name: 'Cool', icon: '❄️', color: '#4A90E2', description: 'Cooler blue tones' },
  { id: 'vintage', name: 'Vintage', icon: '📷', color: '#D4A574', description: 'Sepia retro look' },
  { id: 'dramatic', name: 'Dramatic', icon: '🎭', color: '#8B4789', description: 'High contrast' },
  { id: 'bright', name: 'Bright', icon: '☀️', color: '#FFD700', description: 'Brighten image' },
  { id: 'noir', name: 'Noir', icon: '🎬', color: '#2C2C2C', description: 'Desaturated B&W' },
  { id: 'vivid', name: 'Vivid', icon: '🌈', color: '#FF1744', description: 'Boost saturation' },
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
                Subtle color grading that enhances your camera feed without hiding it
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
                      <Text style={styles.filterDescription}>{filter.description}</Text>
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
              <Text style={styles.sectionTitle}>Face Filters (AR)</Text>
              <Text style={styles.sectionDescription}>
                Real-time face tracking and geometry modification (Coming Soon)
              </Text>
              <View style={styles.faceFiltersGrid}>
                {FACE_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.faceFilterCard, styles.faceFilterCardDisabled]}
                    onPress={() => console.log('Face filter coming soon:', filter.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faceFilterIcon}>{filter.icon}</Text>
                    <Text style={styles.faceFilterName}>{filter.name}</Text>
                    <Text style={styles.faceFilterDescription}>{filter.description}</Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
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

            {/* Info Box */}
            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={styles.infoText}>
                Color filters use subtle color grading to enhance your camera feed. Your face and background remain fully visible. Filters work in both preview and live stream, and can be changed during broadcast.
              </Text>
            </View>

            {/* Technical Note */}
            <View style={styles.technicalNote}>
              <Text style={styles.technicalNoteTitle}>🔬 Technical Implementation</Text>
              <Text style={styles.technicalNoteText}>
                Current filters use overlay blend modes for color grading. For advanced features like true color matrix filtering or face tracking AR filters, integration with expo-gl or react-native-vision-camera would be required.
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
    marginBottom: 2,
  },
  filterNameActive: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  filterDescription: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
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
    position: 'relative',
  },
  faceFilterCardDisabled: {
    opacity: 0.6,
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
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginBottom: 6,
  },
  technicalNoteText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
