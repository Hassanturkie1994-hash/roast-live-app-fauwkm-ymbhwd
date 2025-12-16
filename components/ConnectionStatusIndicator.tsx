
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface ConnectionStatusIndicatorProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  attemptNumber?: number;
  maxAttempts?: number;
}

export default function ConnectionStatusIndicator({
  status,
  attemptNumber = 0,
  maxAttempts = 6,
}: ConnectionStatusIndicatorProps) {
  // Only show indicator for reconnecting or disconnected states
  // DO NOT show "Good connection" banner
  if (status === 'connected') {
    return null;
  }

  if (status === 'reconnecting') {
    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.reconnectingBanner]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.bannerText}>
            Reconnecting... (Attempt {attemptNumber}/{maxAttempts})
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'disconnected') {
    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.disconnectedBanner]}>
          <IconSymbol
            ios_icon_name="wifi.slash"
            android_material_icon_name="wifi_off"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.bannerText}>Connection lost</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  reconnectingBanner: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
  },
  disconnectedBanner: {
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
