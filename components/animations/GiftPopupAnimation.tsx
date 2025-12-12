
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

interface GiftPopupAnimationProps {
  giftName: string;
  senderName: string;
}

export default function GiftPopupAnimation({ giftName, senderName }: GiftPopupAnimationProps) {
  return (
    <Animated.View style={styles.container}>
      <Text style={styles.text}>{senderName} sent {giftName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
