
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AchievementBadgeProps {
  title: string;
  icon?: string;
}

export default function AchievementBadge({ title, icon }: AchievementBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontWeight: 'bold',
  },
});
