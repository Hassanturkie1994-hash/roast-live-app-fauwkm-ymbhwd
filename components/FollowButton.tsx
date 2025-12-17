
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, buttonStyles } from '@/styles/commonStyles';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => Promise<void> | void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export default function FollowButton({ isFollowing, onPress, size = 'medium', disabled = false }: FollowButtonProps) {
  const [localFollowing, setLocalFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Sync with prop changes
  useEffect(() => {
    setLocalFollowing(isFollowing);
  }, [isFollowing]);

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

  const handlePress = async () => {
    if (loading || disabled) return;

    // Optimistic update - change UI immediately
    setLocalFollowing(!localFollowing);
    setLoading(true);

    try {
      await onPress();
    } catch (error) {
      // Revert on error
      console.error('Error in follow button:', error);
      setLocalFollowing(localFollowing);
    } finally {
      setLoading(false);
    }
  };

  const sizeStyles = {
    small: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 12 },
    medium: { paddingVertical: 10, paddingHorizontal: 24, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  if (localFollowing) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.followingButton, 
            { 
              paddingVertical: currentSize.paddingVertical, 
              paddingHorizontal: currentSize.paddingHorizontal,
              opacity: disabled ? 0.5 : 1,
            }
          ]}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[styles.followingText, { fontSize: currentSize.fontSize }]}>FOLLOWING</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[buttonStyles.pillButton, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[buttonStyles.pillButtonText, { fontSize: currentSize.fontSize }]}>FOLLOW</Text>
          )}
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
