
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useSeasonRanking } from '@/hooks/useSeasonRanking';

interface RoastSeasonRankingDisplayProps {
  creatorId: string;
}

export default function RoastSeasonRankingDisplay({ creatorId }: RoastSeasonRankingDisplayProps) {
  const { currentSeason, ranking, isLoading } = useSeasonRanking(creatorId);
  const [rankingData, setRankingData] = useState<any>(null);

  const loadRankingData = useCallback(() => {
    if (ranking) {
      setRankingData({
        rank: ranking.rank,
        score: ranking.composite_score,
        tier: ranking.current_tier,
      });
    }
  }, [ranking]);

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  if (isLoading || !rankingData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <IconSymbol
        ios_icon_name="trophy.fill"
        android_material_icon_name="emoji_events"
        size={20}
        color="#FFD700"
      />
      <Text style={styles.rank}>#{rankingData.rank}</Text>
      <Text style={styles.score}>{rankingData.score} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});
