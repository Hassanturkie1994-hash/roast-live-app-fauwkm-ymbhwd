
/**
 * Creator Burnout Protection Component
 * 
 * Implements creator-side protections for Roast Ranking Seasons.
 * 
 * Burnout prevention:
 * - Daily score caps
 * - Soft diminishing returns after long sessions
 * - Cooldown suggestions in UI
 * 
 * Rules:
 * - No penalties for going offline
 * - No forced participation
 * - Rankings are opt-in by going live
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';

interface CreatorBurnoutProtectionProps {
  creatorId: string;
  streamId?: string;
}

interface BurnoutMetrics {
  session_duration_minutes: number;
  today_score_earned: number;
  daily_cap: number;
  cap_reached: boolean;
  diminishing_returns_active: boolean;
  diminishing_returns_multiplier: number;
  suggested_cooldown_minutes: number;
  sessions_today: number;
}

export const CreatorBurnoutProtection: React.FC<CreatorBurnoutProtectionProps> = ({
  creatorId,
  streamId,
}) => {
  const [metrics, setMetrics] = useState<BurnoutMetrics>({
    session_duration_minutes: 0,
    today_score_earned: 0,
    daily_cap: 1000,
    cap_reached: false,
    diminishing_returns_active: false,
    diminishing_returns_multiplier: 1.0,
    suggested_cooldown_minutes: 0,
    sessions_today: 0,
  });

  const [warningOpacity] = useState(new Animated.Value(0));

  const showWarning = useCallback(() => {
    Animated.sequence([
      Animated.timing(warningOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(5000),
      Animated.timing(warningOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [warningOpacity]);

  const loadBurnoutMetrics = useCallback(async () => {
    try {
      // This would be calculated server-side in production
      // For now, we'll use placeholder logic

      // Calculate session duration
      if (streamId) {
        const { data: stream } = await supabase
          .from('streams')
          .select('started_at')
          .eq('id', streamId)
          .single();

        if (stream) {
          const startTime = new Date(stream.started_at).getTime();
          const now = new Date().getTime();
          const durationMinutes = Math.floor((now - startTime) / 60000);

          // Diminishing returns after 3 hours
          const diminishingReturnsActive = durationMinutes > 180;
          const diminishingReturnsMultiplier = diminishingReturnsActive
            ? Math.max(0.5, 1 - ((durationMinutes - 180) / 360))
            : 1.0;

          // Suggest cooldown after 4 hours
          const suggestedCooldown = durationMinutes > 240
            ? Math.min(60, Math.floor((durationMinutes - 240) / 4))
            : 0;

          setMetrics((prev) => ({
            ...prev,
            session_duration_minutes: durationMinutes,
            diminishing_returns_active: diminishingReturnsActive,
            diminishing_returns_multiplier: diminishingReturnsMultiplier,
            suggested_cooldown_minutes: suggestedCooldown,
          }));
        }
      }

      // Get today's score (would be from a daily stats table)
      const today = new Date().toISOString().split('T')[0];
      const { data: todayParticipations } = await supabase
        .from('roast_team_battle_participation')
        .select('season_score')
        .eq('creator_id', creatorId)
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      if (todayParticipations) {
        const todayScore = todayParticipations.reduce((sum, p) => sum + p.season_score, 0);
        const dailyCap = 1000;
        const capReached = todayScore >= dailyCap;

        setMetrics((prev) => ({
          ...prev,
          today_score_earned: todayScore,
          daily_cap: dailyCap,
          cap_reached: capReached,
          sessions_today: todayParticipations.length,
        }));
      }
    } catch (error) {
      console.error('Error loading burnout metrics:', error);
    }
  }, [creatorId, streamId]);

  useEffect(() => {
    loadBurnoutMetrics();
    const interval = setInterval(loadBurnoutMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [loadBurnoutMetrics]);

  useEffect(() => {
    if (metrics.cap_reached || metrics.suggested_cooldown_minutes > 0) {
      showWarning();
    }
  }, [metrics.cap_reached, metrics.suggested_cooldown_minutes, showWarning]);

  return (
    <View style={styles.container}>
      {/* Daily Cap Warning */}
      {metrics.cap_reached && (
        <Animated.View style={[styles.warningBanner, { opacity: warningOpacity }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Daily Cap Reached</Text>
            <Text style={styles.warningText}>
              You&apos;ve reached today&apos;s score cap. Take a break!
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Diminishing Returns Warning */}
      {metrics.diminishing_returns_active && (
        <View style={styles.infoBar}>
          <Text style={styles.infoIcon}>⏱️</Text>
          <Text style={styles.infoText}>
            Diminishing returns active ({Math.round(metrics.diminishing_returns_multiplier * 100)}%)
          </Text>
        </View>
      )}

      {/* Cooldown Suggestion */}
      {metrics.suggested_cooldown_minutes > 0 && (
        <Animated.View style={[styles.cooldownBanner, { opacity: warningOpacity }]}>
          <Text style={styles.cooldownIcon}>💤</Text>
          <View style={styles.cooldownContent}>
            <Text style={styles.cooldownTitle}>
              Suggested Break: {metrics.suggested_cooldown_minutes} min
            </Text>
            <Text style={styles.cooldownText}>
              Your well-being matters! Take a break to maintain peak performance.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Session Duration Indicator */}
      {streamId && metrics.session_duration_minutes > 0 && (
        <View style={styles.durationBar}>
          <Text style={styles.durationText}>
            ⏱️ {Math.floor(metrics.session_duration_minutes / 60)}h {metrics.session_duration_minutes % 60}m
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    right: 12,
    zIndex: 50,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cooldownBanner: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  cooldownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cooldownContent: {
    flex: 1,
  },
  cooldownTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cooldownText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  durationBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 8,
    alignSelf: 'flex-start',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
