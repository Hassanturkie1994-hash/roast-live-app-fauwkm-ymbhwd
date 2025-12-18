
/**
 * Season Progress Overlay Component
 * 
 * Displays during live streams to show:
 * - Creator rank badge
 * - Season progress bar
 * - Rank-up animations
 * - Battle win streak indicators
 * 
 * Psychology rules:
 * - Rank progress is always visible
 * - Near-rank-up states are emphasized
 * - Viewers are nudged to "push creator over the edge"
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import * as Haptics from 'expo-haptics';

interface SeasonProgressOverlayProps {
  creatorId: string;
  streamId: string;
  onGiftPress?: () => void;
}

interface SeasonProgress {
  season_id: string;
  season_name: string;
  season_score: number;
  rank_tier: string | null;
  current_rank: number;
  total_creators: number;
  percentile: number;
  next_tier_threshold: number;
  progress_to_next_tier: number;
}

export const SeasonProgressOverlay: React.FC<SeasonProgressOverlayProps> = ({
  creatorId,
  streamId,
  onGiftPress,
}) => {
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [isNearRankUp, setIsNearRankUp] = useState(false);
  const [showRankUpAnimation, setShowRankUpAnimation] = useState(false);
  const [battleWinStreak, setBattleWinStreak] = useState(0);

  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [rankUpAnim] = useState(new Animated.Value(0));
  const [progressBarAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadProgress();
    subscribeToUpdates();
  }, [creatorId]);

  useEffect(() => {
    if (isNearRankUp) {
      startNearRankUpAnimation();
    }
  }, [isNearRankUp]);

  useEffect(() => {
    if (progress) {
      animateProgressBar(progress.progress_to_next_tier);
    }
  }, [progress?.progress_to_next_tier]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_creator_season_progress', { p_creator_id: creatorId });

      if (error) {
        console.error('Error loading season progress:', error);
        return;
      }

      if (data && data.length > 0) {
        const progressData = data[0] as SeasonProgress;
        setProgress(progressData);
        setIsNearRankUp(progressData.progress_to_next_tier >= 90);
      }
    } catch (error) {
      console.error('Exception loading season progress:', error);
    }
  };

  const subscribeToUpdates = () => {
    // Subscribe to season score updates
    const scoreChannel = supabase
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
          console.log('📡 Season score updated:', payload);
          handleScoreUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoreChannel);
    };
  };

  const handleScoreUpdate = async (payload: any) => {
    const oldProgress = progress;
    await loadProgress();

    // Check if rank improved
    if (oldProgress && progress && progress.current_rank < oldProgress.current_rank) {
      triggerRankUpAnimation();
    }

    // Check if tier changed
    if (oldProgress && progress && progress.rank_tier !== oldProgress.rank_tier) {
      triggerTierUpAnimation();
    }
  };

  const startNearRankUpAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateProgressBar = (targetProgress: number) => {
    Animated.spring(progressBarAnim, {
      toValue: targetProgress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const triggerRankUpAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.sequence([
      Animated.timing(rankUpAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(rankUpAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setShowRankUpAnimation(true);
    setTimeout(() => setShowRankUpAnimation(false), 2500);
  };

  const triggerTierUpAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.5,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getTierColor = (tierName: string | null): string => {
    if (!tierName) return '#CCCCCC';
    
    const tierColors: Record<string, string> = {
      'Bronze Mouth': '#CD7F32',
      'Silver Tongue': '#C0C0C0',
      'Golden Roast': '#FFD700',
      'Diamond Disrespect': '#B9F2FF',
      'Legendary Menace': '#FF0000',
    };

    return tierColors[tierName] || '#CCCCCC';
  };

  const getTierIcon = (tierName: string | null): string => {
    if (!tierName) return '🏅';
    
    const tierIcons: Record<string, string> = {
      'Bronze Mouth': '🥉',
      'Silver Tongue': '🥈',
      'Golden Roast': '🥇',
      'Diamond Disrespect': '💎',
      'Legendary Menace': '👑',
    };

    return tierIcons[tierName] || '🏅';
  };

  if (!progress) {
    return null;
  }

  const tierColor = getTierColor(progress.rank_tier);
  const tierIcon = getTierIcon(progress.rank_tier);

  return (
    <View style={styles.container}>
      {/* Rank Badge */}
      <Animated.View
        style={[
          styles.rankBadge,
          {
            backgroundColor: tierColor,
            transform: [{ scale: pulseAnim }],
            shadowColor: tierColor,
            shadowOpacity: glowAnim,
            shadowRadius: 20,
          },
        ]}
      >
        <Text style={styles.rankBadgeIcon}>{tierIcon}</Text>
        <Text style={styles.rankBadgeText}>#{progress.current_rank}</Text>
      </Animated.View>

      {/* Season Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {progress.rank_tier || 'Unranked'}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress.progress_to_next_tier)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressBarAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: tierColor,
              },
            ]}
          />
        </View>

        {/* Near Rank-Up Nudge */}
        {isNearRankUp && (
          <TouchableOpacity
            style={[styles.nudgeBanner, { backgroundColor: tierColor }]}
            onPress={onGiftPress}
            activeOpacity={0.8}
          >
            <Text style={styles.nudgeText}>
              🔥 Almost there! Gift to push them over the edge! 🔥
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Battle Win Streak */}
      {battleWinStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakIcon}>⚔️</Text>
          <Text style={styles.streakText}>{battleWinStreak} Win Streak</Text>
          <View style={styles.streakFlames}>
            {Array.from({ length: Math.min(battleWinStreak, 5) }).map((_, i) => (
              <Text key={i} style={styles.streakFlame}>🔥</Text>
            ))}
          </View>
        </View>
      )}

      {/* Rank-Up Animation */}
      {showRankUpAnimation && (
        <Animated.View
          style={[
            styles.rankUpOverlay,
            {
              opacity: rankUpAnim,
              transform: [
                {
                  scale: rankUpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.rankUpText}>🎉 RANK UP! 🎉</Text>
          <Text style={styles.rankUpSubtext}>
            Now #{progress.current_rank}
          </Text>
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
    marginBottom: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  rankBadgeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressPercentage: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  nudgeBanner: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  nudgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  streakFlames: {
    flexDirection: 'row',
  },
  streakFlame: {
    fontSize: 14,
    marginLeft: 2,
  },
  rankUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 32,
  },
  rankUpText: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  rankUpSubtext: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
