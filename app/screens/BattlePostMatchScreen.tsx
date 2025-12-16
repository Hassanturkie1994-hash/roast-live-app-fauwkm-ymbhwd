
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { battleService, BattleMatch, BattleLobby, BattleReward } from '@/app/services/battleService';
import { supabase } from '@/app/integrations/supabase/client';

export default function BattlePostMatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [lobbyA, setLobbyA] = useState<BattleLobby | null>(null);
  const [lobbyB, setLobbyB] = useState<BattleLobby | null>(null);
  const [userReward, setUserReward] = useState<BattleReward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);

  const fetchMatchData = useCallback(async () => {
    if (!matchId || !user) return;

    try {
      const { data: matchData, error: matchError } = await supabase
        .from('battle_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('❌ Error fetching match:', matchError);
        return;
      }

      setMatch(matchData as BattleMatch);

      // Fetch lobbies
      const { data: lobbyAData } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('id', matchData.lobby_a_id)
        .single();

      const { data: lobbyBData } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('id', matchData.lobby_b_id)
        .single();

      setLobbyA(lobbyAData as BattleLobby);
      setLobbyB(lobbyBData as BattleLobby);

      // Fetch user's reward
      const { data: rewardData } = await supabase
        .from('battle_rewards')
        .select('*')
        .eq('match_id', matchId)
        .eq('player_id', user.id)
        .single();

      setUserReward(rewardData as BattleReward);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Exception fetching match data:', error);
    }
  }, [matchId, user]);

  useEffect(() => {
    fetchMatchData();

    // Subscribe to match updates
    if (matchId) {
      const channel = supabase
        .channel(`battle_match_post:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'battle_matches',
            filter: `id=eq.${matchId}`,
          },
          () => {
            fetchMatchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchId, fetchMatchData]);

  const handleRequestRematch = async () => {
    if (!match || !user) return;

    setIsRequestingRematch(true);
    const { success, error } = await battleService.requestRematch(match.id, user.id);

    if (error) {
      console.error('❌ Error requesting rematch:', error);
    }

    setIsRequestingRematch(false);
  };

  const handleEndBattle = async () => {
    if (!match) return;

    await battleService.endBattle(match.id);

    // Return to appropriate screen
    if (lobbyA?.return_to_solo_stream && lobbyA.original_stream_id) {
      router.replace({
        pathname: '/live-player',
        params: { streamId: lobbyA.original_stream_id },
      });
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  const getWinnerText = (): string => {
    if (!match) return '';

    if (match.winner_team === 'draw') {
      return "IT'S A DRAW! 🔥";
    }

    const userTeam = lobbyA?.team_a_players.includes(user?.id || '') ? 'team_a' : 'team_b';
    const isWinner = match.winner_team === userTeam;

    if (isWinner) {
      return 'YOU WON! 🏆🔥';
    } else {
      return 'YOU LOST! 💀';
    }
  };

  const isBattleLeader = (): boolean => {
    if (!match || !user) return false;
    return match.team_a_leader_id === user.id || match.team_b_leader_id === user.id;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading results...
        </Text>
      </View>
    );
  }

  if (!match || !lobbyA || !lobbyB) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Match not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.brandPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleEndBattle}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Battle Results</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Winner Announcement */}
        <View style={styles.winnerSection}>
          <Text style={[styles.winnerText, { color: match.winner_team === 'draw' ? colors.textSecondary : colors.brandPrimary }]}>
            {getWinnerText()}
          </Text>
        </View>

        {/* Score Display */}
        <View style={styles.scoreSection}>
          <View style={[styles.teamScoreCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.teamLabel, { color: colors.textSecondary }]}>TEAM A</Text>
            <Text style={[styles.teamScore, { color: colors.text }]}>{match.team_a_score}</Text>
            <Text style={[styles.teamGifts, { color: colors.textSecondary }]}>
              {match.team_a_total_gifts_sek} SEK in gifts
            </Text>
          </View>

          <Text style={[styles.vsText, { color: colors.text }]}>VS</Text>

          <View style={[styles.teamScoreCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.teamLabel, { color: colors.textSecondary }]}>TEAM B</Text>
            <Text style={[styles.teamScore, { color: colors.text }]}>{match.team_b_score}</Text>
            <Text style={[styles.teamGifts, { color: colors.textSecondary }]}>
              {match.team_b_total_gifts_sek} SEK in gifts
            </Text>
          </View>
        </View>

        {/* User Reward */}
        {userReward && (
          <View style={[styles.rewardCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>Your Reward</Text>
            <View style={styles.rewardAmount}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={32}
                color={colors.brandPrimary}
              />
              <Text style={[styles.rewardValue, { color: colors.brandPrimary }]}>
                {userReward.reward_amount_sek} SEK
              </Text>
            </View>
            <Text style={[styles.rewardNote, { color: colors.textSecondary }]}>
              {userReward.is_winner
                ? '🏆 Winner bonus included!'
                : 'You still earned from your team\'s gifts!'}
            </Text>
          </View>
        )}

        {/* Rematch Status */}
        {match.winner_team === 'draw' && isBattleLeader() && (
          <View style={[styles.drawCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.drawTitle, { color: colors.text }]}>It\'s a Draw!</Text>
            <Text style={[styles.drawSubtitle, { color: colors.textSecondary }]}>
              As a Battle Leader, you can choose:
            </Text>
          </View>
        )}

        {match.rematch_requested_by && (
          <View style={[styles.rematchStatusCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.rematchStatusText, { color: colors.text }]}>
              {match.rematch_requested_by === 'both'
                ? '🔄 Both teams want a rematch!'
                : `🔄 ${match.rematch_requested_by === 'team_a' ? 'Team A' : 'Team B'} wants a rematch`}
            </Text>
          </View>
        )}

        {/* Actions */}
        {isBattleLeader() && match.status === 'completed' && (
          <View style={styles.actions}>
            {match.winner_team === 'draw' || !match.rematch_requested_by ? (
              <>
                <GradientButton
                  title={isRequestingRematch ? 'REQUESTING...' : 'REQUEST REMATCH 🔥'}
                  onPress={handleRequestRematch}
                  size="large"
                  disabled={isRequestingRematch}
                />
                <TouchableOpacity
                  style={[styles.endButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleEndBattle}
                >
                  <Text style={[styles.endButtonText, { color: colors.text }]}>End Battle</Text>
                </TouchableOpacity>
              </>
            ) : (
              <GradientButton
                title="CONTINUE TO LOBBY"
                onPress={() => {
                  router.replace({
                    pathname: '/screens/BattlePreMatchLobbyScreen',
                    params: { lobbyId: lobbyA.id },
                  });
                }}
                size="large"
              />
            )}
          </View>
        )}

        {!isBattleLeader() && (
          <View style={styles.actions}>
            <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
              Waiting for Battle Leaders to decide...
            </Text>
            <TouchableOpacity
              style={[styles.endButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleEndBattle}
            >
              <Text style={[styles.endButtonText, { color: colors.text }]}>Leave Battle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  winnerSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  winnerText: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 30,
  },
  teamScoreCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8,
  },
  teamGifts: {
    fontSize: 12,
    fontWeight: '400',
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
  },
  rewardCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  rewardAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rewardValue: {
    fontSize: 36,
    fontWeight: '900',
  },
  rewardNote: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  drawCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  drawTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  drawSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  rematchStatusCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  rematchStatusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  endButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
});
