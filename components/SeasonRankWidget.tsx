
/**
 * Season Rank Widget Component
 * 
 * Compact widget for displaying season rank on profile screens.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSeasonRanking } from '@/hooks/useSeasonRanking';
import { useRouter } from 'expo-router';

interface SeasonRankWidgetProps {
  creatorId: string;
  onPress?: () => void;
}

export const SeasonRankWidget: React.FC<SeasonRankWidgetProps> = ({
  creatorId,
  onPress,
}) => {
  const { progress, loading } = useSeasonRanking(creatorId);
  const router = useRouter();

  const getTierColor = (tierName: string | null): string => {
    const tierColors: Record<string, string> = {
      'Bronze Mouth': '#CD7F32',
      'Silver Tongue': '#C0C0C0',
      'Golden Roast': '#FFD700',
      'Diamond Disrespect': '#B9F2FF',
      'Legendary Menace': '#FF0000',
    };
    return tierColors[tierName || ''] || '#CCCCCC';
  };

  const getTierIcon = (tierName: string | null): string => {
    const tierIcons: Record<string, string> = {
      'Bronze Mouth': '🥉',
      'Silver Tongue': '🥈',
      'Golden Roast': '🥇',
      'Diamond Disrespect': '💎',
      'Legendary Menace': '👑',
    };
    return tierIcons[tierName || ''] || '🏅';
  };

  if (loading || !progress) {
    return null;
  }

  const tierColor = getTierColor(progress.rank_tier);
  const tierIcon = getTierIcon(progress.rank_tier);

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: tierColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Season Rank</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierIcon}>{tierIcon}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.rankSection}>
          <Text style={[styles.rankNumber, { color: tierColor }]}>
            #{progress.current_rank}
          </Text>
          <Text style={styles.rankLabel}>
            {progress.rank_tier || 'Unranked'}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.progress_to_next_tier}%`,
                  backgroundColor: tierColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress.progress_to_next_tier)}% to next tier
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Top {Math.round(100 - progress.percentile)}% • {progress.total_creators} creators
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierIcon: {
    fontSize: 18,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rankSection: {
    marginRight: 20,
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  progressSection: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 11,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 8,
  },
  footerText: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
  },
});
