
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface SeasonAdminPanelProps {
  seasonId: string;
}

export default function SeasonAdminPanel({ seasonId }: SeasonAdminPanelProps) {
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSeasonData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading season data for:', seasonId);
      setSeasonData({ id: seasonId, name: 'Season 1' });
    } catch (error) {
      console.error('Error loading season data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    loadSeasonData();
  }, [loadSeasonData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.title}>Season Admin Panel</Text>
        {seasonData && (
          <Text style={styles.seasonName}>{seasonData.name}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  seasonName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
