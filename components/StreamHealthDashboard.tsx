
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface StreamHealthDashboardProps {
  viewerCount: number;
  giftCount: number;
  isVisible: boolean;
}

interface StreamMetrics {
  bitrate: number;
  ping: number;
  fps: number;
}

export default function StreamHealthDashboard({
  viewerCount,
  giftCount,
  isVisible,
}: StreamHealthDashboardProps) {
  const [metrics, setMetrics] = useState<StreamMetrics>({
    bitrate: 0,
    ping: 0,
    fps: 30,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  // Simulate stream metrics (in real implementation, these would come from WebRTC stats)
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      // Simulate realistic metrics
      const baseBitrate = 2500;
      const bitrateVariation = Math.random() * 1500 - 750;
      const newBitrate = Math.max(500, Math.min(5000, baseBitrate + bitrateVariation));

      const basePing = 45;
      const pingVariation = Math.random() * 30 - 15;
      const newPing = Math.max(10, Math.min(200, basePing + pingVariation));

      const baseFps = 30;
      const fpsVariation = Math.random() * 5 - 2.5;
      const newFps = Math.max(15, Math.min(60, baseFps + fpsVariation));

      setMetrics({
        bitrate: Math.round(newBitrate),
        ping: Math.round(newPing),
        fps: Math.round(newFps),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getBitrateColor = (bitrate: number): string => {
    if (bitrate < 1000) return '#FF4444'; // Red
    if (bitrate < 3500) return '#FFB800'; // Yellow
    return '#00FF88'; // Green
  };

  const getPingColor = (ping: number): string => {
    if (ping > 100) return '#FF4444'; // Red
    if (ping > 50) return '#FFB800'; // Yellow
    return '#00FF88'; // Green
  };

  const getFpsColor = (fps: number): string => {
    if (fps < 20) return '#FF4444'; // Red
    if (fps < 28) return '#FFB800'; // Yellow
    return '#00FF88'; // Green
  };

  const getConnectionQuality = (): { label: string; color: string } => {
    if (metrics.bitrate >= 3500 && metrics.ping <= 50 && metrics.fps >= 28) {
      return { label: 'Excellent', color: '#00FF88' };
    }
    if (metrics.bitrate >= 1000 && metrics.ping <= 100 && metrics.fps >= 20) {
      return { label: 'Good', color: '#FFB800' };
    }
    return { label: 'Poor', color: '#FF4444' };
  };

  const quality = getConnectionQuality();

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={[styles.qualityIndicator, { backgroundColor: quality.color }]} />
        <Text style={styles.headerText}>Stream Health</Text>
      </View>

      <View style={styles.metricsContainer}>
        {/* Bitrate */}
        <View style={styles.metricRow}>
          <IconSymbol
            ios_icon_name="speedometer"
            android_material_icon_name="speed"
            size={14}
            color={getBitrateColor(metrics.bitrate)}
          />
          <Text style={styles.metricLabel}>Bitrate</Text>
          <Text style={[styles.metricValue, { color: getBitrateColor(metrics.bitrate) }]}>
            {metrics.bitrate} kbps
          </Text>
        </View>

        {/* Ping */}
        <View style={styles.metricRow}>
          <IconSymbol
            ios_icon_name="antenna.radiowaves.left.and.right"
            android_material_icon_name="signal_cellular_alt"
            size={14}
            color={getPingColor(metrics.ping)}
          />
          <Text style={styles.metricLabel}>Ping</Text>
          <Text style={[styles.metricValue, { color: getPingColor(metrics.ping) }]}>
            {metrics.ping} ms
          </Text>
        </View>

        {/* FPS */}
        <View style={styles.metricRow}>
          <IconSymbol
            ios_icon_name="film"
            android_material_icon_name="videocam"
            size={14}
            color={getFpsColor(metrics.fps)}
          />
          <Text style={styles.metricLabel}>FPS</Text>
          <Text style={[styles.metricValue, { color: getFpsColor(metrics.fps) }]}>
            {metrics.fps}
          </Text>
        </View>

        {/* Viewer Count */}
        <View style={styles.metricRow}>
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={14}
            color={colors.text}
          />
          <Text style={styles.metricLabel}>Viewers</Text>
          <Text style={styles.metricValue}>{viewerCount}</Text>
        </View>

        {/* Gift Count */}
        <View style={styles.metricRow}>
          <IconSymbol
            ios_icon_name="gift.fill"
            android_material_icon_name="card_giftcard"
            size={14}
            color={colors.gradientEnd}
          />
          <Text style={styles.metricLabel}>Gifts</Text>
          <Text style={styles.metricValue}>{giftCount}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.qualityText, { color: quality.color }]}>
          {quality.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  qualityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});