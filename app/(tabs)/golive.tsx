
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

export default function GoLiveScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Go Live</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.previewContainer}>
          <View style={styles.preview}>
            <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={80} color="#666" />
            <Text style={[styles.previewText, { color: '#666' }]}>Camera Preview</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingButton}>
          <IconSymbol ios_icon_name="gearshape" android_material_icon_name="settings" size={24} color={theme.colors.text} />
          <Text style={[styles.settingButtonText, { color: theme.colors.text }]}>Stream Settings</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.goLiveButton}>
          <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={24} color="#fff" />
          <Text style={styles.goLiveButtonText}>START LIVE STREAM</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  previewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  preview: {
    aspectRatio: 9 / 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewText: {
    fontSize: 16,
    marginTop: 12,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  goLiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
