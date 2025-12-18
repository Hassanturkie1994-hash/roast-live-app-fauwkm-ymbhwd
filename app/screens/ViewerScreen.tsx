
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
import RoastGiftSelector from '@/components/RoastGiftSelector';
import RoastGiftAnimationOverlay from '@/components/RoastGiftAnimationOverlay';
import ReportModal from '@/components/ReportModal';
import SafetyHintTooltip from '@/components/SafetyHintTooltip';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { streamSettingsService } from '@/app/services/streamSettingsService';
import { roastGiftService } from '@/app/services/roastGiftService';

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

interface RoastGiftAnimationData {
  id: string;
  giftId: string;
  displayName: string;
  emoji: string;
  senderName: string;
  priceSEK: number;
  tier: 'LOW' | 'MID' | 'HIGH' | 'ULTRA';
  animationType: 'OVERLAY' | 'AR' | 'CINEMATIC';
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
  const [giftAnimations, setGiftAnimations] = useState<RoastGiftAnimationData[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [safetyHint, setSafetyHint] = useState<string | null>(null);
  const [streamDelay, setStreamDelay] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isStreamOffline, setIsStreamOffline] = useState(false);
  const [isGiftChannelSubscribed, setIsGiftChannelSubscribed] = useState(false);
  const [isViewerChannelSubscribed, setIsViewerChannelSubscribed] = useState(false);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const playerRef = useRef<any>(null);

  const [debugVisible, setDebugVisible] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 ViewerScreen mounted for stream:', streamId);
    
    // Initialize Roast Gift Service
    roastGiftService.initialize();
    
