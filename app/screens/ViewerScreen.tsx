
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import FollowButton from '@/components/FollowButton';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import ChatOverlay from '@/components/ChatOverlay';
import GiftSelector from '@/components/GiftSelector';
import GiftAnimationOverlay from '@/components/GiftAnimationOverlay';
import ReportModal from '@/components/ReportModal';
import SafetyHintTooltip from '@/components/SafetyHintTooltip';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { streamSettingsService } from '@/app/services/streamSettingsService';

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

interface GiftAnimation {
  id: string;
  giftName: string;
  giftEmoji: string;
  senderUsername: string;
  amount: number;
  tier: 'A' | 'B' | 'C';
}

const SAFETY_HINTS = [
  'Please keep conversation respectful',
  'Be kind to others in chat',
  'Avoid sharing personal information',
  'Report inappropriate behavior',
  'Follow community guidelines',
];

export default function ViewerScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(false);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [safetyHint, setSafetyHint] = useState<string | null>(null);
  const [streamDelay, setStreamDelay] = useState(0);
  const channelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);

  const player = useVideoPlayer(
    stream?.playback_url
      ? {
          uri: stream.playback_url,
        }
      : null,
    (player) => {
      player.loop = false;
      player.staysActiveInBackground = false;
      player.play();
    }
  );

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEffect(() => {
    console.log('Player status:', status);
    if (status === 'readyToPlay') {
      setIsLoading(false);
    } else if (status === 'error') {
      console.error('Video player error');
      setIsLoading(false);
      Alert.alert('Playback Error', 'Unable to play the stream. Please try again later.');
    }
  }, [status]);

  const checkFollowStatus = useCallback(async (broadcasterId: string) => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', broadcasterId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      console.log('Not following');
    }
  }, [user]);

  const fetchStream = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .eq('id', streamId)
        .single();

      if (error) {
        console.error('Error fetching stream:', error);
        Alert.alert('Error', 'Stream not found');
        router.back();
        return;
      }

      console.log('Stream data:', data);
      setStream(data as Stream);
      setViewerCount(data.viewer_count || 0);

      if (data.broadcaster_id && user) {
        checkFollowStatus(data.broadcaster_id);
        
        // Fetch stream delay setting
        const delay = await streamSettingsService.getStreamDelay(data.broadcaster_id);
        setStreamDelay(delay);
        console.log(`Stream delay set to ${delay} seconds`);
      }
    } catch (error) {
      console.error('Error in fetchStream:', error);
    }
  }, [streamId, user, checkFollowStatus]);

  const joinViewerChannel = useCallback(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`stream:${streamId}:viewers`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);

        channel.send({
          type: 'broadcast',
          event: 'viewer_count',
          payload: { count },
        });
      })
      .on('presence', { event: 'join' }, () => {
        console.log('Viewer joined');
      })
      .on('presence', { event: 'leave' }, () => {
        console.log('Viewer left');
      })
      .on('broadcast', { event: 'safety_hint' }, (payload) => {
        // Show safety hint when triggered
        const hint = payload.payload.message || SAFETY_HINTS[0];
        setSafetyHint(hint);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;
  }, [streamId, user]);

  const subscribeToGifts = useCallback(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`stream:${streamId}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('Gift received:', payload);
        const giftData = payload.payload;
        
        // Add gift animation to queue
        const newAnimation: GiftAnimation = {
          id: `${Date.now()}-${Math.random()}`,
          giftName: giftData.gift_name,
          giftEmoji: giftData.gift_emoji || '🎁',
          senderUsername: giftData.sender_username,
          amount: giftData.amount,
          tier: giftData.tier || 'A',
        };
        
        setGiftAnimations((prev) => [...prev, newAnimation]);
      })
      .subscribe();

    giftChannelRef.current = channel;
  }, [streamId]);

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }

    return () => {
      player.pause();
      leaveViewerChannel();
      leaveGiftChannel();
    };
  }, [streamId, fetchStream, player]);

  useEffect(() => {
    if (stream && !hasJoinedChannel) {
      joinViewerChannel();
      subscribeToGifts();
      setHasJoinedChannel(true);
    }
  }, [stream, hasJoinedChannel, joinViewerChannel, subscribeToGifts]);

  const leaveViewerChannel = () => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const leaveGiftChannel = () => {
    if (giftChannelRef.current) {
      supabase.removeChannel(giftChannelRef.current);
      giftChannelRef.current = null;
    }
  };

  const handleFollow = async () => {
    if (!user || !stream) {
      Alert.alert('Login Required', 'Please login to follow streamers');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', stream.broadcaster_id);
        setIsFollowing(false);
      } else {
        await supabase.from('followers').insert({
          follower_id: user.id,
          following_id: stream.broadcaster_id,
        });
        setIsFollowing(true);

        await supabase.from('notifications').insert({
          type: 'follow',
          sender_id: user.id,
          receiver_id: stream.broadcaster_id,
          message: 'started following you',
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like streams');
      return;
    }

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'like',
        payload: {
          user_id: user.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    Alert.alert('❤️', 'Like sent!');
  };

  const handleShare = () => {
    if (!stream) return;

    Alert.alert(
      'Share Stream',
      `Share this live stream with your friends!\n\nStream: ${stream.title}\nBy: ${stream.users.display_name}`,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleGiftSent = async (giftEvent: any) => {
    // Broadcast gift to all viewers
    if (giftChannelRef.current) {
      await giftChannelRef.current.send({
        type: 'broadcast',
        event: 'gift_sent',
        payload: {
          gift_name: giftEvent.gift.name,
          gift_emoji: giftEvent.gift.emoji_icon,
          sender_username: giftEvent.sender_username,
          amount: giftEvent.price_sek,
          tier: giftEvent.gift.tier,
        },
      });
    }
  };

  const handleAnimationComplete = (animationId: string) => {
    setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
  };

  if (!stream) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.gradientEnd} />
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  if (!stream.playback_url) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="warning"
          size={48}
          color={colors.gradientEnd}
        />
        <Text style={styles.errorText}>Stream not available</Text>
        <Text style={styles.errorSubtext}>
          The broadcaster hasn&apos;t started streaming yet
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={false}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <LiveBadge size="small" />
            <View style={styles.viewerBadge}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={14}
                color={colors.text}
              />
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <IconSymbol
              ios_icon_name="flag.fill"
              android_material_icon_name="flag"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.watermarkContainer}>
          <RoastLiveLogo size="small" opacity={0.25} />
        </View>

        {/* Safety Hint Tooltip */}
        <SafetyHintTooltip
          message={safetyHint || ''}
          visible={!!safetyHint}
          onHide={() => setSafetyHint(null)}
        />

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={28}
              color={colors.text}
            />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowGiftSelector(true)}
          >
            <IconSymbol
              ios_icon_name="gift.fill"
              android_material_icon_name="card_giftcard"
              size={28}
              color={colors.text}
            />
            <Text style={styles.actionText}>Send Gift</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <IconSymbol
              ios_icon_name="square.and.arrow.up.fill"
              android_material_icon_name="share"
              size={28}
              color={colors.text}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ChatOverlay 
          streamId={streamId} 
          isBroadcaster={false}
          streamDelay={streamDelay}
        />

        <View style={styles.bottomBar}>
          <View style={styles.broadcasterInfo}>
            <Text style={styles.broadcasterName}>{stream.users.display_name}</Text>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {stream.title}
            </Text>
          </View>
          {user?.id !== stream.broadcaster_id && (
            <FollowButton isFollowing={isFollowing} onPress={handleFollow} />
          )}
        </View>
      </View>

      {/* Gift Animations */}
      {giftAnimations.map((animation) => (
        <GiftAnimationOverlay
          key={animation.id}
          giftName={animation.giftName}
          giftEmoji={animation.giftEmoji}
          senderUsername={animation.senderUsername}
          amount={animation.amount}
          tier={animation.tier}
          onAnimationComplete={() => handleAnimationComplete(animation.id)}
        />
      ))}

      {/* Gift Selector Modal */}
      {stream && (
        <GiftSelector
          visible={showGiftSelector}
          onClose={() => setShowGiftSelector(false)}
          receiverId={stream.broadcaster_id}
          receiverName={stream.users.display_name}
          livestreamId={streamId}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* Report Modal */}
      {stream && user && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          streamerId={stream.broadcaster_id}
          streamerName={stream.users.display_name}
          streamId={streamId}
          reporterUserId={user.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flexDirection: 'row',
    gap: 12,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    pointerEvents: 'none',
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  broadcasterInfo: {
    flex: 1,
    marginRight: 16,
  },
  broadcasterName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
});