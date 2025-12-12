
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

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
  const channelRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Validate playback URL before creating player
  const isValidPlaybackUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    
    // Check if URL is a valid HTTP/HTTPS URL
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
        
        // Safely attempt to play
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
      
      // Check if stream is actually offline
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

        // Validate playback URL
        if (!isValidPlaybackUrl(data.playback_url)) {
          console.error('❌ Invalid playback URL:', data.playback_url);
          setPlayerError('Invalid stream URL');
          setIsLoading(false);
        }

        // Check if stream is actually live
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
    if (!streamId || !isMountedRef.current) return;

    const channel = supabase
      .channel(`stream:${streamId}:viewers`)
      .on('presence', { event: 'sync' }, () => {
        if (!isMountedRef.current) return;
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
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          await channel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;
  }, [streamId, user]);

  useEffect(() => {
    isMountedRef.current = true;

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
    };
  }, [streamId, fetchStream]);

  useEffect(() => {
    if (stream && !hasJoinedChannel && isMountedRef.current) {
      joinViewerChannel();
      setHasJoinedChannel(true);
    }
  }, [stream, hasJoinedChannel, joinViewerChannel]);

  const leaveViewerChannel = () => {
    if (channelRef.current) {
      try {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.log('⚠️ Error leaving channel:', error);
      } finally {
        channelRef.current = null;
      }
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

  // Show loading state
  if (!stream) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stream...</Text>
      </View>
    );
  }

  // Show error state if playback URL is invalid or stream is offline
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
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading video...</Text>
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

        <ChatOverlay streamId={streamId} isBroadcaster={false} />

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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});