    const debugTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setDebugVisible(false);
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      roastGiftService.destroy();
      clearTimeout(debugTimer);
    };
  }, [streamId]);

  const isValidPlaybackUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const player = useVideoPlayer(
    stream?.playback_url && isValidPlaybackUrl(stream.playback_url)
      ? {
          uri: stream.playback_url,
        }
      : null,
    (player) => {
      if (!isMountedRef.current) return;
      
      try {
        playerRef.current = player;
        player.loop = false;
        player.staysActiveInBackground = false;
        
        if (player.play) {
          player.play();
        }
      } catch (error) {
        console.error('❌ Error initializing player:', error);
        setPlayerError('Failed to initialize video player');
        setIsLoading(false);
      }
    }
  );

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEffect(() => {
    console.log('📹 Player status:', status);
    
    if (!isMountedRef.current) return;
    
    if (status === 'readyToPlay') {
      setIsLoading(false);
      setPlayerError(null);
      setIsStreamOffline(false);
    } else if (status === 'error') {
      console.error('❌ Video player error');
      setIsLoading(false);
      setPlayerError('Unable to play the stream');
      
      if (stream) {
        checkStreamStatus(stream.id);
      }
    } else if (status === 'loading') {
      setIsLoading(true);
    }
  }, [status, stream]);

  const checkStreamStatus = async (streamId: string) => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('status')
        .eq('id', streamId)
        .maybeSingle();

      if (data && data.status !== 'live' && isMountedRef.current) {
        setIsStreamOffline(true);
        setPlayerError('Stream has ended');
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
    }
  };

  const checkFollowStatus = useCallback(async (broadcasterId: string) => {
    if (!user || !isMountedRef.current) return;

    try {
      const { data } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', broadcasterId)
        .maybeSingle();

      if (isMountedRef.current) {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.log('ℹ️ Not following');
    }
  }, [user]);

  const fetchStream = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .eq('id', streamId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching stream:', error);
        if (isMountedRef.current) {
          Alert.alert('Error', 'Stream not found');
          router.back();
        }
        return;
      }

      if (!data) {
        if (isMountedRef.current) {
          Alert.alert('Error', 'Stream not found');
          router.back();
        }
        return;
      }

      console.log('✅ Stream data:', data);
      
      if (isMountedRef.current) {
        setStream(data as Stream);
        setViewerCount(data.viewer_count || 0);

        if (!isValidPlaybackUrl(data.playback_url)) {
          console.error('❌ Invalid playback URL:', data.playback_url);
          setPlayerError('Invalid stream URL');
          setIsLoading(false);
        }

        if (data.status !== 'live') {
          setIsStreamOffline(true);
          setPlayerError('Stream is not live');
          setIsLoading(false);
        }
      }

      if (data.broadcaster_id && user) {
        checkFollowStatus(data.broadcaster_id);
        
        const delay = await streamSettingsService.getStreamDelay(data.broadcaster_id);
        if (isMountedRef.current) {
          setStreamDelay(delay);
          console.log(`⏱ Stream delay set to ${delay} seconds`);
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchStream:', error);
    }
  }, [streamId, user, checkFollowStatus]);

  const joinViewerChannel = useCallback(() => {
    if (!streamId || !isMountedRef.current) {
      console.warn('⚠️ Cannot join viewer channel: missing streamId or component unmounted');
      return;
    }

    console.log('🔌 Joining viewer channel:', `stream:${streamId}:viewers`);

    const channel = supabase
      .channel(`stream:${streamId}:viewers`)
      .on('presence', { event: 'sync' }, () => {
        if (!isMountedRef.current) return;
        
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        
        console.log('👥 Viewer count synced:', count);
        setViewerCount(count);

        channel.send({
          type: 'broadcast',
          event: 'viewer_count',
          payload: { count },
        });
      })
      .on('presence', { event: 'join' }, () => {
        console.log('👤 Viewer joined');
      })
      .on('presence', { event: 'leave' }, () => {
        console.log('👤 Viewer left');
      })
      .on('broadcast', { event: 'safety_hint' }, (payload) => {
        const hint = payload.payload.message || SAFETY_HINTS[0];
        if (isMountedRef.current) {
          setSafetyHint(hint);
        }
      })
      .on('broadcast', { event: 'stream_ended' }, () => {
        console.log('🛑 Stream ended by broadcaster');
        if (isMountedRef.current) {
          setIsStreamOffline(true);
          setPlayerError('Stream has ended');
        }
      })
      .subscribe(async (status) => {
        console.log('📡 Viewer channel subscription status:', status);
        
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          setIsViewerChannelSubscribed(true);
          console.log('✅ Successfully subscribed to viewer channel');
          
          await channel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;
  }, [streamId, user]);

  // NEW: Handle roast gift received
  const handleGiftReceived = useCallback((giftData: any) => {
    if (!isMountedRef.current) return;
    
    console.log('🎁 [VIEWER] Roast gift received:', giftData);
    
    const newAnimation: RoastGiftAnimationData = {
      id: `${Date.now()}-${Math.random()}`,
      giftId: giftData.giftId,
      displayName: giftData.displayName,
      emoji: giftData.emoji,
      senderName: giftData.senderName,
      priceSEK: giftData.priceSEK,
      tier: giftData.tier,
      animationType: giftData.animationType,
    };
    
    setGiftAnimations((prev) => [...prev, newAnimation]);
  }, []);

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }

    return () => {
      isMountedRef.current = false;
      
      if (playerRef.current) {
        try {
          if (playerRef.current.pause) {
            playerRef.current.pause();
          }
          playerRef.current = null;
        } catch (error) {
          console.error('⚠️ Error pausing player on unmount:', error);
        }
      }
      
      leaveViewerChannel();
    };
  }, [streamId, fetchStream]);

  useEffect(() => {
    if (stream && !hasJoinedChannel && isMountedRef.current) {
      console.log('🚀 Initializing Realtime channels for stream:', stream.id);
      joinViewerChannel();
      setHasJoinedChannel(true);
    }
  }, [stream, hasJoinedChannel, joinViewerChannel]);

  // NEW: Subscribe to roast gifts
  useEffect(() => {
    if (!streamId) return;

    console.log('🎁 [VIEWER] Subscribing to roast gifts...');
    
    const unsubscribe = roastGiftService.subscribeToGifts(streamId, handleGiftReceived);
    setIsGiftChannelSubscribed(true);

    return () => {
      console.log('🎁 [VIEWER] Unsubscribing from roast gifts');
      unsubscribe();
      setIsGiftChannelSubscribed(false);
    };
  }, [streamId, handleGiftReceived]);

  const leaveViewerChannel = () => {
    if (channelRef.current) {
      try {
        console.log('🔌 Leaving viewer channel');
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('⚠️ Error leaving viewer channel:', error);
      }
      channelRef.current = null;
      if (isMountedRef.current) {
        setIsViewerChannelSubscribed(false);
      }
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
        
        if (isMountedRef.current) {
          setIsFollowing(false);
        }
      } else {
        await supabase.from('followers').insert({
          follower_id: user.id,
          following_id: stream.broadcaster_id,
        });
        
        if (isMountedRef.current) {
          setIsFollowing(true);
        }

        await supabase.from('notifications').insert({
          type: 'follow',
          sender_id: user.id,
          receiver_id: stream.broadcaster_id,
          message: 'started following you',
        });
      }
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
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

  const handleAnimationComplete = (animationId: string) => {
    if (isMountedRef.current) {
      setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
    }
  };

  const handleRetry = () => {
    setPlayerError(null);
    setIsStreamOffline(false);
    setIsLoading(true);
    fetchStream();
  };

  if (!stream) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.gradientEnd} />
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  if (!stream.playback_url || !isValidPlaybackUrl(stream.playback_url) || isStreamOffline || playerError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="warning"
          size={48}
          color={colors.gradientEnd}
        />
        <Text style={styles.errorText}>
          {isStreamOffline ? 'Stream Offline' : 'Stream Not Available'}
        </Text>
        <Text style={styles.errorSubtext}>
          {playerError || 'The broadcaster hasn\'t started streaming yet or the stream has ended'}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        {debugVisible && (
          <View style={styles.debugIndicator}>
            <Text style={styles.debugText}>
              📺 Overlay Active{'\n'}
              👥 Viewers: {isViewerChannelSubscribed ? '✅' : '⏳'}{'\n'}
              🎁 Gifts: {isGiftChannelSubscribed ? '✅' : '⏳'}
            </Text>
          </View>
        )}
        
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

      {/* NEW: Roast Gift Animations */}
      {giftAnimations.map((animation) => (
        <RoastGiftAnimationOverlay
          key={animation.id}
          giftId={animation.giftId}
          displayName={animation.displayName}
          emoji={animation.emoji}
          senderName={animation.senderName}
          priceSEK={animation.priceSEK}
          tier={animation.tier}
          onAnimationComplete={() => handleAnimationComplete(animation.id)}
        />
      ))}

      {/* NEW: Roast Gift Selector */}
      {stream && (
        <RoastGiftSelector
          visible={showGiftSelector}
          onClose={() => setShowGiftSelector(false)}
          receiverId={stream.broadcaster_id}
          receiverName={stream.users.display_name}
          streamId={streamId}
        />
      )}

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
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 24,
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
    zIndex: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 60,
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
    zIndex: 60,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    gap: 24,
    zIndex: 60,
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
    zIndex: 60,
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
  debugIndicator: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 2000,
  },
  debugText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 14,
  },
});
