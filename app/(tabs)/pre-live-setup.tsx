
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';

export default function PreLiveSetupScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');

  // Stream setup states
  const [streamTitle, setStreamTitle] = useState('');
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Settings states
  const [aboutLive, setAboutLive] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [whoCanWatch, setWhoCanWatch] = useState<'everyone' | 'followers' | 'club'>('everyone');

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!permission?.granted) {
      requestPermission();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user, permission]);

  const handleClose = () => {
    console.log('❌ Pre-Live setup closed');
    router.back();
  };

  const toggleCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleGoLive = async () => {
    console.log('🚀 Go LIVE button pressed');

    if (!streamTitle.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
      return;
    }

    if (!contentLabel) {
      Alert.alert('Error', 'Please select a content label');
      setShowContentLabelModal(true);
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    try {
      setIsLoading(true);

      // Check if user can stream
      const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
      if (!canStream.canStream) {
        Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
        return;
      }

      // Log creator rules acceptance
      await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);

      console.log('✅ Validation passed, navigating to broadcaster screen');

      // IMMEDIATELY navigate to broadcaster screen
      router.push({
        pathname: '/(tabs)/broadcast',
        params: {
          streamTitle,
          contentLabel,
          aboutLive,
          practiceMode: practiceMode.toString(),
          whoCanWatch,
        },
      });
    } catch (error) {
      console.error('Error in handleGoLive:', error);
      Alert.alert('Error', 'Failed to start stream setup. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleContentLabelSelected = (label: ContentLabel) => {
    console.log('🏷️ Content label selected:', label);
    setContentLabel(label);
    setShowContentLabelModal(false);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.permissionText}>We need your permission to use the camera</Text>
          <GradientButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CAMERA PREVIEW BACKGROUND */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />

      {/* DARK OVERLAY */}
      <View style={styles.overlay} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.topRight}>
          <AppLogo size={80} opacity={0.8} alignment="right" />
        </View>
      </View>

      {/* LIVE GOALS / ROAST GOALS */}
      <View style={styles.goalsContainer}>
        <View style={styles.goalCard}>
          <Text style={styles.goalIcon}>🔥</Text>
          <Text style={styles.goalText}>Roast Goal: 100 viewers</Text>
        </View>
        <View style={styles.goalCard}>
          <Text style={styles.goalIcon}>💎</Text>
          <Text style={styles.goalText}>Earnings: $0.00</Text>
        </View>
      </View>

      {/* STREAM TITLE INPUT */}
      <View style={styles.titleContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="What are you streaming?"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={streamTitle}
          onChangeText={setStreamTitle}
          maxLength={100}
          editable={!isLoading}
        />
      </View>

      {/* CONTENT LABEL DISPLAY */}
      {contentLabel && (
        <TouchableOpacity
          style={styles.contentLabelDisplay}
          onPress={() => setShowContentLabelModal(true)}
        >
          <Text style={styles.contentLabelText}>
            {contentLabel === 'family_friendly' && '⭐ Family Friendly'}
            {contentLabel === 'roast_mode' && '🔥 Roast Mode'}
            {contentLabel === 'adult_only' && '🔞 18+ Only'}
          </Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron_right"
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Effects', 'Coming soon!')}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto_awesome"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Effects</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Filters', 'Coming soon!')}>
          <IconSymbol
            ios_icon_name="camera.filters"
            android_material_icon_name="filter"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowSettingsPanel(true)}>
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Community', 'Coming soon!')}>
          <IconSymbol
            ios_icon_name="person.3.fill"
            android_material_icon_name="group"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Community</Text>
        </TouchableOpacity>
      </View>

      {/* CAMERA FLIP BUTTON */}
      <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
        <IconSymbol
          ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
          android_material_icon_name="flip_camera_ios"
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* GO LIVE BUTTON */}
      <View style={styles.goLiveContainer}>
        {!contentLabel ? (
          <TouchableOpacity
            style={styles.selectLabelButton}
            onPress={() => setShowContentLabelModal(true)}
          >
            <Text style={styles.selectLabelText}>Select Content Label First</Text>
          </TouchableOpacity>
        ) : (
          <GradientButton
            title={isLoading ? 'LOADING...' : 'GO LIVE'}
            onPress={handleGoLive}
            size="large"
            disabled={isLoading}
          />
        )}
      </View>

      {/* CONTENT LABEL MODAL */}
      <ContentLabelModal
        visible={showContentLabelModal}
        onSelect={handleContentLabelSelected}
        onCancel={() => setShowContentLabelModal(false)}
      />

      {/* SETTINGS PANEL */}
      <SettingsPanel
        visible={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        aboutLive={aboutLive}
        setAboutLive={setAboutLive}
        practiceMode={practiceMode}
        setPracticeMode={setPracticeMode}
        whoCanWatch={whoCanWatch}
        setWhoCanWatch={setWhoCanWatch}
      />
    </View>
  );
}

