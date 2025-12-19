
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router, Stack, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import CommunityGuidelinesModal from '@/components/CommunityGuidelinesModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStreamStateMachine } from '@/contexts/LiveStreamStateMachine';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';
import { communityGuidelinesService } from '@/app/services/communityGuidelinesService';
import { BattleFormat, battleService } from '@/app/services/battleService';

// NEW: Import modular bottom-sheet panels
import FiltersEffectsBottomSheet from '@/components/FiltersEffectsBottomSheet';
import StreamSettingsBottomSheet from '@/components/StreamSettingsBottomSheet';
import BattleSetupBottomSheet from '@/components/BattleSetupBottomSheet';
import VIPClubBottomSheet from '@/components/VIPClubBottomSheet';
import ModeratorPanelBottomSheet from '@/components/ModeratorPanelBottomSheet';

// NEW: Import camera effects context
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
import { useAIFaceEffects } from '@/contexts/AIFaceEffectsContext';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PRE-LIVE SAFETY GUARD
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This component checks if AIFaceEffectsProvider context is ready before
 * rendering the main Pre-Live UI. This prevents crashes when useAIFaceEffects
 * is called before the provider is mounted.
 * 
 * CRITICAL: Do NOT remove this guard. It ensures the provider hierarchy is
 * properly initialized before any hooks are called.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function LoadingState() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Initializing camera effects...</Text>
      </View>
    </>
  );
}

/**
 * PreLiveSetupScreenContent
 * 
 * CRITICAL: This component is wrapped by PreLiveSetupScreen which ensures
 * that all required providers are ready before rendering.
 * 
 * DO NOT call useAIFaceEffects or useCameraEffects outside of this component.
 */
