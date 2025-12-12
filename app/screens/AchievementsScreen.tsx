
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AchievementsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const achievements = [
    { id: 1, title: 'First Stream', description: 'Complete your first live stream', icon: 'videocam', unlocked: false },
    { id: 2, title: '100 Followers', description: 'Reach 100 followers', icon: 'people', unlocked: false },
    { id: 3, title: 'Verified', description: 'Get verified on RoastLive', icon: 'verified', unlocked: false },
    { id: 4, title: 'Top Streamer', description: 'Be in top 10 streamers', icon: 'star', unlocked: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {achievements.map((achievement, index) => (
          <View key={index} style={[styles.achievementCard, { opacity: achievement.unlocked ? 1 : 0.5 }]}>
            <View style={[styles.iconContainer, { backgroundColor: achievement.unlocked ? '#8B0000' : '#333' }]}>
              <IconSymbol 
                ios_icon_name={achievement.icon} 
                android_material_icon_name={achievement.icon} 
                size={32} 
                color={achievement.unlocked ? '#fff' : '#666'} 
              />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>{achievement.title}</Text>
              <Text style={[styles.achievementDescription, { color: '#666' }]}>{achievement.description}</Text>
            </View>
            {achievement.unlocked && (
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={24} color="#34C759" />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
});