/* ───────────────── SETTINGS PANEL COMPONENT ───────────────── */

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  aboutLive: string;
  setAboutLive: (text: string) => void;
  practiceMode: boolean;
  setPracticeMode: (value: boolean) => void;
  whoCanWatch: 'everyone' | 'followers' | 'club';
  setWhoCanWatch: (value: 'everyone' | 'followers' | 'club') => void;
}

function SettingsPanel({
  visible,
  onClose,
  aboutLive,
  setAboutLive,
  practiceMode,
  setPracticeMode,
  whoCanWatch,
  setWhoCanWatch,
}: SettingsPanelProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.settingsOverlay}>
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Live Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
            {/* About This Live */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>About this Live</Text>
              <TextInput
                style={styles.settingTextArea}
                placeholder="Describe your roast session..."
                placeholderTextColor={colors.placeholder}
                value={aboutLive}
                onChangeText={setAboutLive}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* Practice Mode */}
            <View style={styles.settingSection}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Practice Mode</Text>
                  <Text style={styles.settingDescription}>Stream privately to test your setup</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, practiceMode && styles.toggleActive]}
                  onPress={() => setPracticeMode(!practiceMode)}
                >
                  <View style={[styles.toggleThumb, practiceMode && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Who Can Watch */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Who can watch this live</Text>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'everyone' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('everyone')}
              >
                <Text style={[styles.optionText, whoCanWatch === 'everyone' && styles.optionTextActive]}>
                  Everyone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'followers' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('followers')}
              >
                <Text style={[styles.optionText, whoCanWatch === 'followers' && styles.optionTextActive]}>
                  Followers Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'club' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('club')}
              >
                <Text style={[styles.optionText, whoCanWatch === 'club' && styles.optionTextActive]}>
                  Club Members Only
                </Text>
              </TouchableOpacity>
            </View>

            {/* Moderators */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Moderators</Text>
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>Manage Moderators</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Safety Rules */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Safety & Community Rules</Text>
              <View style={styles.rulesBox}>
                <Text style={styles.ruleItem}>• No harassment or hate speech</Text>
                <Text style={styles.ruleItem}>• No revealing private information</Text>
                <Text style={styles.ruleItem}>• Keep roasts entertaining, not harmful</Text>
                <Text style={styles.ruleItem}>• Respect all community members</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.settingsFooter}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 120 : 110,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  goalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  goalIcon: {
    fontSize: 20,
  },
  goalText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 200 : 190,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  titleInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contentLabelDisplay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 270 : 260,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  contentLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flipButton: {
    position: 'absolute',
    bottom: 260,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  goLiveContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  selectLabelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  settingsContent: {
    padding: 20,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  settingTextArea: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.brandPrimary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  optionButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextActive: {
    color: colors.brandPrimary,
  },
  manageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rulesBox: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  ruleItem: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  settingsFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
