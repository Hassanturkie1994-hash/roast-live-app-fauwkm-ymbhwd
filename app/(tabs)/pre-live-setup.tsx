
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
import VIPClubPanel from '@/components/VIPClubPanel';
import LiveSettingsPanel from '@/components/LiveSettingsPanel';
import { BattleFormat, battleService } from '@/app/services/battleService';

export default function PreLiveSetupScreen() {
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

  // Panel visibility states
  const [showVIPClubPanel, setShowVIPClubPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Settings states (passed to LiveSettingsPanel)
  const [aboutLive, setAboutLive] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [whoCanWatch, setWhoCanWatch] = useState<'public' | 'followers' | 'vip_club'>('public');
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);

  // Battle mode states
  const [streamMode, setStreamMode] = useState<'solo' | 'battle'>('solo');
  const [battleFormat, setBattleFormat] = useState<BattleFormat | null>(null);

  // VIP Club state
  const [selectedVIPClub, setSelectedVIPClub] = useState<string | null>(null);

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

    return () => {
      isMountedRef.current = false;
    };
  }, [user, cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

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
        aboutLive,
        practiceMode: practiceMode.toString(),
        whoCanWatch,
        selectedModerators: JSON.stringify(selectedModerators),
        selectedVIPClub: selectedVIPClub || '',
      },
    });

    console.log('✅ [PRE-LIVE] Navigation initiated successfully');
  }, [streamTitle, contentLabel, aboutLive, practiceMode, whoCanWatch, selectedModerators, selectedVIPClub, cameraPermission, micPermission]);

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
        Alert.alert('Error', 'Please select a battle format in Settings');
        setShowSettingsPanel(true);
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
  }, [streamTitle, contentLabel, user, practiceMode, streamMode, battleFormat, navigateToBroadcaster, cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

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

        {/* STREAM MODE INDICATOR */}
        {streamMode === 'battle' && battleFormat && (
          <View style={styles.battleModeIndicator}>
            <IconSymbol
              ios_icon_name="flame.fill"
              android_material_icon_name="whatshot"
              size={16}
              color="#FF6B00"
            />
            <Text style={styles.battleModeText}>🎮 Battle Mode: {battleFormat.toUpperCase()}</Text>
          </View>
        )}

        {/* VIP CLUB INDICATOR */}
        {selectedVIPClub && (
          <View style={styles.vipClubIndicator}>
            <IconSymbol
              ios_icon_name="star.circle.fill"
              android_material_icon_name="workspace_premium"
              size={16}
              color="#FFD700"
            />
            <Text style={styles.vipClubText}>💎 VIP Club Enabled</Text>
          </View>
        )}

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowContentLabelModal(true)}
          >
            <IconSymbol
              ios_icon_name="tag.fill"
              android_material_icon_name="label"
              size={28}
              color={contentLabel ? colors.brandPrimary : '#FFFFFF'}
            />
            <Text style={styles.actionButtonText}>Content</Text>
            {contentLabel && <View style={styles.activeDot} />}
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
            {(selectedModerators.length > 0 || practiceMode || streamMode === 'battle') && <View style={styles.activeDot} />}
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

        {/* PRACTICE MODE INDICATOR */}
        {practiceMode && streamMode === 'solo' && (
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
          streamMode={streamMode}
          setStreamMode={setStreamMode}
          battleFormat={battleFormat}
          setBattleFormat={setBattleFormat}
        />
      </View>
    </>
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
  battleModeIndicator: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 280 : 270,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
  },
  battleModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vipClubIndicator: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 350 : 340,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
  },
  vipClubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
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
});
