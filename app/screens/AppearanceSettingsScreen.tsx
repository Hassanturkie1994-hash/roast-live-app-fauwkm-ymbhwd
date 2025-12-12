
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppearanceSettingsScreen() {
  const { theme, setTheme, colors } = useTheme();

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>THEME</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose how Roast Live looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.
          </Text>

          {/* Light Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              { 
                backgroundColor: colors.card,
                borderColor: theme === 'light' ? colors.brandPrimary : colors.border,
                borderWidth: theme === 'light' ? 2 : 1,
              }
            ]}
            onPress={() => handleThemeSelect('light')}
            activeOpacity={0.7}
          >
            <View style={styles.themeOptionLeft}>
              <View style={[styles.themePreview, styles.lightPreview]}>
                <View style={styles.previewHeader} />
                <View style={styles.previewContent}>
                  <View style={styles.previewLine} />
                  <View style={[styles.previewLine, styles.previewLineShort]} />
                </View>
              </View>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>Light Mode</Text>
                <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                  White background with dark text
                </Text>
              </View>
            </View>
            {theme === 'light' && (
              <View style={[styles.checkmark, { backgroundColor: colors.brandPrimary }]}>
                <IconSymbol
                  ios_icon_name="checkmark"
                  android_material_icon_name="check"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Dark Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              { 
                backgroundColor: colors.card,
                borderColor: theme === 'dark' ? colors.brandPrimary : colors.border,
                borderWidth: theme === 'dark' ? 2 : 1,
              }
            ]}
            onPress={() => handleThemeSelect('dark')}
            activeOpacity={0.7}
          >
            <View style={styles.themeOptionLeft}>
              <View style={[styles.themePreview, styles.darkPreview]}>
                <View style={[styles.previewHeader, { backgroundColor: '#1A1A1A' }]} />
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: '#FFFFFF' }]} />
                  <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: '#DADADA' }]} />
                </View>
              </View>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                  Dark background with light text
                </Text>
              </View>
            </View>
            {theme === 'dark' && (
              <View style={[styles.checkmark, { backgroundColor: colors.brandPrimary }]}>
                <IconSymbol
                  ios_icon_name="checkmark"
                  android_material_icon_name="check"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your theme preference will be saved and applied every time you open the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 24,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  themePreview: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  lightPreview: {
    backgroundColor: '#FFFFFF',
  },
  darkPreview: {
    backgroundColor: '#0A0A0A',
  },
  previewHeader: {
    height: 20,
    backgroundColor: '#F7F7F7',
  },
  previewContent: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  previewLine: {
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  previewLineShort: {
    width: '60%',
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});