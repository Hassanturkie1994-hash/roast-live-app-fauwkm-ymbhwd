
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamGuestSeat, streamGuestService } from '@/app/services/streamGuestService';

interface GuestActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  guest: StreamGuestSeat | null;
  streamId: string;
  hostId: string;
  onRefresh: () => void;
}

export default function GuestActionMenuModal({
  visible,
  onClose,
  guest,
  streamId,
  hostId,
  onRefresh,
}: GuestActionMenuModalProps) {
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);

  if (!guest) return null;

  const handleRemoveGuest = async () => {
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
              Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} left the live`);
              onRefresh();
              onClose();
            } else {
              Alert.alert('❌ Error', 'Failed to remove guest');
            }
          },
        },
      ]
    );
  };

  const handleToggleModerator = async () => {
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
      onRefresh();
      onClose();
    } else {
      Alert.alert('❌ Error', 'Failed to update moderator status');
    }
  };

  const handleMuteMic = async () => {
    const newState = !guest.mic_enabled;
    const success = await streamGuestService.updateMicStatus(streamId, guest.user_id!, newState);
    if (success) {
      Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} ${newState ? 'unmuted' : 'muted'}`);
      onRefresh();
      onClose();
    } else {
      Alert.alert('❌ Error', 'Failed to update mic status');
    }
  };

  const handleDisableCamera = async () => {
    const newState = !guest.camera_enabled;
    const success = await streamGuestService.updateCameraStatus(streamId, guest.user_id!, newState);
    if (success) {
      Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} camera ${newState ? 'enabled' : 'disabled'}`);
      onRefresh();
      onClose();
    } else {
      Alert.alert('❌ Error', 'Failed to update camera status');
    }
  };

  const handleMoveSeat = async () => {
    // Get all active guests to determine available seats
    const activeGuests = await streamGuestService.getActiveGuestSeats(streamId);
    const occupiedSeats = activeGuests.map((g) => g.seat_index);
    const available = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !occupiedSeats.includes(i) || i === guest.seat_index
    );
    setAvailableSeats(available);
    setShowSeatSelection(true);
  };

  const handleSeatSelected = async (newSeatIndex: number) => {
    if (newSeatIndex === guest.seat_index) {
      setShowSeatSelection(false);
      return;
    }

    // Update the seat index in the database
    try {
      const { error } = await streamGuestService.supabase
        .from('stream_guest_seats')
        .update({ seat_index: newSeatIndex })
        .eq('id', guest.id);

      if (error) throw error;

      Alert.alert('✅ Success', `${guest.profiles?.display_name || 'Guest'} moved to seat #${newSeatIndex}`);
      onRefresh();
      setShowSeatSelection(false);
      onClose();
    } catch (error) {
      console.error('Error moving seat:', error);
      Alert.alert('❌ Error', 'Failed to move seat');
    }
  };

  const handleViewProfile = () => {
    // TODO: Navigate to user profile
    Alert.alert('View Profile', 'Profile viewing coming soon!');
    onClose();
  };

  if (showSeatSelection) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setShowSeatSelection(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSeatSelection(false)}>
          <View style={styles.modal}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Move to Seat</Text>
              <Text style={styles.subtitle}>
                Select a new seat for {guest.profiles?.display_name || 'Guest'}
              </Text>
            </View>

            <ScrollView style={styles.seatList} showsVerticalScrollIndicator={false}>
              {availableSeats.map((seatIndex) => (
                <TouchableOpacity
                  key={seatIndex}
                  style={[
                    styles.seatItem,
                    seatIndex === guest.seat_index && styles.seatItemCurrent,
                  ]}
                  onPress={() => handleSeatSelected(seatIndex)}
                >
                  <View style={styles.seatIcon}>
                    <Text style={styles.seatIconText}>{seatIndex}</Text>
                  </View>
                  <Text style={styles.seatItemText}>
                    Seat {seatIndex}
                    {seatIndex === guest.seat_index && ' (Current)'}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSeatSelection(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  const menuItems = [
    {
      icon: 'person.fill',
      androidIcon: 'person',
      label: 'View Profile',
      onPress: handleViewProfile,
      color: colors.text,
    },
    {
      icon: guest.is_moderator ? 'shield.slash.fill' : 'shield.fill',
      androidIcon: 'shield',
      label: guest.is_moderator ? 'Revoke Moderator' : 'Assign Moderator',
      onPress: handleToggleModerator,
      color: guest.is_moderator ? colors.gradientEnd : colors.text,
    },
    {
      icon: guest.mic_enabled ? 'mic.slash.fill' : 'mic.fill',
      androidIcon: guest.mic_enabled ? 'mic_off' : 'mic',
      label: guest.mic_enabled ? 'Mute Guest Mic' : 'Unmute Guest Mic',
      onPress: handleMuteMic,
      color: colors.text,
    },
    {
      icon: guest.camera_enabled ? 'video.slash.fill' : 'video.fill',
      androidIcon: guest.camera_enabled ? 'videocam_off' : 'videocam',
      label: guest.camera_enabled ? 'Disable Guest Camera' : 'Enable Guest Camera',
      onPress: handleDisableCamera,
      color: colors.text,
    },
    {
      icon: 'arrow.up.arrow.down',
      androidIcon: 'swap_vert',
      label: 'Move Seat',
      onPress: handleMoveSeat,
      color: colors.text,
    },
    {
      icon: 'xmark.circle.fill',
      androidIcon: 'cancel',
      label: 'Remove from Stream',
      onPress: handleRemoveGuest,
      color: colors.gradientEnd,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modal}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Guest Actions</Text>
            <Text style={styles.subtitle}>
              {guest.profiles?.display_name || 'Guest'} • Seat {guest.seat_index}
            </Text>
          </View>

          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  item.onPress();
                }}
              >
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.androidIcon}
                  size={24}
                  color={item.color}
                />
                <Text style={[styles.menuItemText, { color: item.color }]}>
                  {item.label}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  menuList: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  seatList: {
    marginBottom: 16,
  },
  seatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  seatItemCurrent: {
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
    borderWidth: 2,
    borderColor: colors.gradientEnd,
  },
  seatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  seatItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});