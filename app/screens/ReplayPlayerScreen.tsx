
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { replayService, StreamReplay, ReplayComment } from '@/app/services/replayService';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';

export default function ReplayPlayerScreen() {
  const { replayId } = useLocalSearchParams<{ replayId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  const [loading, setLoading] = useState(true);
  const [replay, setReplay] = useState<StreamReplay | null>(null);
  const [comments, setComments] = useState<ReplayComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState(Date.now());
  const [currentPosition, setCurrentPosition] = useState(0);

  const loadReplay = useCallback(async () => {
    if (!replayId) return;

    setLoading(true);
    try {
      const [replayData, commentsData] = await Promise.all([
        replayService.getReplay(replayId),
        replayService.getComments(replayId),
      ]);

      setReplay(replayData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading replay:', error);
      Alert.alert('Error', 'Failed to load replay');
    } finally {
      setLoading(false);
    }
  }, [replayId]);

  useEffect(() => {
    loadReplay();
  }, [loadReplay]);

  useEffect(() => {
    // Track view when component unmounts
    return () => {
      if (replay && user) {
        const watchDuration = Math.floor((Date.now() - watchStartTime) / 1000);
        replayService.trackView(
          replay.id,
          user.id,
          watchDuration,
          replay.total_duration_seconds
        );
      }
    };
  }, [replay, user, watchStartTime]);

  const handleLike = async () => {
    if (!replay || !user) return;

    try {
      if (isLiked) {
        await replayService.unlikeReplay(replay.id, user.id);
        setIsLiked(false);
      } else {
        await replayService.likeReplay(replay.id, user.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!replay || !user || !newComment.trim()) return;

    try {
      const result = await replayService.addComment(replay.id, user.id, newComment.trim());
      if (result.success && result.data) {
        setComments([result.data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!replay) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Replay not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: replay.replay_url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.positionMillis) {
                setCurrentPosition(Math.floor(status.positionMillis / 1000));
              }
            }}
          />
        </View>

        {/* Replay Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{replay.title}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>👁 {replay.views_count} views</Text>
            <Text style={styles.statText}>⏱ {formatDuration(replay.total_duration_seconds)}</Text>
            <Text style={styles.statText}>
              {new Date(replay.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <IconSymbol
                ios_icon_name={isLiked ? 'heart.fill' : 'heart'}
                android_material_icon_name={isLiked ? 'favorite' : 'favorite_border'}
                size={24}
                color={isLiked ? '#E30052' : colors.text}
              />
              <Text style={styles.actionText}>{replay.likes_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol
                ios_icon_name="bubble.left"
                android_material_icon_name="comment"
                size={24}
                color={colors.text}
              />
              <Text style={styles.actionText}>{replay.comments_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={24}
                color={colors.text}
              />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {/* Add Comment */}
          {user && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                <LinearGradient
                  colors={['#A40028', '#E30052']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.postButton}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Comments List */}
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentContainer}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUsername}>
                  {comment.user?.display_name || comment.user?.username}
                </Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.comment}</Text>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                  {comment.replies.map((reply) => (
                    <View key={reply.id} style={styles.replyContainer}>
                      <Text style={styles.replyUsername}>
                        {reply.user?.display_name || reply.user?.username}
                      </Text>
                      <Text style={styles.replyText}>{reply.comment}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
  },
  postButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUsername: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  commentText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  replyContainer: {
    marginBottom: 8,
  },
  replyUsername: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  replyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
