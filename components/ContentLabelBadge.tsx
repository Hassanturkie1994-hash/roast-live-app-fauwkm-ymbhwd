
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ContentLabelBadgeProps {
  label: string;
}

export default function ContentLabelBadge({ label }: ContentLabelBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 10,
  },
});
