
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStreamState } from '@/contexts/LiveStreamStateMachine';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';
import ImprovedEffectsPanel from '@/components/ImprovedEffectsPanel';
import ImprovedFiltersPanel from '@/components/ImprovedFiltersPanel';
import VIPClubPanel from '@/components/VIPClubPanel';
import LiveSettingsPanel from '@/components/LiveSettingsPanel';
import ImprovedCameraFilterOverlay from '@/components/ImprovedCameraFilterOverlay';
import ImprovedVisualEffectsOverlay from '@/components/ImprovedVisualEffectsOverlay';

export default function PreLiveSetupScreen() {
  const { user } = useAuth();
  const liveStreamState = useLiveStreamState();
  const { activeFilter, activeEffect, filterIntensity, hasActiveFilter, hasActiveEffect } = useCameraEffects();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');

  // Stream setup states
  const [streamTitle, setStreamTitle] = useState('');
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Panel visibility states
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showVIPClubPanel, setShowVIPClubPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Settings states (passed to LiveSettingsPanel)
  const [aboutLive, setAboutLive] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [whoCanWatch, setWhoCanWatch] = useState<'public' | 'followers' | 'vip_club'>('public');
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);

  // VIP Club state
  const [selectedVIPClub, setSelectedVIPClub] = useState<string | null>(null);

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

    // Enter PRE_LIVE_SETUP state
    liveStreamState.enterPreLiveSetup();
    console.log('📹 [PRE-LIVE] Entered pre-live setup screen');
    console.log('🎨 [PRE-LIVE] Active filter:', activeFilter?.name || 'None');
    console.log('✨ [PRE-LIVE] Active effect:', activeEffect?.name || 'None');

    return () => {
      isMountedRef.current = false;
    };
  }, [user, permission, liveStreamState, activeFilter?.name, activeEffect?.name, requestPermission]);

  // Update state machine when content label is selected
  useEffect(() => {
    if (contentLabel && liveStreamState.currentState === 'PRE_LIVE_SETUP') {
      liveStreamState.selectContentLabel();
      console.log('🏷️ [PRE-LIVE] Content label selected, state updated');
    }
  }, [contentLabel, liveStreamState]);

  // Update state machine when practice mode changes
  useEffect(() => {
    if (practiceMode && liveStreamState.currentState === 'CONTENT_LABEL_SELECTED') {
      liveStreamState.enablePracticeMode();
      console.log('🎯 [PRE-LIVE] Practice mode enabled');
    } else if (!practiceMode && liveStreamState.currentState === 'PRACTICE_MODE_ACTIVE') {
      liveStreamState.disablePracticeMode();
      console.log('🎯 [PRE-LIVE] Practice mode disabled');
    }
  }, [practiceMode, liveStreamState]);

  const handleClose = () => {
    console.log('❌ [PRE-LIVE] Pre-Live setup closed');
    liveStreamState.resetToIdle();
    router.back();
  };

  const toggleCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleGoLive = useCallback(async () => {
    console.log('🚀 [PRE-LIVE] Go LIVE button pressed');
    console.log('📊 [PRE-LIVE] Current state:', liveStreamState.currentState);
    console.log('🎯 [PRE-LIVE] Practice Mode:', practiceMode);
    console.log('🎨 [PRE-LIVE] Active filter:', activeFilter?.name || 'None');
    console.log('✨ [PRE-LIVE] Active effect:', activeEffect?.name || 'None');

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

    // Check if we can go live
    if (!liveStreamState.canGoLive()) {
      console.warn('⚠️ [PRE-LIVE] Cannot go live from current state:', liveStreamState.currentState);
      Alert.alert('Error', 'Please complete setup before going live');
      return;
    }

    try {
      setIsLoading(true);

      // Only check streaming permissions for real streams
      if (!practiceMode) {
        const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
        if (!canStream.canStream) {
          Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
          return;
        }

        // Log creator rules acceptance
        await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
      }

      console.log('✅ [PRE-LIVE] Validation passed');
      console.log('🎬 [PRE-LIVE] Transitioning to STREAM_CREATING state');

      // Transition to STREAM_CREATING state
      liveStreamState.startStreamCreation();

      // IMMEDIATELY navigate to broadcaster screen with all settings
      // Filters and effects are managed by CameraEffectsContext (no need to pass as params)
      console.log('🚀 [PRE-LIVE] Navigating to broadcaster screen');
      
      router.push({
        pathname: '/(tabs)/broadcast',
        params: {
          streamTitle,
          contentLabel,
          aboutLive,
          practiceMode: practiceMode.toString(),
          whoCanWatch,
          selectedModerators: JSON.stringify(selectedModerators),
          selectedVIPClub: selectedVIPClub || '',
        },
      });

      console.log('✅ [PRE-LIVE] Navigation initiated successfully');
      console.log('📦 [PRE-LIVE] Settings passed:', {
        practiceMode,
        selectedModerators: selectedModerators.length,
        selectedVIPClub,
        hasFilter: hasActiveFilter(),
        hasEffect: hasActiveEffect(),
      });
    } catch (error) {
      console.error('❌ [PRE-LIVE] Error in handleGoLive:', error);
      liveStreamState.setError('Failed to start stream setup. Please try again.');
      Alert.alert('Error', 'Failed to start stream setup. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [streamTitle, contentLabel, user, liveStreamState, practiceMode, activeFilter?.name, activeEffect?.name, aboutLive, whoCanWatch, selectedModerators, selectedVIPClub, hasActiveFilter, hasActiveEffect]);

  const handleContentLabelSelected = (label: ContentLabel) => {
    console.log('🏷️ [PRE-LIVE] Content label selected:', label);
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

      {/* CAMERA FILTER OVERLAY - Using improved component */}
      <ImprovedCameraFilterOverlay filter={activeFilter} intensity={filterIntensity} />

      {/* VISUAL EFFECTS OVERLAY - Using improved component */}
      <ImprovedVisualEffectsOverlay effect={activeEffect} />

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

      {/* ESTIMATED EARNINGS & ROAST GOALS */}
      <View style={styles.goalsContainer}>
        <View style={styles.goalCard}>
          <Text style={styles.goalIcon}>💎</Text>
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalLabel}>Est. Earnings</Text>
            <Text style={styles.goalValue}>$0.00</Text>
          </View>
        </View>
        <View style={styles.goalCard}>
          <Text style={styles.goalIcon}>🔥</Text>
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalLabel}>Roast Goal</Text>
            <Text style={styles.goalValue}>100 viewers</Text>
          </View>
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
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowEffectsPanel(true)}
        >
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto_awesome"
            size={28}
            color={hasActiveEffect() ? colors.brandPrimary : '#FFFFFF'}
          />
          <Text style={styles.actionButtonText}>Effects</Text>
          {hasActiveEffect() && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowFiltersPanel(true)}
        >
          <IconSymbol
            ios_icon_name="camera.filters"
            android_material_icon_name="filter"
            size={28}
            color={hasActiveFilter() ? colors.brandPrimary : '#FFFFFF'}
          />
          <Text style={styles.actionButtonText}>Filters</Text>
          {hasActiveFilter() && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowVIPClubPanel(true)}
        >
          <IconSymbol
            ios_icon_name="star.circle.fill"
            android_material_icon_name="workspace_premium"
            size={28}
            color="#FFD700"
          />
          <Text style={styles.actionButtonText}>VIP Club</Text>
          {selectedVIPClub && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowSettingsPanel(true)}
        >
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Settings</Text>
          {(selectedModerators.length > 0 || practiceMode) && <View style={styles.activeDot} />}
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
            title={isLoading ? 'LOADING...' : practiceMode ? 'START PRACTICE' : 'GO LIVE'}
            onPress={handleGoLive}
            size="large"
            disabled={isLoading || !liveStreamState.canGoLive()}
          />
        )}
      </View>

      {/* PRACTICE MODE INDICATOR */}
      {practiceMode && (
        <View style={styles.practiceModeIndicator}>
          <IconSymbol
            ios_icon_name="eye.slash.fill"
            android_material_icon_name="visibility_off"
            size={16}
            color="#FFA500"
          />
          <Text style={styles.practiceModeText}>Practice Mode Enabled</Text>
        </View>
      )}

      {/* STATE MACHINE DEBUG (Remove in production) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>State: {liveStreamState.currentState}</Text>
          <Text style={styles.debugText}>Practice: {practiceMode ? 'YES' : 'NO'}</Text>
          <Text style={styles.debugText}>Filter: {activeFilter?.name || 'NONE'}</Text>
          <Text style={styles.debugText}>Effect: {activeEffect?.name || 'NONE'}</Text>
        </View>
      )}

      {/* CONTENT LABEL MODAL */}
      <ContentLabelModal
        visible={showContentLabelModal}
        onSelect={handleContentLabelSelected}
        onCancel={() => setShowContentLabelModal(false)}
      />

      {/* EFFECTS PANEL - Using improved component */}
      <ImprovedEffectsPanel
        visible={showEffectsPanel}
        onClose={() => setShowEffectsPanel(false)}
      />

      {/* FILTERS PANEL - Using improved component */}
      <ImprovedFiltersPanel
        visible={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
      />

      {/* VIP CLUB PANEL */}
      <VIPClubPanel
        visible={showVIPClubPanel}
        onClose={() => setShowVIPClubPanel(false)}
        selectedClub={selectedVIPClub}
        onSelectClub={setSelectedVIPClub}
      />

      {/* SETTINGS PANEL */}
      <LiveSettingsPanel
        visible={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        aboutLive={aboutLive}
        setAboutLive={setAboutLive}
        practiceMode={practiceMode}
        setPracticeMode={setPracticeMode}
        whoCanWatch={whoCanWatch}
        setWhoCanWatch={setWhoCanWatch}
        selectedModerators={selectedModerators}
        setSelectedModerators={setSelectedModerators}
      />
    </View>
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
    pointerEvents: 'none',
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
    gap: 10,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 210 : 200,
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
    top: Platform.OS === 'android' ? 280 : 270,
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
    position: 'relative',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
  practiceModeIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
  },
  practiceModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 350 : 340,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
  },
  debugText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00FF00',
  },
});
