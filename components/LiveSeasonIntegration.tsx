
/**
 * Live Season Integration Component
 * 
 * Integrates Roast Ranking Seasons into the live viewer experience.
 * 
 * Displays:
 * - Creator rank badge during live
 * - Season progress bar
 * - Rank-up animations
 * - Battle win streak indicators
 * - Gift momentum indicators
 * 
 * Psychology:
 * - Always shows rank progress
 * - Emphasizes near-rank-up states
 * - Nudges viewers to gift when close to rank-up
 * - Shows combo streaks and hype boosts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import * as Haptics from 'expo-haptics';

interface LiveSeasonIntegrationProps {
  creatorId: string;
  streamId: string;
  onGiftPress?: () => void;
}

interface SeasonData {
  season_id: string;
  season_name: string;
  season_score: number;
  rank_tier: string | null;
  current_rank: number;
  progress_to_next_tier: number;
}

interface GiftMomentum {
  combo_count: number;
  last_gift_at: string;
  hype_multiplier: number;
}

export const LiveSeasonIntegration: React.FC<LiveSeasonIntegrationProps> = ({
  creatorId,
  streamId,
  onGiftPress,
}) => {
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [giftMomentum, setGiftMomentum] = useState<GiftMomentum>({
    combo_count: 0,
    last_gift_at: '',
    hype_multiplier: 1.0,
  });
  const [battleWinStreak, setBattleWinStreak] = useState(0);
  const [showRankUpAnimation, setShowRankUpAnimation] = useState(false);

  // Animations
  const [badgePulse] = useState(new Animated.Value(1));
  const [progressGlow] = useState(new Animated.Value(0));
  const [rankUpScale] = useState(new Animated.Value(0));
  const [comboShake] = useState(new Animated.Value(0));

  useEffect(() => {
    loadSeasonData();
    subscribeToUpdates();
    subscribeToGiftEvents();
  }, [creatorId, streamId]);

  const loadSeasonData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_creator_season_progress', { p_creator_id: creatorId });

      if (!error && data && data.length > 0) {
        setSeasonData(data[0]);
      }
    } catch (error) {
      console.error('Error loading season data:', error);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`creator_rank_updates:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_season_scores',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          handleRankUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToGiftEvents = () => {
    const channel = supabase
      .channel(`roast_gifts:${streamId}`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        handleGiftEvent(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRankUpdate = async (payload: any) => {
    const oldData = seasonData;
    await loadSeasonData();

    // Check for rank improvement
    if (oldData && seasonData && seasonData.current_rank < oldData.current_rank) {
      triggerRankUpAnimation();
    }

    // Check for tier change
    if (oldData && seasonData && seasonData.rank_tier !== oldData.rank_tier) {
      triggerTierUpAnimation();
    }
  };

  const handleGiftEvent = (payload: any) => {
    const now = new Date().toISOString();
    const lastGiftTime = new Date(giftMomentum.last_gift_at).getTime();
    const currentTime = new Date(now).getTime();
    const timeSinceLastGift = currentTime - lastGiftTime;

    // Combo window is 5 seconds
    const isCombo = timeSinceLastGift < 5000;

    if (isCombo) {
      const newComboCount = giftMomentum.combo_count + 1;
      const newHypeMultiplier = Math.min(1.0 + (newComboCount * 0.1), 3.0);

      setGiftMomentum({
        combo_count: newComboCount,
        last_gift_at: now,
        hype_multiplier: newHypeMultiplier,
      });

      triggerComboAnimation(newComboCount);
    } else {
      // Reset combo
      setGiftMomentum({
        combo_count: 1,
        last_gift_at: now,
        hype_multiplier: 1.0,
      });
    }

    // Trigger gift momentum animation
    triggerGiftMomentumAnimation();
  };

  const triggerRankUpAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRankUpAnimation(true);

    Animated.sequence([
      Animated.timing(rankUpScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(rankUpScale, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRankUpAnimation(false);
    });
  };

  const triggerTierUpAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.sequence([
      Animated.timing(badgePulse, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(badgePulse, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 3,
      }),
    ]).start();
  };

  const triggerGiftMomentumAnimation = () => {
    Animated.spring(badgePulse, {
      toValue: 1.1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start(() => {
      Animated.spring(badgePulse, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 5,
      }).start();
    });
  };

  const triggerComboAnimation = (comboCount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(comboShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(comboShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(comboShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(comboShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

  if (!seasonData) {
    return null;
  }

  const tierColor = getTierColor(seasonData.rank_tier);
  const tierIcon = getTierIcon(seasonData.rank_tier);
  const isNearRankUp = seasonData.progress_to_next_tier >= 90;

  return (
    <View style={styles.container}>
      {/* Rank Badge */}
      <Animated.View
        style={[
          styles.rankBadge,
          {
            backgroundColor: tierColor,
            transform: [
              { scale: badgePulse },
              { translateX: comboShake },
            ],
          },
        ]}
      >
        <Text style={styles.rankIcon}>{tierIcon}</Text>
        <Text style={styles.rankText}>#{seasonData.current_rank}</Text>
      </Animated.View>

      {/* Season Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {seasonData.rank_tier || 'Unranked'}
          </Text>
          <Text style={styles.progressPercent}>
            {Math.round(seasonData.progress_to_next_tier)}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${seasonData.progress_to_next_tier}%`,
                backgroundColor: tierColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Near Rank-Up Nudge */}
      {isNearRankUp && onGiftPress && (
        <TouchableOpacity
          style={[styles.nudgeBanner, { backgroundColor: tierColor }]}
          onPress={onGiftPress}
          activeOpacity={0.8}
        >
          <Text style={styles.nudgeText}>
            🔥 {Math.round(100 - seasonData.progress_to_next_tier)}% to rank up! Gift now! 🔥
          </Text>
        </TouchableOpacity>
      )}

      {/* Gift Combo Indicator */}
      {giftMomentum.combo_count > 1 && (
        <Animated.View
          style={[
            styles.comboContainer,
            { transform: [{ translateX: comboShake }] },
          ]}
        >
          <Text style={styles.comboText}>
            🔥 {giftMomentum.combo_count}x COMBO! 🔥
          </Text>
          <Text style={styles.comboMultiplier}>
            {giftMomentum.hype_multiplier.toFixed(1)}x Hype
          </Text>
        </Animated.View>
      )}

      {/* Battle Win Streak */}
      {battleWinStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakIcon}>⚔️</Text>
          <Text style={styles.streakText}>{battleWinStreak} Win Streak</Text>
        </View>
      )}

      {/* Rank-Up Animation Overlay */}
      {showRankUpAnimation && (
        <Animated.View
          style={[
            styles.rankUpOverlay,
            {
              opacity: rankUpScale,
              transform: [
                {
                  scale: rankUpScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.rankUpText}>🎉 RANK UP! 🎉</Text>
          <Text style={styles.rankUpSubtext}>Now #{seasonData.current_rank}</Text>
          <Text style={styles.rankUpTier}>{seasonData.rank_tier}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  rankIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressPercent: {
    color: '#FF1493',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nudgeBanner: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  nudgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comboContainer: {
    backgroundColor: 'rgba(255, 69, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  comboText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comboMultiplier: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankUpOverlay: {
    position: 'absolute',
    top: -60,
    left: -12,
    right: -12,
    bottom: -200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 20,
    padding: 40,
  },
  rankUpText: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  rankUpSubtext: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  rankUpTier: {
    color: '#FF1493',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
