
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import FollowButton from './FollowButton';
import PremiumBadge from './PremiumBadge';

interface ProfileHeaderProps {
  userId: string;
  avatar: string;
  name: string;
  username: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowPress: () => void;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({
  userId,
  avatar,
  name,
  username,
  followersCount,
  followingCount,
  isFollowing,
  onFollowPress,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.premiumBadgeOverlay}>
          <PremiumBadge userId={userId} size="small" showAnimation={true} />
        </View>
      </View>
      
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{name}</Text>
        <PremiumBadge userId={userId} size="medium" showAnimation={true} />
      </View>
      
      <Text style={styles.username}>@{username}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatCount(followersCount)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatCount(followingCount)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {!isOwnProfile && (
        <View style={styles.buttonContainer}>
          <FollowButton isFollowing={isFollowing} onPress={onFollowPress} size="medium" />
        </View>
      )}
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 3,
    borderColor: colors.border,
  },
  premiumBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  username: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
});