
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          ROAST<Text style={{ color: '#8B0000' }}>LIVE</Text>
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tabActive}>
          <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={20} color="#8B0000" />
          <Text style={[styles.tabText, styles.tabTextActive]}>LIVE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={20} color={theme.dark ? '#666' : '#999'} />
          <Text style={[styles.tabText, { color: theme.dark ? '#666' : '#999' }]}>POSTS</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Story */}
        <View style={styles.storyContainer}>
          <TouchableOpacity style={styles.addStoryButton}>
            <View style={styles.addStoryCircle}>
              <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={32} color="#666" />
            </View>
            <Text style={[styles.addStoryText, { color: theme.colors.text }]}>Add Story</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={80} color="#333" />
          <Text style={[styles.emptyStateText, { color: theme.dark ? '#666' : '#999' }]}>
            No live streams yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.dark ? '#555' : '#aaa' }]}>
            Check back later for live content
          </Text>
        </View>
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
    letterSpacing: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8B0000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  storyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addStoryButton: {
    alignItems: 'center',
    gap: 8,
  },
  addStoryCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
