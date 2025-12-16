
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { battleService, BattleLobby, BattleMatch, MatchDuration } from '@/app/services/battleService';
import { supabase } from '@/app/integrations/supabase/client';
import ChatOverlay from '@/components/ChatOverlay';
import EnhancedGiftOverlay from '@/components/EnhancedGiftOverlay';

export default function BattleLiveMatchScreen() {
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [lobby, setLobby] = useState<BattleLobby | null>(null);
  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facing, setFacing] = useState<CameraType>('front');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  // Battle Leader states
  const [isBattleLeader, setIsBattleLeader] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<MatchDuration | null>(null);
  const [opponentDuration, setOpponentDuration] = useState<MatchDuration | null>(null);
  
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Gift overlay state
  const [showGiftOverlay, setShowGiftOverlay] = useState(false);
  
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLobbyAndMatch = useCallback(async () => {
    if (!lobbyId || !user) return;

    try {
      // Fetch lobby
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();

      if (lobbyError) {
        console.error('❌ Error fetching lobby:', lobbyError);
        return;
      }

      // Fetch match
      const { data: matchData, error: matchError } = await supabase
        .from('battle_matches')
        .select('*')
        .or(`lobby_a_id.eq.${lobbyId},lobby_b_id.eq.${lobbyId}`)
        .eq('status', 'live')
        .single();

      if (matchError && matchError.code !== 'PGRST116') {
        console.error('❌ Error fetching match:', matchError);
      }

      if (isMountedRef.current) {
        setLobby(lobbyData as BattleLobby);
        setMatch(matchData as BattleMatch || null);
        setIsLoading(false);
        
        // Determine if user is battle leader
        if (matchData) {
          const isLeader = matchData.team_a_leader_id === user.id || matchData.team_b_leader_id === user.id;
          setIsBattleLeader(isLeader);

          // Check if duration is set and start timer
          if (matchData.duration_minutes > 0 && !isTimerRunning) {
            const elapsed = matchData.started_at
              ? Math.floor((Date.now() - new Date(matchData.started_at).getTime()) / 1000)
              : 0;
            const remaining = matchData.duration_minutes * 60 - elapsed;
            
            if (remaining > 0) {
              setTimeRemaining(remaining);
              setIsTimerRunning(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Exception fetching data:', error);
    }
  }, [lobbyId, user, isTimerRunning]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLobbyAndMatch();

    // Subscribe to updates
    if (lobbyId) {
      const channel = supabase
        .channel(`battle_match:${lobbyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'battle_lobbies',
            filter: `id=eq.${lobbyId}`,
          },
          () => {
            if (isMountedRef.current) {
              fetchLobbyAndMatch();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'battle_matches',
          },
          () => {
            if (isMountedRef.current) {
              fetchLobbyAndMatch();
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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [lobbyId, fetchLobbyAndMatch]);

  const handleMatchEnd = useCallback(async () => {
    if (!match) return;

    // End the match and distribute rewards
    await battleService.endBattleMatch(match.id);

    // Navigate to post-match screen
    router.replace({
      pathname: '/screens/BattlePostMatchScreen',
      params: { matchId: match.id },
    });
  }, [match, router]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            setIsTimerRunning(false);
            handleMatchEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [isTimerRunning, timeRemaining, handleMatchEnd]);

  const handleDurationSelect = async (duration: MatchDuration) => {
    if (!match || !user) return;

    setSelectedDuration(duration);
    setShowDurationModal(false);
    
    const { success, bothAgreed, error } = await battleService.submitDurationSelection(
      match.id,
      user.id,
      duration
    );

    if (error) {
      Alert.alert('Error', error.message);
      setSelectedDuration(null);
      return;
    }

    if (bothAgreed) {
      Alert.alert(
        'Duration Set! 🔥',
        `Battle will last ${duration} minutes. Let the roasting begin!`,
        [{ text: 'LET\'S GO!' }]
      );
    } else {
      Alert.alert(
        'Duration Selected',
        `You selected ${duration} minutes. Waiting for opponent battle leader to confirm...`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleEndMatch = () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to end the match early?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Match',
          style: 'destructive',
          onPress: async () => {
            if (match) {
              await handleMatchEnd();
            }
          },
        },
      ]
    );
  };

  const handleGiftSent = async (giftId: string, amountSek: number) => {
    if (!match || !user) return;

    // Determine which team to send gift to
    const userTeam = lobby?.team_a_players.includes(user.id) ? 'team_a' : 'team_b';
    const receiverTeam = userTeam; // Gifts go to your own team

    await battleService.sendBattleGift(match.id, user.id, receiverTeam, giftId, amountSek);
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
            We need camera and microphone permissions for the battle
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading battle match...
        </Text>
      </View>
    );
  }

  if (!lobby) {
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
    <View style={styles.container}>
      {/* Split Screen Layout */}
      <View style={styles.splitContainer}>
        {/* Team A (Left Side) */}
        <View style={styles.teamSide}>
          {isCameraOn ? (
            <CameraView style={StyleSheet.absoluteFill} facing={facing} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
          )}
          <View style={styles.teamOverlay}>
            <Text style={styles.teamLabel}>TEAM A</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Team B (Right Side) */}
        <View style={styles.teamSide}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]} />
          <View style={styles.teamOverlay}>
            <Text style={styles.teamLabel}>TEAM B</Text>
          </View>
        </View>
      </View>

      {/* Header with Timer */}
      <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleEndMatch}>
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
            <Text style={styles.liveText}>LIVE BATTLE</Text>
          </View>
          
          {timeRemaining !== null && (
            <View style={styles.timerContainer}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* Battle Leader Duration Selection */}
      {isBattleLeader && !selectedDuration && match && !match.duration_minutes && (
        <View style={styles.leaderPrompt}>
          <Text style={styles.leaderPromptText}>
            You are the Battle Leader! Select match duration:
          </Text>
          <TouchableOpacity
            style={styles.selectDurationButton}
            onPress={() => setShowDurationModal(true)}
          >
            <Text style={styles.selectDurationText}>Select Duration</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Team A</Text>
          <Text style={styles.scoreValue}>{match?.team_a_score || 0}</Text>
        </View>
        <Text style={styles.scoreVs}>VS</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Team B</Text>
          <Text style={styles.scoreValue}>{match?.team_b_score || 0}</Text>
        </View>
      </View>

      {/* Chat Overlay */}
      <ChatOverlay streamId={match?.stream_id || lobby.id} />

      {/* Gift Overlay */}
      {showGiftOverlay && match && (
        <EnhancedGiftOverlay
          streamId={match.stream_id || lobby.id}
          streamerId={lobby.host_id}
          onClose={() => setShowGiftOverlay(false)}
          onGiftSent={handleGiftSent}
        />
      )}

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

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: 'rgba(255, 215, 0, 0.9)' }]}
          onPress={() => setShowGiftOverlay(true)}
        >
          <IconSymbol
            ios_icon_name="gift.fill"
            android_material_icon_name="card_giftcard"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Duration Selection Modal */}
      <Modal
        visible={showDurationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Match Duration
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Both battle leaders must agree on the same duration
            </Text>
            
            {[3, 6, 12, 22, 30].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationOption,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                ]}
                onPress={() => handleDurationSelect(duration as MatchDuration)}
              >
                <Text style={[styles.durationText, { color: colors.text }]}>
                  {duration} minutes
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt }]}
              onPress={() => setShowDurationModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  permissionButton: {
    backgroundColor: '#A40028',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  teamSide: {
    flex: 1,
    position: 'relative',
  },
  teamOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 120 : 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  divider: {
    width: 2,
    backgroundColor: '#A40028',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    gap: 8,
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  leaderPrompt: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 180 : 170,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  leaderPromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectDurationButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A40028',
  },
  scoreContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 260 : 250,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  scoreCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreVs: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  durationOption: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
