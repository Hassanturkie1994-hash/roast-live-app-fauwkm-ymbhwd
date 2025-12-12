
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamGuestSeat } from '@/app/services/streamGuestService';

interface GuestControlPanelProps {
  guests: StreamGuestSeat[];
  onRemoveGuest: (guestId: string) => void;
  onToggleModerator: (guestId: string, isModerator: boolean) => void;
  onSwapSeats: (seatIndex1: number, seatIndex2: number) => void;
  onInviteGuest: () => void;
  seatsLocked: boolean;
  onToggleSeatsLock: () => void;
}

export default function GuestControlPanel({
  guests,
  onRemoveGuest,
  onToggleModerator,
  onSwapSeats,
  onInviteGuest,
  seatsLocked,
  onToggleSeatsLock,
}: GuestControlPanelProps) {
  const activeGuests = guests.filter((g) => !g.left_at);
  const availableSeats = 9 - activeGuests.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guest Controls</Text>
        <Text style={styles.subtitle}>
          {activeGuests.length}/9 seats filled • {availableSeats} available
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, seatsLocked && styles.actionButtonActive]}
          onPress={onToggleSeatsLock}
        >
          <IconSymbol
            ios_icon_name={seatsLocked ? 'lock.fill' : 'lock.open.fill'}
            android_material_icon_name={seatsLocked ? 'lock' : 'lock_open'}
            size={20}
            color={colors.text}
          />
          <Text style={styles.actionButtonText}>
            {seatsLocked ? 'Unlock Seats' : 'Lock Seats'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, seatsLocked && styles.actionButtonDisabled]}
          onPress={onInviteGuest}
          disabled={seatsLocked || availableSeats === 0}
        >
          <IconSymbol
            ios_icon_name="person.badge.plus.fill"
            android_material_icon_name="person_add"
            size={20}
            color={colors.text}
          />
          <Text style={styles.actionButtonText}>Invite Guest</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.guestList} showsVerticalScrollIndicator={false}>
        {activeGuests.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No guests yet</Text>
            <Text style={styles.emptySubtext}>Invite viewers to join your stream</Text>
          </View>
        ) : (
          activeGuests.map((guest) => (
            <View key={guest.id} style={styles.guestItem}>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>
                  {guest.profiles?.display_name || 'Guest'}
                </Text>
                <View style={styles.guestStatus}>
                  <IconSymbol
                    ios_icon_name={guest.mic_enabled ? 'mic.fill' : 'mic.slash.fill'}
                    android_material_icon_name={guest.mic_enabled ? 'mic' : 'mic_off'}
                    size={14}
                    color={guest.mic_enabled ? colors.text : colors.textSecondary}
                  />
                  <IconSymbol
                    ios_icon_name={guest.camera_enabled ? 'video.fill' : 'video.slash.fill'}
                    android_material_icon_name={guest.camera_enabled ? 'videocam' : 'videocam_off'}
                    size={14}
                    color={guest.camera_enabled ? colors.text : colors.textSecondary}
                  />
                  {guest.is_moderator && (
                    <View style={styles.modBadge}>
                      <Text style={styles.modBadgeText}>MOD</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.guestActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onToggleModerator(guest.user_id!, !guest.is_moderator)}
                >
                  <IconSymbol
                    ios_icon_name="shield.fill"
                    android_material_icon_name="shield"
                    size={18}
                    color={guest.is_moderator ? colors.gradientEnd : colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onRemoveGuest(guest.user_id!)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={18}
                    color={colors.gradientEnd}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderColor: colors.gradientEnd,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  guestList: {
    maxHeight: 250,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  guestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  guestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});