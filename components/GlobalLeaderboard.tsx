
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { globalLeaderboardService } from '@/app/services/globalLeaderboardService';

interface GlobalLeaderboardProps {
  type: 'creators' | 'fans';
}

export default function GlobalLeaderboard({ type }: GlobalLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = type === 'creators'
        ? await globalLeaderboardService.getTopCreators(10)
        : await globalLeaderboardService.getTopFans(10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.item}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Text style={styles.name}>{item.display_name || 'Unknown'}</Text>
      <Text style={styles.score}>{item.composite_score}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <FlatList
      data={leaderboard}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandPrimary,
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  score: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
