
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionStatusIndicatorProps {
  connected: boolean;
}

export default function ConnectionStatusIndicator({ connected }: ConnectionStatusIndicatorProps) {
  return (
    <View style={[styles.container, connected ? styles.connected : styles.disconnected]}>
      <Text style={styles.text}>{connected ? 'Connected' : 'Disconnected'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});
