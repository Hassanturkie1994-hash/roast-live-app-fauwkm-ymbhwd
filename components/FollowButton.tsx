
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
}

export default function FollowButton({ isFollowing, onPress }: FollowButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, isFollowing && styles.following]} onPress={onPress}>
      <Text style={styles.text}>{isFollowing ? 'Following' : 'Follow'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  following: {
    backgroundColor: '#999',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
