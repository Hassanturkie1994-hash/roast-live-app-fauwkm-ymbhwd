
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface GuestSelfControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeaveSeat: () => void;
}

export default function GuestSelfControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeaveSeat,
}: GuestSelfControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !micEnabled && styles.controlButtonOff]}
          onPress={onToggleMic}
        >
          <IconSymbol
            ios_icon_name={micEnabled ? 'mic.fill' : 'mic.slash.fill'}
            android_material_icon_name={micEnabled ? 'mic' : 'mic_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlButtonText}>
            {micEnabled ? 'Mute' : 'Unmute'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !cameraEnabled && styles.controlButtonOff]}
          onPress={onToggleCamera}
        >
          <IconSymbol
            ios_icon_name={cameraEnabled ? 'video.fill' : 'video.slash.fill'}
            android_material_icon_name={cameraEnabled ? 'videocam' : 'videocam_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlButtonText}>
            {cameraEnabled ? 'Camera Off' : 'Camera On'}
          </Text>
        </TouchableOpacity>

        <View style={styles.leaveButtonContainer}>
          <GradientButton
            title="LEAVE SEAT"
            onPress={onLeaveSeat}
            size="small"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: 'rgba(0, 255, 0, 0.5)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  controlButtonOff: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  leaveButtonContainer: {
    flex: 1,
  },
});