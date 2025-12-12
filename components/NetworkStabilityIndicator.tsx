
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { networkStabilityService, NetworkQuality } from '@/app/services/networkStabilityService';

interface NetworkStabilityIndicatorProps {
  isStreaming: boolean;
  streamId?: string;
  onReconnect?: () => void;
}

export default function NetworkStabilityIndicator({
  isStreaming,
  streamId,
  onReconnect,
}: NetworkStabilityIndicatorProps) {
  const [quality, setQuality] = useState<NetworkQuality | null>(null);
  const [showReconnectButton, setShowReconnectButton] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectDuration, setDisconnectDuration] = useState(0);

  useEffect(() => {
    if (!isStreaming || !streamId) {
      networkStabilityService.stopMonitoring();
      return;
    }

    // Start monitoring network quality
    networkStabilityService.startMonitoring(streamId, (newQuality) => {
      setQuality(newQuality);

      // Handle connection loss
      if (newQuality.status === 'disconnected') {
        networkStabilityService.handleConnectionLoss();
        
        // Check if we should show reconnect button
        const duration = networkStabilityService.getDisconnectDuration();
        setDisconnectDuration(duration);

        if (duration > 15) {
          setShowReconnectButton(true);
        } else {
          // Auto-reconnect for < 15 seconds
          handleAutoReconnect();
        }
      }
    });

    return () => {
      networkStabilityService.stopMonitoring();
    };
  }, [isStreaming, streamId]);

  const handleAutoReconnect = async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);

    const success = await networkStabilityService.attemptReconnect(
      () => {
        // Reconnect success
        setIsReconnecting(false);
        setShowReconnectButton(false);
        setDisconnectDuration(0);
        onReconnect?.();
      },
      () => {
        // Reconnect failed
        setIsReconnecting(false);
        setShowReconnectButton(true);
      }
    );

    if (!success) {
      // Wait and try again
      setTimeout(handleAutoReconnect, 2500);
    }
  };

  const handleManualReconnect = () => {
    setShowReconnectButton(false);
    handleAutoReconnect();
  };

  if (!isStreaming || !quality) {
    return null;
  }

  // Show warning for poor connection
  if (quality.status === 'poor') {
    return (
      <View style={styles.container}>
        <View style={[styles.indicator, styles.warningIndicator]}>
          <Text style={styles.indicatorText}>⚠️ Poor connection detected</Text>
          <Text style={styles.detailsText}>
            Bitrate: {Math.round(quality.bitrate)} kbps | Loss: {quality.packetLoss.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  }

  // Show disconnected state
  if (quality.status === 'disconnected') {
    return (
      <View style={styles.container}>
        <View style={[styles.indicator, styles.errorIndicator]}>
          <Text style={styles.indicatorText}>❌ Connection lost</Text>
          {isReconnecting ? (
            <View style={styles.reconnectingContainer}>
              <ActivityIndicator size="small" color={colors.text} />
              <Text style={styles.detailsText}>Reconnecting...</Text>
            </View>
          ) : showReconnectButton ? (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleManualReconnect}>
              <Text style={styles.reconnectButtonText}>Tap to reconnect</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.detailsText}>
              Auto-reconnecting... ({Math.round(disconnectDuration)}s)
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Show good connection (optional, can be hidden)
  if (quality.status === 'good') {
    return (
      <View style={styles.container}>
        <View style={[styles.indicator, styles.goodIndicator]}>
          <Text style={styles.indicatorText}>✓ Connection stable</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  indicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'column',
    gap: 4,
  },
  warningIndicator: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
  },
  errorIndicator: {
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
  },
  goodIndicator: {
    backgroundColor: 'rgba(0, 200, 0, 0.9)',
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    opacity: 0.9,
  },
  reconnectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reconnectButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.text,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});