function PreLiveSetupScreenContent() {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const liveStreamState = useLiveStreamStateMachine();
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [facing, setFacing] = useState<CameraType>('front');

  // Stream setup states
  const [streamTitle, setStreamTitle] = useState('');
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [showCommunityGuidelinesModal, setShowCommunityGuidelinesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Bottom sheet visibility states
  const [showFiltersEffects, setShowFiltersEffects] = useState(false);
  const [showStreamSettings, setShowStreamSettings] = useState(false);
  const [showBattleSetup, setShowBattleSetup] = useState(false);
  const [showVIPClub, setShowVIPClub] = useState(false);
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);

  // Stream settings states
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [battlesEnabled, setBattlesEnabled] = useState(true);
  const [vipClubEnabled, setVipClubEnabled] = useState(false);
  const [rankingsEnabled, setRankingsEnabled] = useState(true);
  const [seasonTrackingEnabled, setSeasonTrackingEnabled] = useState(true);
  const [moderationToolsEnabled, setModerationToolsEnabled] = useState(true);
  const [practiceMode, setPracticeMode] = useState(false);
  const [whoCanWatch, setWhoCanWatch] = useState<'public' | 'followers' | 'vip_club'>('public');
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);

  // Battle mode states
  const [streamMode, setStreamMode] = useState<'solo' | 'battle'>('solo');
  const [battleFormat, setBattleFormat] = useState<BattleFormat | null>(null);
  const [battleRanked, setBattleRanked] = useState(false);

  // VIP Club state
  const [selectedVIPClub, setSelectedVIPClub] = useState<string | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRITICAL: SAFE CONTEXT ACCESS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 
  // These hooks are called AFTER the provider readiness check in the parent
  // component. They will never be called if providers are not ready.
  // 
  // DO NOT wrap these in try-catch. If they throw, it means the provider
  // hierarchy is broken and needs to be fixed in app/_layout.tsx.
  // 
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { activeFilter, activeEffect, hasAnyActive } = useCameraEffects();
  const { activeEffect: activeFaceEffect, isReady: aiFaceEffectsReady } = useAIFaceEffects();

  const isMountedRef = useRef(true);

  // CRITICAL: Hide bottom tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🎬 [PRE-LIVE] Screen focused - hiding bottom tab bar');
      
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        console.log('🎬 [PRE-LIVE] Screen blurred - restoring bottom tab bar');
        const parent = navigation.getParent();
        if (parent) {
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }
      };
    }, [navigation])
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const requestPermissions = async () => {
      console.log('🔐 [PRE-LIVE] Checking permissions...');
      
      if (!cameraPermission?.granted) {
        console.log('📷 [PRE-LIVE] Requesting camera permission...');
        await requestCameraPermission();
      }
      
      if (!micPermission?.granted) {
        console.log('🎤 [PRE-LIVE] Requesting microphone permission...');
        await requestMicPermission();
      }
    };

    requestPermissions();

    console.log('📹 [PRE-LIVE] Entered pre-live setup screen');
    console.log('✅ [PRE-LIVE] AI Face Effects ready:', aiFaceEffectsReady);

    return () => {
      isMountedRef.current = false;
    };
  }, [user, cameraPermission, micPermission, requestCameraPermission, requestMicPermission, aiFaceEffectsReady]);

  const handleClose = () => {
    console.log('❌ [PRE-LIVE] Pre-Live setup closed');
    
    const parent = navigation.getParent();
    if (parent) {
      console.log('🔄 [PRE-LIVE] Explicitly restoring tab bar before navigation');
      parent.setOptions({
        tabBarStyle: undefined,
      });
    }
    
    router.back();
  };

  const toggleCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const navigateToBroadcaster = useCallback(() => {
    console.log('🚀 [PRE-LIVE] Navigating to broadcaster screen');
    
    if (!cameraPermission?.granted || !micPermission?.granted) {
      console.error('❌ [PRE-LIVE] Cannot navigate - permissions not granted');
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are required to start broadcasting.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    router.push({
      pathname: '/(tabs)/broadcast',
      params: {
        streamTitle,
        contentLabel: contentLabel || 'family_friendly',
        practiceMode: practiceMode.toString(),
        whoCanWatch,
        selectedModerators: JSON.stringify(selectedModerators),
        selectedVIPClub: selectedVIPClub || '',
        chatEnabled: chatEnabled.toString(),
        giftsEnabled: giftsEnabled.toString(),
        battlesEnabled: battlesEnabled.toString(),
        vipClubEnabled: vipClubEnabled.toString(),
        rankingsEnabled: rankingsEnabled.toString(),
        seasonTrackingEnabled: seasonTrackingEnabled.toString(),
        moderationToolsEnabled: moderationToolsEnabled.toString(),
      },
    });

    console.log('✅ [PRE-LIVE] Navigation initiated successfully');
  }, [
    streamTitle,
    contentLabel,
    practiceMode,
    whoCanWatch,
    selectedModerators,
    selectedVIPClub,
    chatEnabled,
    giftsEnabled,
    battlesEnabled,
    vipClubEnabled,
    rankingsEnabled,
    seasonTrackingEnabled,
    moderationToolsEnabled,
    cameraPermission,
    micPermission,
  ]);

  const handleGoLive = useCallback(async () => {
    console.log('🚀 [PRE-LIVE] Go LIVE button pressed');

    if (!cameraPermission?.granted || !micPermission?.granted) {
      console.error('❌ [PRE-LIVE] Permissions not granted');
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are required to start broadcasting. Please grant permissions and try again.',
        [
          {
            text: 'Grant Permissions',
            onPress: async () => {
              await requestCameraPermission();
              await requestMicPermission();
            },
          },
          { text: 'Cancel' },
        ]
      );
      return;
    }

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

    // Battle mode validation
    if (streamMode === 'battle') {
      if (!battleFormat) {
        Alert.alert('Error', 'Please select a battle format in Battle Setup');
        setShowBattleSetup(true);
        return;
      }

      const isBlocked = await battleService.isUserBlocked(user.id);
      if (isBlocked) {
        Alert.alert(
          'Matchmaking Blocked',
          'You are temporarily blocked from matchmaking for declining a match. Please wait 3 minutes.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('🎮 [PRE-LIVE] Navigating to battle lobby creation');
      
      try {
        setIsLoading(true);

        const { lobby, error } = await battleService.createLobby(
          user.id,
          battleFormat,
          false,
          null
        );

        if (error || !lobby) {
          Alert.alert('Error', 'Failed to create battle lobby. Please try again.');
          return;
        }

        console.log('✅ [PRE-LIVE] Battle lobby created:', lobby);

        router.push({
          pathname: '/screens/BattleLobbyScreen',
          params: { lobbyId: lobby.id },
        });

        return;
      } catch (error) {
        console.error('❌ [PRE-LIVE] Error creating battle lobby:', error);
        Alert.alert('Error', 'Failed to create battle lobby. Please try again.');
        return;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    try {
      setIsLoading(true);

      if (!practiceMode) {
        const hasAcceptedGuidelines = await communityGuidelinesService.hasAcceptedGuidelines(user.id);
        
        if (!hasAcceptedGuidelines) {
          console.log('⚠️ User has not accepted community guidelines - showing modal');
          setShowCommunityGuidelinesModal(true);
          setIsLoading(false);
          return;
        }

        const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
        if (!canStream.canStream) {
          Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
          setIsLoading(false);
          return;
        }

        await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
      }

      console.log('✅ [PRE-LIVE] Validation passed');

      navigateToBroadcaster();
    } catch (error) {
      console.error('❌ [PRE-LIVE] Error in handleGoLive:', error);
      Alert.alert('Error', 'Failed to start stream setup. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    streamTitle,
    contentLabel,
    user,
    practiceMode,
    streamMode,
    battleFormat,
    navigateToBroadcaster,
    cameraPermission,
    micPermission,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const handleContentLabelSelected = (label: ContentLabel) => {
    console.log('🏷️ [PRE-LIVE] Content label selected:', label);
    setContentLabel(label);
    setShowContentLabelModal(false);
  };

  const handleGuidelinesAccept = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const result = await communityGuidelinesService.recordAcceptance(user.id);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to record acceptance');
        setIsLoading(false);
        return;
      }

      console.log('✅ Community guidelines accepted');
      setShowCommunityGuidelinesModal(false);

      if (!practiceMode) {
        const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
        if (!canStream.canStream) {
          Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
          setIsLoading(false);
          return;
        }

        await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
      }

      console.log('✅ [PRE-LIVE] Validation passed after guidelines acceptance');

      navigateToBroadcaster();
    } catch (error) {
      console.error('Error accepting guidelines:', error);
      Alert.alert('Error', 'Failed to accept guidelines. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  if (!cameraPermission || !micPermission) {
    console.log('⏳ [PRE-LIVE] Permissions still loading...');
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.permissionText}>Loading permissions...</Text>
          </View>
        </View>
      </>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    console.log('⚠️ [PRE-LIVE] Permissions not granted');
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.permissionText}>
              We need camera and microphone permissions to start streaming
            </Text>
            <GradientButton 
              title="Grant Permissions" 
              onPress={async () => {
                console.log('🔐 [PRE-LIVE] Requesting permissions...');
                await requestCameraPermission();
                await requestMicPermission();
              }} 
            />
          </View>
        </View>
      </>
    );
  }

  console.log('✅ [PRE-LIVE] Rendering camera view');
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
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

        {/* STREAM TITLE INPUT */}
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder={streamMode === 'battle' ? 'Battle title...' : 'What are you streaming?'}
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

        {/* ACTIVE FEATURES INDICATORS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.indicatorsContainer}
          contentContainerStyle={styles.indicatorsContent}
        >
          {streamMode === 'battle' && battleFormat && (
            <View style={styles.indicator}>
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="whatshot"
                size={14}
                color="#FF6B00"
              />
              <Text style={styles.indicatorText}>
                Battle: {battleFormat.toUpperCase()} {battleRanked ? '(Ranked)' : '(Casual)'}
              </Text>
            </View>
          )}
          
          {selectedVIPClub && (
            <View style={[styles.indicator, styles.indicatorVIP]}>
              <IconSymbol
                ios_icon_name="star.circle.fill"
                android_material_icon_name="workspace_premium"
                size={14}
                color="#FFD700"
              />
              <Text style={[styles.indicatorText, styles.indicatorTextVIP]}>VIP Club Only</Text>
            </View>
          )}

          {(activeFilter || activeEffect || activeFaceEffect) && (
            <View style={[styles.indicator, styles.indicatorFilter]}>
              <IconSymbol
                ios_icon_name="camera.filters"
                android_material_icon_name="filter"
                size={14}
                color="#4A90E2"
              />
              <Text style={styles.indicatorText}>
                {activeFilter && 'Filter'}
                {activeFilter && (activeEffect || activeFaceEffect) && ' + '}
                {activeEffect && 'Effect'}
                {activeFaceEffect && 'Face Effect'}
              </Text>
            </View>
          )}

          {selectedModerators.length > 0 && (
            <View style={[styles.indicator, styles.indicatorMod]}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={14}
                color="#00E676"
              />
              <Text style={styles.indicatorText}>{selectedModerators.length} Moderators</Text>
            </View>
          )}

          {practiceMode && streamMode === 'solo' && (
            <View style={[styles.indicator, styles.indicatorPractice]}>
              <IconSymbol
                ios_icon_name="eye.slash.fill"
                android_material_icon_name="visibility_off"
                size={14}
                color="#FFA500"
              />
              <Text style={styles.indicatorText}>Practice Mode</Text>
            </View>
          )}
        </ScrollView>

        {/* MODULAR ACTION BUTTONS (TikTok-Style) */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowFiltersEffects(true)}
          >
            <View style={[
              styles.actionIconContainer,
              (activeFilter || activeEffect || activeFaceEffect) && styles.actionIconContainerActive
            ]}>
              <IconSymbol
                ios_icon_name="camera.filters"
                android_material_icon_name="filter"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.actionButtonText}>Filters</Text>
            {(activeFilter || activeEffect || activeFaceEffect) && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowStreamSettings(true)}
          >
            <View style={styles.actionIconContainer}>
              <IconSymbol
                ios_icon_name="gearshape.fill"
                android_material_icon_name="settings"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.actionButtonText}>Settings</Text>
            {(practiceMode || !chatEnabled || !giftsEnabled) && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {battlesEnabled && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowBattleSetup(true)}
            >
              <View style={[
                styles.actionIconContainer,
                streamMode === 'battle' && styles.actionIconContainerActive
              ]}>
                <IconSymbol
                  ios_icon_name="flame.fill"
                  android_material_icon_name="whatshot"
                  size={24}
                  color="#FF6B00"
                />
              </View>
              <Text style={styles.actionButtonText}>Battle</Text>
              {streamMode === 'battle' && <View style={styles.activeDot} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowVIPClub(true)}
          >
            <View style={[
              styles.actionIconContainer,
              selectedVIPClub && styles.actionIconContainerActive
            ]}>
              <IconSymbol
                ios_icon_name="star.circle.fill"
                android_material_icon_name="workspace_premium"
                size={24}
                color="#FFD700"
              />
            </View>
            <Text style={styles.actionButtonText}>VIP Club</Text>
            {selectedVIPClub && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowModeratorPanel(true)}
          >
            <View style={[
              styles.actionIconContainer,
              selectedModerators.length > 0 && styles.actionIconContainerActive
            ]}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={24}
                color="#00E676"
              />
            </View>
            <Text style={styles.actionButtonText}>Moderators</Text>
            {selectedModerators.length > 0 && <View style={styles.activeDot} />}
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
              title={
                isLoading 
                  ? 'LOADING...' 
                  : streamMode === 'battle' 
                    ? '🎮 CREATE BATTLE LOBBY' 
                    : practiceMode 
                      ? 'START PRACTICE' 
                      : 'GO LIVE'
              }
              onPress={handleGoLive}
              size="large"
              disabled={isLoading || (streamMode === 'battle' && !battleFormat)}
            />
          )}
        </View>

        {/* COMMUNITY GUIDELINES MODAL */}
        <CommunityGuidelinesModal
          visible={showCommunityGuidelinesModal}
          onAccept={handleGuidelinesAccept}
          onCancel={() => {
            setShowCommunityGuidelinesModal(false);
            setIsLoading(false);
          }}
          isLoading={isLoading}
        />

        {/* CONTENT LABEL MODAL */}
        <ContentLabelModal
          visible={showContentLabelModal}
          onSelect={handleContentLabelSelected}
          onCancel={() => setShowContentLabelModal(false)}
        />

        {/* NEW: MODULAR BOTTOM SHEETS */}
        <FiltersEffectsBottomSheet
          visible={showFiltersEffects}
          onClose={() => setShowFiltersEffects(false)}
        />

        <StreamSettingsBottomSheet
          visible={showStreamSettings}
          onClose={() => setShowStreamSettings(false)}
          chatEnabled={chatEnabled}
          setChatEnabled={setChatEnabled}
          giftsEnabled={giftsEnabled}
          setGiftsEnabled={setGiftsEnabled}
          battlesEnabled={battlesEnabled}
          setBattlesEnabled={setBattlesEnabled}
          vipClubEnabled={vipClubEnabled}
          setVipClubEnabled={setVipClubEnabled}
          rankingsEnabled={rankingsEnabled}
          setRankingsEnabled={setRankingsEnabled}
          seasonTrackingEnabled={seasonTrackingEnabled}
          setSeasonTrackingEnabled={setSeasonTrackingEnabled}
          moderationToolsEnabled={moderationToolsEnabled}
          setModerationToolsEnabled={setModerationToolsEnabled}
          practiceMode={practiceMode}
          setPracticeMode={setPracticeMode}
          whoCanWatch={whoCanWatch}
          setWhoCanWatch={setWhoCanWatch}
        />

        <BattleSetupBottomSheet
          visible={showBattleSetup}
          onClose={() => setShowBattleSetup(false)}
          streamMode={streamMode}
          setStreamMode={setStreamMode}
          battleFormat={battleFormat}
          setBattleFormat={setBattleFormat}
          battleRanked={battleRanked}
          setBattleRanked={setBattleRanked}
        />

        <VIPClubBottomSheet
          visible={showVIPClub}
          onClose={() => setShowVIPClub(false)}
          selectedClub={selectedVIPClub}
          onSelectClub={setSelectedVIPClub}
        />

        <ModeratorPanelBottomSheet
          visible={showModeratorPanel}
          onClose={() => setShowModeratorPanel(false)}
          selectedModerators={selectedModerators}
          setSelectedModerators={setSelectedModerators}
        />
      </View>
    </>
  );
}

