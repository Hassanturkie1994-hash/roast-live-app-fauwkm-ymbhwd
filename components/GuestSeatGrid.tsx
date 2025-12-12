
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamGuestSeat } from '@/app/services/streamGuestService';
import GuestActionMenuModal from '@/components/GuestActionMenuModal';

interface GuestSeatGridProps {
  hostName: string;
  hostAvatarUrl?: string | null;
  guests: StreamGuestSeat[];
  streamId: string;
  hostId: string;
  isHost?: boolean;
  onRefresh: () => void;
  onEmptySeatPress?: () => void;
}

const { width, height } = Dimensions.get('window');

// Extract Participant component to fix React Hooks errors
const ParticipantCell = React.memo(({
  participant,
  index,
  cellWidth,
  cellHeight,
  totalParticipants,
  onLongPress,
}: {
  participant: {
    name: string;
    avatarUrl?: string | null;
    isHost: boolean;
    guest?: StreamGuestSeat;
  };
  index: number;
  cellWidth: number;
  cellHeight: number;
  totalParticipants: number;
  onLongPress: () => void;
}) => {
  const scaleAnimRef = useRef(new Animated.Value(0));
  const fadeAnimRef = useRef(new Animated.Value(0));
  const scaleAnim = scaleAnimRef.current;
  const fadeAnim = fadeAnimRef.current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const isHostCell = participant.isHost;
  const guest = participant.guest;

  return (
    <Animated.View
      key={index}
      style={[
        styles.cell,
        {
          width: cellWidth - 8,
          height: cellHeight - 8,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
        isHostCell && styles.hostCell,
        guest && !guest.camera_enabled && styles.cellDimmed,
      ]}
    >
      <TouchableOpacity
        style={styles.cellTouchable}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        <View style={styles.cellContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {participant.avatarUrl ? (
              <Image source={{ uri: participant.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={totalParticipants <= 2 ? 48 : 32}
                  color={colors.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={styles.participantName} numberOfLines={1}>
            {participant.name}
          </Text>

          {/* Status indicators */}
          <View style={styles.statusRow}>
            {guest && (
              <>
                {/* Mic status */}
                <View
                  style={[
                    styles.statusBadge,
                    !guest.mic_enabled && styles.statusBadgeOff,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={guest.mic_enabled ? 'mic.fill' : 'mic.slash.fill'}
                    android_material_icon_name={guest.mic_enabled ? 'mic' : 'mic_off'}
                    size={12}
                    color={colors.text}
                  />
                </View>

                {/* Camera status */}
                <View
                  style={[
                    styles.statusBadge,
                    !guest.camera_enabled && styles.statusBadgeOff,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={guest.camera_enabled ? 'video.fill' : 'video.slash.fill'}
                    android_material_icon_name={
                      guest.camera_enabled ? 'videocam' : 'videocam_off'
                    }
                    size={12}
                    color={colors.text}
                  />
                </View>

                {/* Moderator badge */}
                {guest.is_moderator && (
                  <View style={styles.moderatorBadge}>
                    <IconSymbol
                      ios_icon_name="shield.fill"
                      android_material_icon_name="shield"
                      size={12}
                      color={colors.text}
                    />
                  </View>
                )}
              </>
            )}
          </View>

          {/* Host badge */}
          {isHostCell && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>LIVE HOST</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function GuestSeatGrid({
  hostName,
  hostAvatarUrl,
  guests,
  streamId,
  hostId,
  isHost = false,
  onRefresh,
  onEmptySeatPress,
}: GuestSeatGridProps) {
  const [selectedGuest, setSelectedGuest] = useState<StreamGuestSeat | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const activeGuests = guests.filter((g) => !g.left_at);
  const totalParticipants = activeGuests.length + 1; // +1 for host

  // Determine grid layout based on number of participants
  const getGridLayout = () => {
    if (totalParticipants === 1) {
      return { columns: 1, rows: 1 }; // Just host (fullscreen)
    } else if (totalParticipants === 2) {
      return { columns: 1, rows: 2 }; // Split view (host top)
    } else if (totalParticipants <= 4) {
      return { columns: 2, rows: 2 }; // 2x2 grid
    } else if (totalParticipants <= 6) {
      return { columns: 3, rows: 2 }; // 2x3 grid
    } else {
      return { columns: 3, rows: 3 }; // 3x3 grid
    }
  };

  const layout = getGridLayout();
  const cellWidth = (width - 16) / layout.columns;
  const cellHeight = totalParticipants === 1 ? height * 0.7 : (height * 0.7) / layout.rows;

  const renderEmptySeat = useCallback((index: number) => {
    return (
      <TouchableOpacity
        key={`empty-${index}`}
        style={[
          styles.cell,
          styles.emptyCell,
          {
            width: cellWidth - 8,
            height: cellHeight - 8,
          },
        ]}
        onPress={onEmptySeatPress}
      >
        <View style={styles.emptyCellContent}>
          <IconSymbol
            ios_icon_name="person.badge.plus.fill"
            android_material_icon_name="person_add"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyCellText}>Seat available</Text>
          <Text style={styles.emptyCellSubtext}>Tap to invite viewer</Text>
        </View>
      </TouchableOpacity>
    );
  }, [cellWidth, cellHeight, onEmptySeatPress]);

  // Build participants array
  const participants = [
    { name: hostName, avatarUrl: hostAvatarUrl, isHost: true },
    ...activeGuests.map((guest) => ({
      name: guest.profiles?.display_name || 'Guest',
      avatarUrl: guest.profiles?.avatar_url,
      isHost: false,
      guest,
    })),
  ];

  // Add empty seats if host
  const emptySeatsCount = isHost ? Math.min(9 - activeGuests.length, layout.columns * layout.rows - participants.length) : 0;

  const handleGuestLongPress = (guest: StreamGuestSeat) => {
    if (isHost) {
      setSelectedGuest(guest);
      setShowActionMenu(true);
    }
  };

  const handleHostLongPress = () => {
    // Host can't perform actions on themselves
    console.log('Host long-pressed');
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {participants.map((participant, index) => {
          const handleLongPress = () => {
            if (participant.isHost) {
              handleHostLongPress();
            } else if (participant.guest) {
              handleGuestLongPress(participant.guest);
            }
          };

          return (
            <ParticipantCell
              key={index}
              participant={participant}
              index={index}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              totalParticipants={totalParticipants}
              onLongPress={handleLongPress}
            />
          );
        })}
        {isHost && Array.from({ length: emptySeatsCount }).map((_, index) => renderEmptySeat(index))}
      </View>

      {/* Guest Action Menu */}
      {isHost && (
        <GuestActionMenuModal
          visible={showActionMenu}
          onClose={() => setShowActionMenu(false)}
          guest={selectedGuest}
          streamId={streamId}
          hostId={hostId}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  cell: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    margin: 4,
    overflow: 'hidden',
  },
  hostCell: {
    borderColor: colors.gradientEnd,
    borderWidth: 3,
  },
  cellDimmed: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  cellTouchable: {
    flex: 1,
  },
  cellContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeOff: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  moderatorBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.gradientEnd,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  emptyCell: {
    borderStyle: 'dashed',
    borderColor: colors.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyCellContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyCellSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});