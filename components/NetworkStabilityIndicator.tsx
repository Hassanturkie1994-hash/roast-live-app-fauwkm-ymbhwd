
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface NetworkStabilityIndicatorProps {
  streamId: string;
}

export default function NetworkStabilityIndicator({ streamId }: NetworkStabilityIndicatorProps) {
  const [stability, setStability] = useState<'good' | 'fair' | 'poor'>('good');
  const [shouldReconnect, setShouldReconnect] = useState(false);

  const handleAutoReconnect = useCallback(() => {
    if (shouldReconnect && stability === 'poor') {
      console.log('Auto-reconnecting...');
      setShouldReconnect(false);
    }
  }, [shouldReconnect, stability]);

  useEffect(() => {
    handleAutoReconnect();
  }, [handleAutoReconnect]);

  const getStabilityColor = () => {
    switch (stability) {
      case 'good':
        return '#32CD32';
      case 'fair':
        return '#FFA500';
      case 'poor':
        return '#FF4444';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <IconSymbol
        ios_icon_name="wifi"
        android_material_icon_name="wifi"
        size={16}
        color={getStabilityColor()}
      />
      <Text style={[styles.text, { color: getStabilityColor() }]}>
        {stability.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
