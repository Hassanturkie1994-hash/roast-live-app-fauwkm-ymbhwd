
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { battleService, BattleLobby, BattleFormat } from '@/app/services/battleService';
import { supabase } from '@/app/integrations/supabase/client';

export default function BattleLobbyScreen() {
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [lobby, setLobby] = useState<BattleLobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const fetchLobby = useCallback(async () => {
    if (!lobbyId || !user) return;

    try {
      const { data, error } = await supabase
        .from('battle_lobbies')
        .select('*, profiles!host_id(*)')
        .eq('id', lobbyId)
        .single();

      if (error) {
        console.error('❌ Error fetching lobby:', error);
        Alert.alert('Error', 'Failed to load lobby');
        router.back();
        return;
      }

      if (isMountedRef.current) {
        setLobby(data as BattleLobby);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Exception fetching lobby:', error);
    }
  }, [lobbyId, user]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLobby();

    // Subscribe to lobby updates
    if (lobbyId) {
      const channel = supabase
        .channel(`battle_lobby:${lobbyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'battle_lobbies',
            filter: `id=eq.${lobbyId}`,
          },
          (payload) => {
            console.log('🔄 Lobby updated:', payload);
            if (isMountedRef.current) {
              fetchLobby();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [lobbyId, fetchLobby]);

  const handleSearchMatch = async () => {
    if (!lobby || !user) return;

    // Check if lobby is full
    if (lobby.current_players_count < lobby.max_players_per_team) {
      Alert.alert(
        'Lobby Not Full',
        `You need ${lobby.max_players_per_team} players to start matchmaking. Current: ${lobby.current_players_count}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if user is blocked
    const isBlocked = await battleService.isUserBlocked(user.id);
    if (isBlocked) {
      Alert.alert(
        'Matchmaking Blocked',
        'You are temporarily blocked from matchmaking for declining a match. Please wait 3 minutes.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSearching(true);

    const { success, error } = await battleService.enterMatchmaking(lobby.id);

    if (error) {
      Alert.alert('Error', 'Failed to enter matchmaking. Please try again.');
      setIsSearching(false);
      return;
    }

    console.log('✅ Entered matchmaking');
  };

  const handleInviteFriend = () => {
    if (!lobby) return;
    router.push({
      pathname: '/screens/BattleInviteFriendsScreen',
      params: { lobbyId: lobby.id },
    });
  };

  const handleLeaveLobby = async () => {
    if (!lobby || !user) return;

    Alert.alert(
      'Leave Lobby',
      lobby.host_id === user.id
        ? 'As the host, leaving will cancel the lobby for all players. Are you sure?'
        : 'Are you sure you want to leave this lobby?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { success } = await battleService.leaveLobby(lobby.id, user.id);
            if (success) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const getFormatDisplay = (format: BattleFormat): string => {
    return format.toUpperCase();
  };

  const getPlayerSlots = (): { filled: number; total: number } => {
    if (!lobby) return { filled: 0, total: 0 };
    return {
      filled: lobby.current_players_count,
      total: lobby.max_players_per_team,
    };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading lobby...</Text>
      </View>
    );
  }

  if (!lobby) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Lobby not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.brandPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const slots = getPlayerSlots();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveLobby}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Battle Lobby</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Format Badge */}
      <View style={styles.formatBadge}>
        <Text style={styles.formatText}>{getFormatDisplay(lobby.format)}</Text>
      </View>

      {/* Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status</Text>
        <Text style={[styles.statusValue, { color: colors.text }]}>
          {lobby.status === 'waiting' && '⏳ Waiting for players'}
          {lobby.status === 'searching' && '🔍 Searching for match...'}
          {lobby.status === 'matched' && '✅ Match found!'}
          {lobby.status === 'in_battle' && '⚔️ Battle in progress'}
        </Text>
      </View>

      {/* Player Slots */}
      <View style={[styles.slotsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.slotsTitle, { color: colors.text }]}>Team Players</Text>
        <View style={styles.slotsProgress}>
          <View style={styles.slotsBar}>
            <View
              style={[
                styles.slotsBarFilled,
                {
                  backgroundColor: colors.brandPrimary || '#A40028',
                  width: `${(slots.filled / slots.total) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.slotsText, { color: colors.text }]}>
            {slots.filled} / {slots.total}
          </Text>
        </View>
      </View>

      {/* Players List */}
      <View style={[styles.playersCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.playersTitle, { color: colors.text }]}>Players</Text>
        <FlatList
          data={lobby.team_a_players}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.playerItem}>
              <View style={styles.playerAvatar}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.text}
                />
              </View>
              <Text style={[styles.playerName, { color: colors.text }]}>
                Player {index + 1} {item === lobby.host_id && '(Host)'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No players yet</Text>
          }
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {lobby.status === 'waiting' && (
          <>
            <TouchableOpacity
              style={[styles.inviteButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleInviteFriend}
            >
              <IconSymbol
                ios_icon_name="person.badge.plus"
                android_material_icon_name="person_add"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.inviteButtonText, { color: colors.text }]}>Invite Friends</Text>
            </TouchableOpacity>

            {lobby.host_id === user?.id && (
              <View style={styles.searchButtonContainer}>
                <GradientButton
                  title={isSearching ? 'SEARCHING...' : 'SEARCH MATCH'}
                  onPress={handleSearchMatch}
                  size="large"
                  disabled={isSearching || slots.filled < slots.total}
                />
              </View>
            )}
          </>
        )}

        {lobby.status === 'searching' && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
            <Text style={[styles.searchingText, { color: colors.text }]}>
              Searching for opponents...
            </Text>
          </View>
        )}

        {lobby.status === 'matched' && (
          <View style={styles.matchedContainer}>
            <Text style={[styles.matchedText, { color: colors.text }]}>Match found!</Text>
            <Text style={[styles.matchedSubtext, { color: colors.textSecondary }]}>
              Waiting for all players to accept...
            </Text>
            <View style={styles.acceptButtonContainer}>
              <GradientButton
                title="ACCEPT MATCH"
                onPress={async () => {
                  // TODO: Accept match logic
                  // For now, navigate to pre-match lobby
                  router.push({
                    pathname: '/screens/BattlePreMatchLobbyScreen',
                    params: { lobbyId: lobby.id },
                  });
                }}
                size="large"
              />
            </View>
          </View>
        )}
      </View>
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
    paddingTop: 60,
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
  formatBadge: {
    alignSelf: 'center',
    backgroundColor: '#A40028',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  formatText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  slotsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  slotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  slotsProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotsBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  slotsBarFilled: {
    height: '100%',
    borderRadius: 4,
  },
  slotsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  playersCard: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchButtonContainer: {
    marginTop: 8,
  },
  searchingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  searchingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  matchedContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  matchedText: {
    fontSize: 20,
    fontWeight: '700',
  },
  matchedSubtext: {
    fontSize: 14,
    fontWeight: '400',
  },
  acceptButtonContainer: {
    width: '100%',
    marginTop: 12,
  },
});
