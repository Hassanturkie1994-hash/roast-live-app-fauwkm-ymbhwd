
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
}

export default function GradientButton({ title, onPress, colors = ['#FF6B35', '#F7931E'] }: GradientButtonProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={colors} style={styles.button}>
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
