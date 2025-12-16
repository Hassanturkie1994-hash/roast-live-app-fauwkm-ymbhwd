
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { battleService, BattleFormat } from '@/app/services/battleService';

const BATTLE_FORMATS: { format: BattleFormat; label: string; description: string }[] = [
  { format: '1v1', label: '1v1', description: 'One-on-one roasting battle' },
  { format: '2v2', label: '2v2', description: 'Team battle with 2 players each' },
  { format: '3v3', label: '3v3', description: 'Team battle with 3 players each' },
  { format: '4v4', label: '4v4', description: 'Team battle with 4 players each' },
  { format: '5v5', label: '5v5', description: 'Epic team battle with 5 players each' },
];

export default function BattleFormatSelectionScreen() {
  const { streamTitle } = useLocalSearchParams<{ streamTitle: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLobby = async () => {
    if (!selectedFormat || !user) return;

    // Check if user is blocked from matchmaking
    const isBlocked = await battleService.isUserBlocked(user.id);
    if (isBlocked) {
      Alert.alert(
        'Matchmaking Blocked',
        'You are temporarily blocked from matchmaking for declining a match. Please wait 3 minutes.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCreating(true);

    const { lobby, error } = await battleService.createLobby(
      user.id,
      selectedFormat,
      false,
      null
    );

    setIsCreating(false);

    if (error || !lobby) {
      Alert.alert('Error', 'Failed to create battle lobby. Please try again.');
      return;
    }

    console.log('✅ Battle lobby created:', lobby);

    // Navigate to lobby screen
    router.replace({
      pathname: '/screens/BattleLobbyScreen',
      params: { lobbyId: lobby.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Battle Format</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stream Title Display */}
      <View style={[styles.titleCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.titleLabel, { color: colors.textSecondary }]}>Battle Title</Text>
        <Text style={[styles.titleValue, { color: colors.text }]}>{streamTitle}</Text>
      </View>

      {/* Format Selection */}
      <View style={styles.formatsContainer}>
        <Text style={[styles.formatsTitle, { color: colors.text }]}>Choose Your Format</Text>
        {BATTLE_FORMATS.map((item) => (
          <TouchableOpacity
            key={item.format}
            style={[
              styles.formatCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedFormat === item.format && styles.formatCardSelected,
            ]}
            onPress={() => setSelectedFormat(item.format)}
            disabled={isCreating}
          >
            <View style={styles.formatHeader}>
              <View
                style={[
                  styles.formatBadge,
                  selectedFormat === item.format && styles.formatBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.formatLabel,
                    selectedFormat === item.format && styles.formatLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {selectedFormat === item.format && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={24}
                  color={colors.brandPrimary || '#A40028'}
                />
              )}
            </View>
            <Text style={[styles.formatDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Lobby Button */}
      <View style={styles.actions}>
        {isCreating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandPrimary || '#A40028'} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Creating lobby...</Text>
          </View>
        ) : (
          <GradientButton
            title="CREATE LOBBY"
            onPress={handleCreateLobby}
            size="large"
            disabled={!selectedFormat}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  titleCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  formatsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formatCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  formatCardSelected: {
    borderColor: '#A40028',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formatBadge: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  formatBadgeSelected: {
    backgroundColor: '#A40028',
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A40028',
  },
  formatLabelSelected: {
    color: '#FFFFFF',
  },
  formatDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  actions: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
