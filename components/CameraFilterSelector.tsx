
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export type CameraFilter = 
  | 'none'
  | 'warm'
  | 'cold'
  | 'saturated'
  | 'smooth'
  | 'sharpen'
  | 'brightness'
  | 'exposure';

interface CameraFilterSelectorProps {
  selectedFilter: CameraFilter;
  onSelectFilter: (filter: CameraFilter) => void;
  visible: boolean;
}

const FILTERS: { id: CameraFilter; name: string; icon: string; androidIcon: string }[] = [
  { id: 'none', name: 'None', icon: 'circle', androidIcon: 'circle' },
  { id: 'warm', name: 'Warm', icon: 'sun.max.fill', androidIcon: 'wb_sunny' },
  { id: 'cold', name: 'Cold', icon: 'snowflake', androidIcon: 'ac_unit' },
  { id: 'saturated', name: 'Vibrant', icon: 'sparkles', androidIcon: 'auto_awesome' },
  { id: 'smooth', name: 'Smooth', icon: 'wand.and.stars', androidIcon: 'blur_on' },
  { id: 'sharpen', name: 'Sharp', icon: 'diamond.fill', androidIcon: 'details' },
  { id: 'brightness', name: 'Bright', icon: 'light.max', androidIcon: 'brightness_high' },
  { id: 'exposure', name: 'Exposure', icon: 'camera.aperture', androidIcon: 'exposure' },
];

export default function CameraFilterSelector({
  selectedFilter,
  onSelectFilter,
  visible,
}: CameraFilterSelectorProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="camera.filters"
          android_material_icon_name="filter"
          size={20}
          color={colors.text}
        />
        <Text style={styles.headerText}>Camera Filters</Text>
        <Text style={styles.headerSubtext}>Tap to apply</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => onSelectFilter(filter.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.filterIconContainer,
              selectedFilter === filter.id && styles.filterIconContainerActive,
            ]}>
              <IconSymbol
                ios_icon_name={filter.icon}
                android_material_icon_name={filter.androidIcon}
                size={24}
                color={
                  selectedFilter === filter.id ? colors.text : colors.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.filterName,
                selectedFilter === filter.id && styles.filterNameActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtext: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  filterButtonActive: {
    // Active state handled by icon container
  },
  filterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  filterIconContainerActive: {
    backgroundColor: 'rgba(227, 0, 82, 0.3)',
    borderColor: colors.gradientEnd,
  },
  filterName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterNameActive: {
    color: colors.text,
    fontWeight: '700',
  },
});