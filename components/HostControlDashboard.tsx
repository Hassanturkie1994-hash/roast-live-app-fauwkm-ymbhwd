
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { streamGuestService, StreamGuestSeat } from '@/app/services/streamGuestService';
import { supabase } from '@/app/integrations/supabase/client';

interface HostControlDashboardProps {
  streamId: string;
  hostId: string;
  visible: boolean;
  onClose: () => void;
}

interface BannedUser {
  id: string;
  user_id: string;
  reason: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface TimedOutUser {
  id: string;
  user_id: string;
  end_time: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const { width, height } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(width * 0.9, 400);
const PANEL_HEIGHT = height * 0.85;

export default function HostControlDashboard({
  streamId,
  hostId,
  visible,
  onClose,
}: HostControlDashboardProps) {
  const [activeGuests, setActiveGuests] = useState<StreamGuestSeat[]>([]);
  const [seatsLocked, setSeatsLocked] = useState(false);
  const [followersOnly, setFollowersOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [moderatorsCanInvite, setModeratorsCanInvite] = useState(false);
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [timedOutUsers, setTimedOutUsers] = useState<TimedOutUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Draggable panel state
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 60 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Load data
  const loadData = useCallback(async () => {
    try {
      // Load active guests
      const guests = await streamGuestService.getActiveGuestSeats(streamId);
      setActiveGuests(guests);

      // Load stream settings
      const { data: stream } = await supabase
        .from('streams')
        .select('seats_locked')
        .eq('id', streamId)
        .single();

      if (stream) {
        setSeatsLocked(stream.seats_locked || false);
      }
    } catch (error) {
      console.error('Error loading host control data:', error);
    }
  }, [streamId]);

  useEffect(() => {
    if (visible) {
      loadData();

      // Subscribe to guest seat changes
      const channel = streamGuestService.subscribeToGuestSeats(streamId, () => {
        loadData();
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [visible, streamId, loadData]);

  // Load banned users
  const loadBannedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*, profiles(display_name, avatar_url)')
        .eq('streamer_id', hostId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error('Error loading banned users:', error);
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  // Load timed out users
  const loadTimedOutUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timed_out_users')
        .select('*, profiles(display_name, avatar_url)')
        .eq('stream_id', streamId)
        .gt('end_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimedOutUsers(data || []);
    } catch (error) {
      console.error('Error loading timed out users:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  // Guest actions
  const handleRemoveGuest = async (guest: StreamGuestSeat) => {
    Alert.alert(
      'Remove Guest',
      `Remove ${guest.profiles?.display_name || 'this guest'} from the stream?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await streamGuestService.removeGuest(streamId, guest.user_id!, hostId);
            if (success) {
              Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} removed from stream`);
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleMuteMic = async (guest: StreamGuestSeat) => {
    const newState = !guest.mic_enabled;
    const success = await streamGuestService.updateMicStatus(streamId, guest.user_id!, newState);
    if (success) {
      Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} ${newState ? 'unmuted' : 'muted'}`);
      loadData();
    }
  };

  const handleDisableCamera = async (guest: StreamGuestSeat) => {
    const newState = !guest.camera_enabled;
    const success = await streamGuestService.updateCameraStatus(streamId, guest.user_id!, newState);
    if (success) {
      Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} camera ${newState ? 'enabled' : 'disabled'}`);
      loadData();
    }
  };

  const handleToggleModerator = async (guest: StreamGuestSeat) => {
    const newState = !guest.is_moderator;
    const success = await streamGuestService.toggleModeratorStatus(
      streamId,
      guest.user_id!,
      hostId,
      newState
    );
    if (success) {
      Alert.alert(
        '✅ Success',
        `${guest.profiles?.display_name || 'Guest'} is ${newState ? 'now a moderator' : 'no longer a moderator'}`
      );
      loadData();
    }
  };

  // Seat management
  const handleLockAllSeats = async () => {
    const success = await streamGuestService.toggleSeatsLock(streamId, hostId, true);
    if (success) {
      setSeatsLocked(true);
      Alert.alert('✅ Success', 'All seats locked');
    }
  };

  const handleUnlockAllSeats = async () => {
    const success = await streamGuestService.toggleSeatsLock(streamId, hostId, false);
    if (success) {
      setSeatsLocked(false);
      Alert.alert('✅ Success', 'All seats unlocked');
    }
  };

  // Admin actions
  const handleUnban = async (bannedUser: BannedUser) => {
    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${bannedUser.profiles?.display_name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('banned_users')
                .delete()
                .eq('id', bannedUser.id);

              if (error) throw error;
              Alert.alert('✅ Success', 'User unbanned');
              loadBannedUsers();
            } catch (error) {
              console.error('Error unbanning user:', error);
              Alert.alert('❌ Error', 'Failed to unban user');
            }
          },
        },
      ]
    );
  };

  const handleRemoveTimeout = async (timedOutUser: TimedOutUser) => {
    Alert.alert(
      'Remove Timeout',
      `Remove timeout for ${timedOutUser.profiles?.display_name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('timed_out_users')
                .delete()
                .eq('id', timedOutUser.id);

              if (error) throw error;
              Alert.alert('✅ Success', 'Timeout removed');
              loadTimedOutUsers();
            } catch (error) {
              console.error('Error removing timeout:', error);
              Alert.alert('❌ Error', 'Failed to remove timeout');
            }
          },
        },
      ]
    );
  };

  const handleClearAllTimeouts = async () => {
    Alert.alert(
      'Clear All Timeouts',
      'Are you sure you want to clear all active timeouts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('timed_out_users')
                .delete()
                .eq('stream_id', streamId);

              if (error) throw error;
              Alert.alert('✅ Success', 'All timeouts cleared');
              setTimedOutUsers([]);
            } catch (error) {
              console.error('Error clearing timeouts:', error);
              Alert.alert('❌ Error', 'Failed to clear timeouts');
            }
          },
        },
      ]
    );
  };

  const handleRevokeAllModerators = async () => {
    Alert.alert(
      'Revoke All Moderators',
      'Are you sure you want to revoke moderator status from all guests?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const guest of activeGuests) {
                if (guest.is_moderator && guest.user_id) {
                  await streamGuestService.toggleModeratorStatus(
                    streamId,
                    guest.user_id,
                    hostId,
                    false
                  );
                }
              }
              Alert.alert('✅ Success', 'All moderators revoked');
              loadData();
            } catch (error) {
              console.error('Error revoking moderators:', error);
              Alert.alert('❌ Error', 'Failed to revoke all moderators');
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <Text style={styles.headerTitle}>Host Controls</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* SECTION 1: Active Guest Seats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Guest Seats ({activeGuests.length}/9)</Text>
              {activeGuests.length === 0 ? (
                <Text style={styles.emptyText}>No guests currently in the stream</Text>
              ) : (
                activeGuests.map((guest) => (
                  <View key={guest.id} style={styles.guestCard}>
                    <View style={styles.guestHeader}>
                      {guest.profiles?.avatar_url ? (
                        <Image
                          source={{ uri: guest.profiles.avatar_url }}
                          style={styles.guestAvatar}
                        />
                      ) : (
                        <View style={styles.guestAvatarPlaceholder}>
                          <IconSymbol
                            ios_icon_name="person.fill"
                            android_material_icon_name="person"
                            size={20}
                            color={colors.textSecondary}
                          />
                        </View>
                      )}
                      <View style={styles.guestInfo}>
                        <Text style={styles.guestName}>
                          {guest.profiles?.display_name || 'Guest'}
                        </Text>
                        <Text style={styles.guestSeat}>Seat {guest.seat_index}</Text>
                      </View>
                      {guest.is_moderator && (
                        <View style={styles.modBadge}>
                          <IconSymbol
                            ios_icon_name="shield.fill"
                            android_material_icon_name="shield"
                            size={14}
                            color={colors.text}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.guestActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemoveGuest(guest)}
                      >
                        <IconSymbol
                          ios_icon_name="person.fill.xmark"
                          android_material_icon_name="person_remove"
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.actionButtonText}>Remove</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, !guest.mic_enabled && styles.actionButtonActive]}
                        onPress={() => handleMuteMic(guest)}
                      >
                        <IconSymbol
                          ios_icon_name={guest.mic_enabled ? 'mic.slash.fill' : 'mic.fill'}
                          android_material_icon_name={guest.mic_enabled ? 'mic_off' : 'mic'}
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.actionButtonText}>
                          {guest.mic_enabled ? 'Mute' : 'Unmute'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          !guest.camera_enabled && styles.actionButtonActive,
                        ]}
                        onPress={() => handleDisableCamera(guest)}
                      >
                        <IconSymbol
                          ios_icon_name={guest.camera_enabled ? 'video.slash.fill' : 'video.fill'}
                          android_material_icon_name={
                            guest.camera_enabled ? 'videocam_off' : 'videocam'
                          }
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.actionButtonText}>
                          {guest.camera_enabled ? 'Disable' : 'Enable'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, guest.is_moderator && styles.actionButtonActive]}
                        onPress={() => handleToggleModerator(guest)}
                      >
                        <IconSymbol
                          ios_icon_name="shield.fill"
                          android_material_icon_name="shield"
                          size={16}
                          color={colors.text}
                        />
                        <Text style={styles.actionButtonText}>
                          {guest.is_moderator ? 'Revoke Mod' : 'Make Mod'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* SECTION 2: Seat Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seat Management</Text>
              <View style={styles.seatGrid}>
                {Array.from({ length: 9 }).map((_, index) => {
                  const guest = activeGuests.find((g) => g.seat_index === index);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.seatSlot,
                        guest && styles.seatSlotOccupied,
                        seatsLocked && !guest && styles.seatSlotLocked,
                      ]}
                    >
                      {guest ? (
                        <>
                          {guest.profiles?.avatar_url ? (
                            <Image
                              source={{ uri: guest.profiles.avatar_url }}
                              style={styles.seatAvatar}
                            />
                          ) : (
                            <View style={styles.seatAvatarPlaceholder}>
                              <IconSymbol
                                ios_icon_name="person.fill"
                                android_material_icon_name="person"
                                size={16}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                          <Text style={styles.seatName} numberOfLines={1}>
                            {guest.profiles?.display_name || 'Guest'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.seatNumber}>Seat {index}</Text>
                          <Text style={styles.seatStatus}>
                            {seatsLocked ? 'Locked' : 'Empty'}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.seatControls}>
                <TouchableOpacity
                  style={[styles.controlButton, seatsLocked && styles.controlButtonActive]}
                  onPress={seatsLocked ? handleUnlockAllSeats : handleLockAllSeats}
                >
                  <IconSymbol
                    ios_icon_name={seatsLocked ? 'lock.open.fill' : 'lock.fill'}
                    android_material_icon_name={seatsLocked ? 'lock_open' : 'lock'}
                    size={18}
                    color={colors.text}
                  />
                  <Text style={styles.controlButtonText}>
                    {seatsLocked ? 'Unlock All Seats' : 'Lock All Seats'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION 3: Live Access Rules */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live Access Rules</Text>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Followers-only join</Text>
                <Switch
                  value={followersOnly}
                  onValueChange={setFollowersOnly}
                  trackColor={{ false: colors.border, true: colors.gradientEnd }}
                  thumbColor={colors.text}
                />
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Verified-only join</Text>
                <Switch
                  value={verifiedOnly}
                  onValueChange={setVerifiedOnly}
                  trackColor={{ false: colors.border, true: colors.gradientEnd }}
                  thumbColor={colors.text}
                />
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Allow moderators to invite guests</Text>
                <Switch
                  value={moderatorsCanInvite}
                  onValueChange={setModeratorsCanInvite}
                  trackColor={{ false: colors.border, true: colors.gradientEnd }}
                  thumbColor={colors.text}
                />
              </View>
            </View>

            {/* SECTION 4: Session Admin Tools */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Admin Tools</Text>
              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => {
                  loadBannedUsers();
                  setShowBannedModal(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="person.fill.xmark"
                  android_material_icon_name="block"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.adminButtonText}>Show Banned Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => {
                  loadTimedOutUsers();
                  setShowTimeoutModal(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.adminButtonText}>Show Timeout List</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.adminButton} onPress={handleClearAllTimeouts}>
                <IconSymbol
                  ios_icon_name="trash.fill"
                  android_material_icon_name="delete"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.adminButtonText}>Clear Timeouts</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.adminButton} onPress={handleRevokeAllModerators}>
                <IconSymbol
                  ios_icon_name="shield.slash.fill"
                  android_material_icon_name="shield"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.adminButtonText}>Revoke All Moderators</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Banned Users Modal */}
        <Modal visible={showBannedModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Banned Users</Text>
                <TouchableOpacity onPress={() => setShowBannedModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="close"
                    size={28}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {loading ? (
                  <ActivityIndicator size="large" color={colors.gradientEnd} style={styles.loader} />
                ) : bannedUsers.length === 0 ? (
                  <Text style={styles.emptyText}>No banned users</Text>
                ) : (
                  bannedUsers.map((user) => (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userHeader}>
                        {user.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: user.profiles.avatar_url }}
                            style={styles.userAvatar}
                          />
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <IconSymbol
                              ios_icon_name="person.fill"
                              android_material_icon_name="person"
                              size={20}
                              color={colors.textSecondary}
                            />
                          </View>
                        )}
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>
                            {user.profiles?.display_name || 'Unknown User'}
                          </Text>
                          <Text style={styles.userReason}>{user.reason || 'No reason provided'}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.unbanButton}
                        onPress={() => handleUnban(user)}
                      >
                        <Text style={styles.unbanButtonText}>Unban</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Timeout List Modal */}
        <Modal visible={showTimeoutModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Timed Out Users</Text>
                <TouchableOpacity onPress={() => setShowTimeoutModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="close"
                    size={28}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {loading ? (
                  <ActivityIndicator size="large" color={colors.gradientEnd} style={styles.loader} />
                ) : timedOutUsers.length === 0 ? (
                  <Text style={styles.emptyText}>No timed out users</Text>
                ) : (
                  timedOutUsers.map((user) => (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userHeader}>
                        {user.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: user.profiles.avatar_url }}
                            style={styles.userAvatar}
                          />
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <IconSymbol
                              ios_icon_name="person.fill"
                              android_material_icon_name="person"
                              size={20}
                              color={colors.textSecondary}
                            />
                          </View>
                        )}
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>
                            {user.profiles?.display_name || 'Unknown User'}
                          </Text>
                          <Text style={styles.userReason}>
                            Until: {new Date(user.end_time).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.unbanButton}
                        onPress={() => handleRemoveTimeout(user)}
                      >
                        <Text style={styles.unbanButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gradientEnd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  guestCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  guestAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  guestSeat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    padding: 6,
  },
  guestActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonActive: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  seatSlot: {
    width: (PANEL_WIDTH - 64) / 3,
    aspectRatio: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  seatSlotOccupied: {
    borderColor: colors.gradientEnd,
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
  },
  seatSlotLocked: {
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  seatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  seatAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  seatName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  seatNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  seatStatus: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  seatControls: {
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlButtonActive: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ruleLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gradientEnd,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalScroll: {
    padding: 16,
  },
  loader: {
    paddingVertical: 40,
  },
  userCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  userReason: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unbanButton: {
    backgroundColor: colors.gradientEnd,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  unbanButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
});