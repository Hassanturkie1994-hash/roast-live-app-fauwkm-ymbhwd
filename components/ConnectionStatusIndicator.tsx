
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export type ConnectionStatus = 'excellent' | 'good' | 'unstable' | 'reconnecting' | 'disconnected';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  attemptNumber?: number;
  maxAttempts?: number;
}

export default function ConnectionStatusIndicator({
  status,
  attemptNumber = 0,
  maxAttempts = 6,
}: ConnectionStatusIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in when status changes
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for reconnecting status
    if (status === 'reconnecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim, fadeAnim]);

  const getStatusConfig = (): {
    color: string;
    icon: string;
    androidIcon: string;
    message: string;
    showAttempts: boolean;
  } => {
    switch (status) {
      case 'excellent':
        return {
          color: '#00FF88',
          icon: 'wifi',
          androidIcon: 'wifi',
          message: 'Excellent Connection',
          showAttempts: false,
        };
      case 'good':
        return {
          color: '#FFB800',
          icon: 'wifi',
          androidIcon: 'wifi',
          message: 'Good Connection',
          showAttempts: false,
        };
      case 'unstable':
        return {
          color: '#FFB800',
          icon: 'wifi.exclamationmark',
          androidIcon: 'signal_wifi_statusbar_not_connected',
          message: 'Connection Unstable',
          showAttempts: false,
        };
      case 'reconnecting':
        return {
          color: '#FF8800',
          icon: 'arrow.clockwise',
          androidIcon: 'sync',
          message: 'Attempting to reconnect...',
          showAttempts: true,
        };
      case 'disconnected':
        return {
          color: '#FF4444',
          icon: 'wifi.slash',
          androidIcon: 'signal_wifi_off',
          message: 'Connection Lost',
          showAttempts: false,
        };
    }
  };

  const config = getStatusConfig();

  // Only show indicator for problematic statuses
  if (status === 'excellent') return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: `${config.color}20`,
          borderColor: config.color,
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <IconSymbol
          ios_icon_name={config.icon}
          android_material_icon_name={config.androidIcon}
          size={20}
          color={config.color}
        />
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={[styles.message, { color: config.color }]}>
          {config.message}
        </Text>
        {config.showAttempts && (
          <Text style={[styles.attempts, { color: config.color }]}>
            Attempt {attemptNumber} of {maxAttempts}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  attempts: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
});