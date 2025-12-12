
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { achievementService, Achievement, UserAchievement } from '@/app/services/achievementService';
import { AchievementBadge } from '@/components/AchievementBadge';
import { LinearGradient } from 'expo-linear-gradient';

export default function AchievementsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<(UserAchievement & { achievement?: Achievement })[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<(string | null)[]>([null, null, null]);
  const [editMode, setEditMode] = useState(false);

  const loadAchievements = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [all, userAch, selected] = await Promise.all([
        achievementService.getAllAchievements(),
        achievementService.getUserAchievements(user.id),
        achievementService.getSelectedBadges(user.id),
      ]);

      setAllAchievements(all);
      setUserAchievements(userAch);

      if (selected) {
        setSelectedBadges([selected.badge_1, selected.badge_2, selected.badge_3]);
      }
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const isUnlocked = (achievementKey: string) => {
    return userAchievements.some((ua) => ua.achievement_key === achievementKey);
  };

  const handleBadgeSelect = (achievementKey: string) => {
    if (!editMode) return;

    const newSelected = [...selectedBadges];
    const index = newSelected.indexOf(achievementKey);

    if (index !== -1) {
      // Remove if already selected
      newSelected[index] = null;
    } else {
      // Add to first empty slot
      const emptyIndex = newSelected.indexOf(null);
      if (emptyIndex !== -1) {
        newSelected[emptyIndex] = achievementKey;
      } else {
        Alert.alert('Maximum Badges', 'You can only select 3 badges to display');
        return;
      }
    }

    setSelectedBadges(newSelected);
  };

  const handleSaveBadges = async () => {
    if (!user) return;

    try {
      await achievementService.updateSelectedBadges(
        user.id,
        selectedBadges[0],
        selectedBadges[1],
        selectedBadges[2]
      );
      setEditMode(false);
      Alert.alert('Success', 'Your display badges have been updated');
    } catch (error) {
      console.error('❌ Error saving badges:', error);
      Alert.alert('Error', 'Failed to save badges');
    }
  };

  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryTitles = {
    beginner: '🏁 Beginner',
    engagement: '⏱ Engagement',
    support: '💸 Support',
    creator: '📺 Creator',
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary || colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Selected Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Badges</Text>
            <TouchableOpacity
              onPress={() => (editMode ? handleSaveBadges() : setEditMode(true))}
            >
              <Text style={[styles.editButton, { color: colors.primary || colors.brandPrimary }]}>
                {editMode ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose up to 3 badges to display on your profile and in chat
          </Text>

          <View style={styles.selectedBadgesContainer}>
            {selectedBadges.map((badgeKey, index) => {
              const achievement = allAchievements.find((a) => a.achievement_key === badgeKey);
              return (
                <View key={`selected-badge-${index}`} style={styles.selectedBadgeSlot}>
                  {achievement ? (
                    <AchievementBadge
                      emoji={achievement.emoji}
                      name={achievement.name}
                      size="large"
                      onPress={editMode ? () => handleBadgeSelect(achievement.achievement_key) : undefined}
                    />
                  ) : (
                    <View style={[styles.emptyBadgeSlot, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.emptyBadgeText, { color: colors.textSecondary }]}>Empty Slot</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.progressNumber, { color: colors.text }]}>
              {userAchievements.length} / {allAchievements.length}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Achievements Unlocked</Text>
          </View>
        </View>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, achievements]) => (
          <View key={`category-${category}`} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {categoryTitles[category as keyof typeof categoryTitles]}
            </Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, achievementIndex) => {
                const unlocked = isUnlocked(achievement.achievement_key);
                const isSelected = selectedBadges.includes(achievement.achievement_key);

                return (
                  <View key={`achievement-${achievement.id}-${achievementIndex}`} style={styles.achievementWrapper}>
                    <AchievementBadge
                      emoji={achievement.emoji}
                      name={achievement.name}
                      description={achievement.description}
                      unlocked={unlocked}
                      size="large"
                      onPress={
                        unlocked && editMode
                          ? () => handleBadgeSelect(achievement.achievement_key)
                          : undefined
                      }
                    />
                    {isSelected && editMode && (
                      <View style={[styles.selectedIndicator, { backgroundColor: colors.primary || colors.brandPrimary }]}>
                        <Text style={[styles.selectedIndicatorText, { color: colors.text }]}>✓</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  selectedBadgeSlot: {
    flex: 1,
  },
  emptyBadgeSlot: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBadgeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  progressNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementWrapper: {
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
