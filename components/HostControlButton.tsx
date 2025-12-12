
import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface HostControlButtonProps {
  onPress: () => void;
}

export default function HostControlButton({ onPress }: HostControlButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <IconSymbol
          ios_icon_name="gearshape.fill"
          android_material_icon_name="settings"
          size={20}
          color={colors.text}
        />
        <Text style={styles.text}>Host Controls</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: colors.gradientEnd,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});