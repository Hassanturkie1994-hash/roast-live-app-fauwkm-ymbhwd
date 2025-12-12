
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, buttonStyles } from '@/styles/commonStyles';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
  size?: 'small' | 'medium';
}

export default function FollowButton({ isFollowing, onPress, size = 'medium' }: FollowButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    small: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 12 },
    medium: { paddingVertical: 10, paddingHorizontal: 24, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  if (isFollowing) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.followingButton, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }]}
        >
          <Text style={[styles.followingText, { fontSize: currentSize.fontSize }]}>FOLLOWING</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.container}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[buttonStyles.pillButton, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }]}
        >
          <Text style={[buttonStyles.pillButtonText, { fontSize: currentSize.fontSize }]}>FOLLOW</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  followingButton: {
    borderRadius: 25,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingText: {
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});