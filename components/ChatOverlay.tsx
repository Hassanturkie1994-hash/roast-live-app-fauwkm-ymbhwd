
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ChatOverlay() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