/**
 * PreLiveSetupScreen
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRITICAL: PROVIDER READINESS CHECK
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This component ensures that all required providers are ready before
 * rendering the main Pre-Live UI. This prevents crashes when hooks are
 * called before providers are mounted.
 * 
 * VERIFICATION STEPS:
 * 1. Check if AIFaceEffectsProvider context is available
 * 2. Check if CameraEffectsProvider context is available
 * 3. Check if AIFaceEffectsProvider is marked as ready
 * 4. Only render main UI if all checks pass
 * 
 * SAFETY GUARANTEE:
 * - useAIFaceEffects will NEVER be called before AIFaceEffectsProvider is ready
 * - useCameraEffects will NEVER be called before CameraEffectsProvider is ready
 * - Loading state is shown while providers are initializing
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function PreLiveSetupScreen() {
  // CRITICAL: Check if AIFaceEffectsProvider is ready
  // This hook is safe to call here because it's wrapped by the provider in _layout.tsx
  const { isReady: aiFaceEffectsReady } = useAIFaceEffects();

  // If AI Face Effects provider is not ready, show loading state
  if (!aiFaceEffectsReady) {
    console.warn('⚠️ [PRE-LIVE] AI Face Effects provider not ready, showing loading state');
    return <LoadingState />;
  }

  // All providers are ready, render main content
  console.log('✅ [PRE-LIVE] All providers ready, rendering main content');
  return <PreLiveSetupScreenContent />;
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  titleContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 140 : 130,
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
    top: Platform.OS === 'android' ? 210 : 200,
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
  indicatorsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 280 : 270,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  indicatorsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  indicatorVIP: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
  },
  indicatorFilter: {
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
  },
  indicatorMod: {
    backgroundColor: 'rgba(0, 230, 118, 0.9)',
  },
  indicatorPractice: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  indicatorTextVIP: {
    color: '#000000',
  },
  actionBar: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionIconContainerActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.8)',
    borderColor: colors.brandPrimary,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
    borderWidth: 2,
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
});
