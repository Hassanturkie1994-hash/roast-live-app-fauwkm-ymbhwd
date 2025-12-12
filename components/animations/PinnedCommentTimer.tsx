
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PinnedCommentTimerProps {
  duration: number;
}

export default function PinnedCommentTimer({ duration }: PinnedCommentTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{timeLeft}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});
