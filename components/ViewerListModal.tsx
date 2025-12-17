
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import UserActionModal from '@/components/UserActionModal';
import GuestInvitationModal from '@/components/GuestInvitationModal';
import { fanClubService } from '@/app/services/fanClubService';
import { moderationService } from '@/app/services/moderationService';
import { streamGuestService } from '@/app/services/streamGuestService';

interface ViewerListModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
  viewerCount: number;
  streamerId: string;
  currentUserId: string;
  isStreamer: boolean;
  isModerator: boolean;
}

type Viewer = {
  id: string;
  user_id: string;
  users: Tables<'users'>;
  joined_at: string;
};

export default function ViewerListModal({
  visible,
  onClose,
  streamId,
  viewerCount,
  streamerId,
  currentUserId,
  isStreamer,
  isModerator,
}: ViewerListModalProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState<Viewer | null>(null);
  const [showUserActionModal, setShowUserActionModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [inviteeViewer, setInviteeViewer] = useState<Viewer | null>(null);
  const [fanClubBadges, setFanClubBadges] = useState<Map<string, { color: string; name: string }>>(new Map());
  const [moderatorIds, setModeratorIds] = useState<Set<string>>(new Set());
  const [activeGuestIds, setActiveGuestIds] = useState<Set<string>>(new Set());
  const [seatsLocked, setSeatsLocked] = useState(false);
  const [activeGuestCount, setActiveGuestCount] = useState(0);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const fetchViewers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching viewers:', error);
        return;
      }

      console.log('👥 Fetched viewers:', data?.length || 0);
      setViewers(data as Viewer[]);
    } catch (error) {
      console.error('Error in fetchViewers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  const fetchFanClubBadges = useCallback(async () => {
    const fanClub = await fanClubService.getFanClub(streamerId);
    if (!fanClub) return;

    const members = await fanClubService.getFanClubMembers(fanClub.id);
    const badgeMap = new Map();
    members.forEach((member) => {
      badgeMap.set(member.user_id, {
        color: fanClub.badge_color,
        name: fanClub.club_name,
      });
    });
    setFanClubBadges(badgeMap);
  }, [streamerId]);

  const fetchModerators = useCallback(async () => {
    const mods = await moderationService.getModerators(streamerId);
    const modIds = new Set(mods.map((m) => m.user_id));
    setModeratorIds(modIds);
  }, [streamerId]);

  const fetchActiveGuests = useCallback(async () => {
    try {
      const activeGuests = await streamGuestService.getActiveGuestSeats(streamId);
      const guestIds = new Set(activeGuests.map((g) => g.user_id).filter((id): id is string => id !== null));
      setActiveGuestIds(guestIds);
      setActiveGuestCount(activeGuests.length);
    } catch (error) {
      console.error('Error fetching active guests:', error);
    }
  }, [streamId]);

  const fetchSeatsLockStatus = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('streams')
        .select('seats_locked')
        .eq('id', streamId)
        .single();
      
      setSeatsLocked(data?.seats_locked || false);
    } catch (error) {
      console.error('Error fetching seats lock status:', error);
    }
  }, [streamId]);

  const fetchData = useCallback(async () => {
    await Promise.all([
      fetchViewers(),
      fetchFanClubBadges(),
      fetchModerators(),
      fetchActiveGuests(),
      fetchSeatsLockStatus(),
    ]);
  }, [fetchViewers, fetchFanClubBadges, fetchModerators, fetchActiveGuests, fetchSeatsLockStatus]);

  useEffect(() => {
    if (visible) {
      fetchData();
      
      // Auto-refresh viewer list every 5 seconds
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [visible, fetchData]);



  const handleViewerPress = (viewer: Viewer) => {
    if (isStreamer || isModerator) {
      setSelectedViewer(viewer);
      setShowUserActionModal(true);
    }
  };

  const handleInvitePress = (viewer: Viewer) => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the host can invite guests.');
      return;
    }

    if (seatsLocked) {
      Alert.alert('Seats Locked', 'Guest seats are currently locked. Unlock them to invite viewers.');
      return;
    }

    if (activeGuestCount >= 9) {
      Alert.alert('Seats Full', 'Maximum guest seats are full (9/9). Remove a guest to invite someone new.');
      return;
    }

    if (activeGuestIds.has(viewer.user_id)) {
      Alert.alert('Already a Guest', 'This viewer is already a guest on your stream.');
      return;
    }

    setInviteeViewer(viewer);
    setShowInvitationModal(true);
  };

  const handleInvitationSent = () => {
    setShowInvitationModal(false);
    setInviteeViewer(null);
    // Refresh active guests
    fetchActiveGuests();
  };

  const renderBadges = (userId: string) => {
    const badges = [];

    // Guest badge
    if (activeGuestIds.has(userId)) {
      badges.push(
        <View key="guest" style={[styles.badge, { backgroundColor: colors.gradientEnd }]}>
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>GUEST</Text>
        </View>
      );
    }

    // Moderator badge
    if (moderatorIds.has(userId)) {
      badges.push(
        <View key="mod" style={[styles.badge, { backgroundColor: colors.gradientEnd }]}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="shield"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>MOD</Text>
        </View>
      );
    }

    // Fan club badge
    const fanBadge = fanClubBadges.get(userId);
    if (fanBadge) {
      badges.push(
        <View key="fan" style={[styles.badge, { backgroundColor: fanBadge.color }]}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>{fanBadge.name}</Text>
        </View>
      );
    }

    return badges.length > 0 ? <View style={styles.badgeContainer}>{badges}</View> : null;
  };

  const renderViewer = ({ item }: { item: Viewer }) => {
    const isGuest = activeGuestIds.has(item.user_id);
    const canInvite = isStreamer && !isGuest && !seatsLocked && activeGuestCount < 9;
    const isInviting = invitingUserId === item.user_id;

    return (
      <TouchableOpacity
        style={styles.viewerItem}
        onPress={() => handleViewerPress(item)}
        disabled={!isStreamer && !isModerator}
      >
        <View style={styles.avatarContainer}>
          {item.users.avatar_url ? (
            <Image source={{ uri: item.users.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>
        <View style={styles.viewerInfo}>
          <View style={styles.viewerNameRow}>
            <Text style={styles.viewerName}>{item.users.display_name}</Text>
            {renderBadges(item.user_id)}
          </View>
          <Text style={styles.viewerUsername}>@{item.users.username}</Text>
        </View>
        <View style={styles.viewerActions}>
          {isGuest ? (
            <View style={styles.guestIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          ) : canInvite ? (
            <TouchableOpacity
              style={[styles.inviteButton, isInviting && styles.inviteButtonDisabled]}
              onPress={() => handleInvitePress(item)}
              disabled={isInviting}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="person.badge.plus.fill"
                    android_material_icon_name="person_add"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.watchingIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Watching</Text>
            </View>
          )}
        </View>
        {(isStreamer || isModerator) && (
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron_right"
            size={20}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={24}
                color={colors.gradientEnd}
              />
              <Text style={styles.title}>Active Viewers ({viewerCount})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Guest Seats Status */}
          {isStreamer && (
            <View style={styles.guestSeatsStatus}>
              <View style={styles.guestSeatsInfo}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="people"
                  size={20}
                  color={colors.gradientEnd}
                />
                <Text style={styles.guestSeatsText}>
                  Guest Seats: {activeGuestCount}/9
                </Text>
              </View>
              {seatsLocked && (
                <View style={styles.lockedBadge}>
                  <IconSymbol
                    ios_icon_name="lock.fill"
                    android_material_icon_name="lock"
                    size={14}
                    color={colors.text}
                  />
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              )}
            </View>
          )}

          {/* Maximum Seats Warning */}
          {isStreamer && activeGuestCount >= 9 && (
            <View style={styles.warningBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={16}
                color={colors.gradientEnd}
              />
              <Text style={styles.warningText}>
                Maximum guest seats are full
              </Text>
            </View>
          )}

          {isLoading && viewers.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
              <Text style={styles.loadingText}>Loading viewers...</Text>
            </View>
          ) : viewers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No viewers yet</Text>
              <Text style={styles.emptySubtext}>
                Share your stream to get viewers!
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.updateIndicator}>
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.updateText}>Auto-updating live</Text>
              </View>
              <FlatList
                data={viewers}
                renderItem={renderViewer}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      </View>

      {selectedViewer && (
        <UserActionModal
          visible={showUserActionModal}
          onClose={() => {
            setShowUserActionModal(false);
            setSelectedViewer(null);
          }}
          userId={selectedViewer.user_id}
          username={selectedViewer.users.display_name}
          streamId={streamId}
          streamerId={streamerId}
          currentUserId={currentUserId}
          isStreamer={isStreamer}
          isModerator={isModerator}
        />
      )}

      {inviteeViewer && (
        <GuestInvitationModal
          visible={showInvitationModal}
          onClose={() => {
            setShowInvitationModal(false);
            setInviteeViewer(null);
          }}
          streamId={streamId}
          hostId={streamerId}
          inviteeId={inviteeViewer.user_id}
          inviteeName={inviteeViewer.users.display_name}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  guestSeatsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  guestSeatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestSeatsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(164, 0, 40, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(164, 0, 40, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
  },
  updateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: {
    padding: 20,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerInfo: {
    flex: 1,
  },
  viewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text,
  },
  viewerUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  viewerActions: {
    marginRight: 8,
  },
  guestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  watchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gradientEnd,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});