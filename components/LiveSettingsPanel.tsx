
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { streamSettingsService } from '@/app/services/streamSettingsService';

interface LiveSettingsPanelProps {
  streamId: string;
  broadcasterId: string;
}

export default function LiveSettingsPanel({
  streamId,
  broadcasterId,
}: LiveSettingsPanelProps) {
  const [settings, setSettings] = useState<any>(null);
  const [moderators, setModerators] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadExistingModerators = useCallback(async () => {
    try {
      console.log('Loading existing moderators');
      setModerators([]);
    } catch (error) {
      console.error('Error loading moderators:', error);
    }
  }, []);

  const loadFollowers = useCallback(async () => {
    try {
      console.log('Loading followers');
      setFollowers([]);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await streamSettingsService.getStreamSettings(broadcasterId);
      setSettings(data);
      await loadExistingModerators();
      await loadFollowers();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [broadcasterId, loadExistingModerators, loadFollowers]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stream Settings</Text>
        
        {settings && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Stream Delay</Text>
            <Text style={styles.settingValue}>{settings.stream_delay_seconds}s</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
});
