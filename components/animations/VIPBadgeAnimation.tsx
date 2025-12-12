
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

export default function VIPBadgeAnimation() {
  return (
    <Animated.View style={styles.container}>
      <View style={styles.badge} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
  },
});
