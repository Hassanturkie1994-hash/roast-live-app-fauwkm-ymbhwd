
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface RoastIconProps {
  size?: number;
  color?: string;
}

export default function RoastIcon({ size = 24, color = '#FF5722' }: RoastIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.flame, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flame: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});
