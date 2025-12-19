
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useSeasonRanking } from '@/hooks/useSeasonRanking';

interface LiveSeasonIntegrationProps {
  creatorId: string;
  streamId: string;
}

export default function LiveSeasonIntegration({
  creatorId,
  streamId,
}: LiveSeasonIntegrationProps) {
  const { currentSeason, ranking, isLoading } = useSeasonRanking(creatorId);
  const [seasonData, setSeasonData] = useState<any>(null);

  const loadSeasonData = useCallback(() => {
    if (currentSeason && ranking) {
      setSeasonData({
        seasonNumber: currentSeason.season_number,
        rank: ranking.rank,
        score: ranking.composite_score,
      });
    }
  }, [currentSeason, ranking]);

  const subscribeToUpdates = useCallback(() => {
    console.log('Subscribing to season updates');
    return () => {
      console.log('Unsubscribing from season updates');
    };
  }, []);

  const subscribeToGiftEvents = useCallback(() => {
    console.log('Subscribing to gift events');
    return () => {
      console.log('Unsubscribing from gift events');
    };
  }, []);

  useEffect(() => {
    loadSeasonData();
    const unsubscribeUpdates = subscribeToUpdates();
    const unsubscribeGifts = subscribeToGiftEvents();
    
    return () => {
      unsubscribeUpdates();
      unsubscribeGifts();
    };
  }, [loadSeasonData, subscribeToUpdates, subscribeToGiftEvents]);

  if (isLoading || !seasonData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <IconSymbol
          ios_icon_name="trophy.fill"
          android_material_icon_name="emoji_events"
          size={16}
          color="#FFD700"
        />
        <Text style={styles.seasonText}>S{seasonData.seasonNumber}</Text>
        <Text style={styles.rankText}>#{seasonData.rank}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 100,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
});
