
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatBubbleProps {
  message: string;
  author: string;
  isOwn?: boolean;
}

export default function ChatBubble({ message, author, isOwn }: ChatBubbleProps) {
  return (
    <View style={[styles.container, isOwn && styles.ownMessage]}>
      <Text style={styles.author}>{author}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginVertical: 4,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  author: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
});
