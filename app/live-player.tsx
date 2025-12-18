
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import FollowButton from '@/components/FollowButton';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import ChatOverlay from '@/components/ChatOverlay';
import RoastGiftAnimationOverlay from '@/components/RoastGiftAnimationOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

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

export default function LivePlayerScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [stream, setStream] = useState<Stream | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isStreamOffline, setIsStreamOffline] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<RoastGiftAnimationData[]>([]);
  const [isViewerChannelSubscribed, setIsViewerChannelSubscribed] = useState(false);
  const [isGiftChannelSubscribed, setIsGiftChannelSubscribed] = useState(false);
  const channelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const [debugVisible, setDebugVisible] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎬 LivePlayerScreen mounted for stream:', streamId);
    
    const debugTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setDebugVisible(false);
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
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

      if (data && data.status !== 'live') {
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

        if (data.broadcaster_id && user) {
          checkFollowStatus(data.broadcaster_id);
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

  const subscribeToGifts = useCallback(() => {
    if (!streamId || !isMountedRef.current) {
      console.warn('⚠️ Cannot subscribe to gifts: missing streamId or component unmounted');
      return;
    }

    console.log('🔌 Subscribing to roast gift channel:', `roast_gifts:${streamId}`);

    const channel = supabase
      .channel(`roast_gifts:${streamId}`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 Roast gift received:', payload);
        
        if (!isMountedRef.current) return;
        
        const giftData = payload.payload;
        
        const newAnimation: RoastGiftAnimationData = {
          id: `${Date.now()}-${Math.random()}`,
          giftId: giftData.giftId,
          displayName: giftData.displayName,
          emoji: giftData.emoji || '🎁',
          senderName: giftData.senderName,
          priceSEK: giftData.priceSEK,
          tier: giftData.tier || 'LOW',
          animationType: giftData.animationType || 'OVERLAY',
        };
        
        setGiftAnimations((prev) => [...prev, newAnimation]);
      })
      .subscribe((status) => {
        console.log('📡 Roast gift channel subscription status:', status);
        
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          setIsGiftChannelSubscribed(true);
          console.log('✅ Successfully subscribed to roast gift channel');
        }
      });

    giftChannelRef.current = channel;
  }, [streamId]);

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
          console.log('⚠️ Error pausing player:', error);
        }
      }
      
      leaveViewerChannel();
      leaveGiftChannel();
    };
  }, [streamId, fetchStream]);

  useEffect(() => {
    if (stream && !hasJoinedChannel && isMountedRef.current) {
      console.log('🚀 Initializing Realtime channels for stream:', stream.id);
      joinViewerChannel();
      subscribeToGifts();
      setHasJoinedChannel(true);
    }
  }, [stream, hasJoinedChannel, joinViewerChannel, subscribeToGifts]);

  const leaveViewerChannel = () => {
    if (channelRef.current) {
      try {
        console.log('🔌 Leaving viewer channel');
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.log('⚠️ Error leaving channel:', error);
      } finally {
        channelRef.current = null;
        if (isMountedRef.current) {
          setIsViewerChannelSubscribed(false);
        }
      }
    }
  };

  const leaveGiftChannel = () => {
    if (giftChannelRef.current) {
      try {
        console.log('🔌 Leaving gift channel');
        supabase.removeChannel(giftChannelRef.current);
      } catch (error) {
        console.log('⚠️ Error leaving gift channel:', error);
      } finally {
        giftChannelRef.current = null;
        if (isMountedRef.current) {
          setIsGiftChannelSubscribed(false);
        }
      }
    }
  };

  const handleAnimationComplete = (animationId: string) => {
    if (isMountedRef.current) {
      setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
    }
  };

  const handleFollow = useCallback(async () => {
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
  }, [user, stream, isFollowing]);

  const handleLike = useCallback(async () => {
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
  }, [user]);

  const handleShare = useCallback(() => {
    if (!stream) return;

    Alert.alert(
      'Share Stream',
      `Share this live stream with your friends!\n\nStream: ${stream.title}\nBy: ${stream.users.display_name}`,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [stream]);

  const handleRetry = () => {
    setPlayerError(null);
    setIsStreamOffline(false);
    setIsLoading(true);
    fetchStream();
  };

  if (!stream) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stream...</Text>
      </View>
    );
  }

  if (!stream.playback_url || !isValidPlaybackUrl(stream.playback_url) || isStreamOffline || playerError) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="warning"
          size={48}
          color={colors.brandPrimary || '#A40028'}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {isStreamOffline ? 'Stream Offline' : 'Stream Not Available'}
        </Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          {playerError || 'The broadcaster hasn\'t started streaming yet or the stream has ended'}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.brandPrimary || '#A40028' }]} 
            onPress={handleRetry}
          >
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backButton, { borderColor: colors.border }]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading video...</Text>
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
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <LiveBadge size="small" />
            <View style={styles.viewerBadge}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
          </View>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.watermarkContainer}>
          <RoastLiveLogo size="small" opacity={0.25} />
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <IconSymbol
              ios_icon_name="square.and.arrow.up.fill"
              android_material_icon_name="share"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ChatOverlay streamId={streamId} isBroadcaster={false} streamDelay={0} />

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

      {giftAnimations.map((animation) => (
        <RoastGiftAnimationOverlay
          key={animation.id}
          giftId={animation.giftId}
          displayName={animation.displayName}
          emoji={animation.emoji}
          senderName={animation.senderName}
          priceSEK={animation.priceSEK}
          tier={animation.tier}
          animationType={animation.animationType}
          onAnimationComplete={() => handleAnimationComplete(animation.id)}
        />
      ))}
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
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
    borderRadius: 25,
    borderWidth: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
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
