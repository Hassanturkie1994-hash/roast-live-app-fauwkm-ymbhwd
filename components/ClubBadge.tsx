
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ClubBadgeProps {
  clubName: string;
}

export default function ClubBadge({ clubName }: ClubBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{clubName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});
