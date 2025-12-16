
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { battleService, BattleLobby } from '@/app/services/battleService';
import { supabase } from '@/app/integrations/supabase/client';
import ChatOverlay from '@/components/ChatOverlay';

interface PlayerData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  isReady: boolean;
  isHost: boolean;
}

export default function BattlePreMatchLobbyScreen() {
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [lobby, setLobby] = useState<BattleLobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facing, setFacing] = useState<CameraType>('front');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [playersData, setPlayersData] = useState<PlayerData[]>([]);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const fetchLobby = useCallback(async () => {
    if (!lobbyId || !user) return;

    try {
      const { data, error } = await supabase
        .from('battle_lobbies')
        .select('*')
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
        
        // Fetch player data
        if (data.team_a_players && data.team_a_players.length > 0) {
          await fetchPlayersData(data.team_a_players, data.host_id);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Exception fetching lobby:', error);
    }
  }, [lobbyId, user]);

  const fetchPlayersData = async (playerIds: string[], hostId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', playerIds);

      if (error) {
        console.error('❌ Error fetching players data:', error);
        return;
      }

      const players: PlayerData[] = (data || []).map((profile) => ({
        id: profile.id,
        username: profile.username || 'Unknown',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        isReady: true, // In pre-match lobby, all joined players are considered ready
        isHost: profile.id === hostId,
      }));

      setPlayersData(players);
    } catch (error) {
      console.error('❌ Exception fetching players data:', error);
    }
  };

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

  // Check if match is found and all players accepted
  useEffect(() => {
    if (lobby?.status === 'in_battle') {
      // Navigate to live battle match screen
      router.replace({
        pathname: '/screens/BattleLiveMatchScreen',
        params: { lobbyId: lobby.id },
      });
    }
  }, [lobby]);

  const handleLeaveLobby = async () => {
    if (!lobby || !user) return;

    Alert.alert(
      'Leave Lobby',
      'Are you sure you want to leave the pre-match lobby?',
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

  const toggleCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const toggleCameraOnOff = () => {
    setIsCameraOn((prev) => !prev);
  };

  const getPlayerSlots = () => {
    if (!lobby) return [];
    
    const maxPlayers = lobby.max_players_per_team;
    const slots: Array<{ index: number; player: PlayerData | null }> = [];
    
    for (let i = 0; i < maxPlayers; i++) {
      const player = playersData[i] || null;
      slots.push({
        index: i,
        player,
      });
    }
    
    return slots;
  };

  const renderPlayerSlot = (slot: { index: number; player: PlayerData | null }) => {
    const { player } = slot;

    if (!player) {
      // Empty slot
      return (
        <View
          key={slot.index}
          style={[
            styles.playerTile,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          <View style={styles.emptyTileContent}>
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person_add"
              size={32}
              color="rgba(255, 255, 255, 0.4)"
            />
            <Text style={styles.emptyTileText}>Waiting...</Text>
          </View>
        </View>
      );
    }

    // Player slot with data
    return (
      <View
        key={slot.index}
        style={[
          styles.playerTile,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderColor: player.isHost ? '#FFD700' : 'rgba(255, 255, 255, 0.2)',
            borderWidth: player.isHost ? 3 : 2,
          },
        ]}
      >
        {/* Avatar */}
        {player.avatar_url ? (
          <Image
            source={{ uri: player.avatar_url }}
            style={styles.playerAvatar}
          />
        ) : (
          <View style={[styles.playerAvatar, styles.placeholderAvatar]}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={32}
              color="#FFFFFF"
            />
          </View>
        )}

        {/* Username */}
        <Text style={styles.playerUsername} numberOfLines={1}>
          {player.display_name || player.username}
          {player.isHost && ' 👑'}
        </Text>

        {/* Ready indicator */}
        <View style={[styles.readyBadge, { backgroundColor: player.isReady ? '#00C853' : '#FFA500' }]}>
          <Text style={styles.readyText}>{player.isReady ? 'READY' : 'NOT READY'}</Text>
        </View>

        {/* Mic/Camera indicators */}
        <View style={styles.playerTileControls}>
          <View style={[styles.controlIndicator, { backgroundColor: 'rgba(0, 255, 0, 0.8)' }]}>
            <IconSymbol
              ios_icon_name="mic.fill"
              android_material_icon_name="mic"
              size={12}
              color="#FFFFFF"
            />
          </View>
          <View style={[styles.controlIndicator, { backgroundColor: 'rgba(0, 255, 0, 0.8)' }]}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={12}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    );
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            We need camera and microphone permissions for the battle lobby
          </Text>
          <GradientButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading pre-match lobby...
        </Text>
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

  const playerSlots = getPlayerSlots();

  return (
    <View style={styles.container}>
      {/* Camera Background */}
      {isCameraOn ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      )}

      {/* Dark Overlay */}
      <View style={styles.overlay} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveLobby}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>PRE-MATCH LOBBY</Text>
          </View>
          <Text style={styles.formatText}>{lobby.format.toUpperCase()}</Text>
          <Text style={styles.playerCountText}>
            {playersData.length}/{lobby.max_players_per_team} Players
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Player Tiles Grid */}
      <View style={styles.tilesContainer}>
        {playerSlots.map((slot) => renderPlayerSlot(slot))}
      </View>

      {/* Status Message */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {lobby.status === 'waiting' && playersData.length < lobby.max_players_per_team && 
            `⏳ Waiting for ${lobby.max_players_per_team - playersData.length} more player${lobby.max_players_per_team - playersData.length > 1 ? 's' : ''}...`}
          {lobby.status === 'waiting' && playersData.length === lobby.max_players_per_team && 
            '✅ Team full! Ready to search for opponents...'}
          {lobby.status === 'searching' && '🔍 Searching for opponents...'}
          {lobby.status === 'matched' && '✅ Match found! Waiting for acceptance...'}
        </Text>
      </View>

      {/* Chat Overlay */}
      <ChatOverlay streamId={lobby.id} />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
          onPress={toggleMic}
        >
          <IconSymbol
            ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
            android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
          onPress={toggleCameraOnOff}
        >
          <IconSymbol
            ios_icon_name={isCameraOn ? 'video.fill' : 'video.slash.fill'}
            android_material_icon_name={isCameraOn ? 'videocam' : 'videocam_off'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <IconSymbol
            ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
            android_material_icon_name="flip_camera_ios"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
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
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A40028',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  placeholder: {
    width: 40,
  },
  tilesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    alignContent: 'center',
  },
  playerTile: {
    width: '48%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  readyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerTileControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  controlIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTileContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTileText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
  },
});
