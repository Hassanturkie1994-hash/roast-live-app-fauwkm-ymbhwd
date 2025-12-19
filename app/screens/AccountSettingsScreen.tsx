
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import RoastIcon from '@/components/Icons/RoastIcon';
import CommunityGuidelinesModal from '@/components/CommunityGuidelinesModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/app/integrations/supabase/client';
import { adminService, AdminRole } from '@/app/services/adminService';
import { communityGuidelinesService } from '@/app/services/communityGuidelinesService';

export default function AccountSettingsScreen() {
  const { signOut, user, profile } = useAuth();
  const { colors } = useTheme();
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [isStreamModerator, setIsStreamModerator] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [showCommunityGuidelinesModal, setShowCommunityGuidelinesModal] = useState(false);
  const [isAcceptingGuidelines, setIsAcceptingGuidelines] = useState(false);

  const loadUserSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('profile_visibility')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfileVisibility(data.profile_visibility || 'public');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [user]);

  const checkUserRole = useCallback(async () => {
    if (!user) {
      setIsLoadingRole(false);
      return;
    }

    console.log('Checking admin role for user:', user.id);
    
    const staffResult = await adminService.checkAdminRole(user.id);
    console.log('Staff role result:', staffResult);
    setUserRole(staffResult.role);
    
    const modResult = await adminService.checkStreamModeratorRole(user.id);
    console.log('Stream moderator result:', modResult);
    setIsStreamModerator(modResult.isModerator);
    
    setIsLoadingRole(false);
  }, [user]);

  const checkIfLive = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('streams')
        .select('id, status')
        .eq('broadcaster_id', user.id)
        .eq('status', 'live')
        .maybeSingle();

      setIsLive(!!data);
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  }, [user]);

  useEffect(() => {
    checkUserRole();
    checkIfLive();
    loadUserSettings();
  }, [checkUserRole, checkIfLive, loadUserSettings]);

  const handleSignOut = async () => {
    if (isLive) {
      Alert.alert(
        'Cannot Logout',
        'You must end your live session before logging out.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    router.push('/screens/ChangePasswordScreen');
  };

  const handleDashboard = (role: AdminRole) => {
    console.log('Opening dashboard for role:', role);
    if (role === 'HEAD_ADMIN') {
      router.push('/screens/HeadAdminDashboardScreen' as any);
    } else if (role === 'ADMIN') {
      router.push('/screens/AdminDashboardScreen' as any);
    } else if (role === 'SUPPORT') {
      router.push('/screens/SupportDashboardScreen' as any);
    } else if (role === 'LIVE_MODERATOR') {
      router.push('/screens/LiveModeratorDashboardScreen' as any);
    }
  };

  const handleStreamModeratorDashboard = () => {
    router.push('/screens/ModeratorDashboardScreen' as any);
  };

  const handleWithdrawEarnings = () => {
    router.push('/screens/WithdrawScreen');
  };

  const handleTransactionHistory = () => {
    router.push('/screens/TransactionHistoryScreen');
  };

  const handleCommunityGuidelinesPress = () => {
    setShowCommunityGuidelinesModal(true);
  };

  const handleGuidelinesAccept = async () => {
    if (!user) return;

    try {
      setIsAcceptingGuidelines(true);

      const result = await communityGuidelinesService.recordAcceptance(user.id);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to record acceptance');
        return;
      }

      Alert.alert('Success', 'Community Guidelines accepted successfully');
      setShowCommunityGuidelinesModal(false);
    } catch (error) {
      console.error('Error accepting guidelines:', error);
      Alert.alert('Error', 'Failed to accept guidelines. Please try again.');
    } finally {
      setIsAcceptingGuidelines(false);
    }
  };

  const handleProfileVisibilityPress = () => {
    Alert.alert('Profile Visibility', 'Choose who can see your profile content', [
      { 
        text: 'Public', 
        onPress: async () => {
          setProfileVisibility('public');
          if (user) {
            await supabase
              .from('user_settings')
              .update({ profile_visibility: 'public' })
              .eq('user_id', user.id);
          }
        }
      },
      { 
        text: 'Private', 
        onPress: async () => {
          setProfileVisibility('private');
          if (user) {
            await supabase
              .from('user_settings')
              .update({ profile_visibility: 'private' })
              .eq('user_id', user.id);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getRoleName = (role: AdminRole) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return 'Head Admin Dashboard';
      case 'ADMIN':
        return 'Admin Dashboard';
      case 'SUPPORT':
        return 'Support Dashboard';
      case 'LIVE_MODERATOR':
        return 'Live Moderator Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getRoleDescription = (role: AdminRole) => {
    switch (role) {
      case 'HEAD_ADMIN':
        return 'Full platform control';
      case 'ADMIN':
        return 'Manage reports & users';
      case 'SUPPORT':
        return 'Review appeals & tickets';
      case 'LIVE_MODERATOR':
        return 'Monitor live streams';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <RoastIcon
            name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard & Tools Section - Role-Based */}
        {isLoadingRole ? (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.brandPrimary} />
          </View>
        ) : (userRole || isStreamModerator) ? (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <RoastIcon name="admin-dashboard" size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard & Tools</Text>
            </View>

            {userRole && (
              <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
                onPress={() => handleDashboard(userRole)}
              >
                <View style={styles.settingLeft}>
                  <RoastIcon
                    name="admin-dashboard"
                    size={20}
                    color={colors.brandPrimary}
                  />
                  <View>
                    <Text style={[styles.settingText, { color: colors.text }]}>
                      {getRoleName(userRole)}
                    </Text>
                    <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                      {getRoleDescription(userRole)}
                    </Text>
                  </View>
                </View>
                <RoastIcon
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {isStreamModerator && (
              <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
                onPress={handleStreamModeratorDashboard}
              >
                <View style={styles.settingLeft}>
                  <RoastIcon
                    name="shield"
                    size={20}
                    color="#9B59B6"
                  />
                  <View>
                    <Text style={[styles.settingText, { color: colors.text }]}>
                      Stream Moderator Dashboard
                    </Text>
                    <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                      Moderate assigned creator streams
                    </Text>
                  </View>
                </View>
                <RoastIcon
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* General Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="appearance" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AppearanceSettingsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="appearance"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Appearance</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/EditProfileScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="profile"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Profile Settings</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/NotificationSettingsScreen' as any)}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="notifications" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/SavedStreamsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="saved-streams" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Saved Streams</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AchievementsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="achievements" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Achievements</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Account & Security Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="shield" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account & Security</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AccountSecurityScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="account-security"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Account Security</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleChangePassword}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="password" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/BlockedUsersScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="blocked-users" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Blocked Users</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Streaming Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="fire-camera" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaming</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/StreamDashboardScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="stream-dashboard"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>Stream Dashboard</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Manage VIP club, moderators & more
                </Text>
              </View>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/SavedStreamsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="saved-streams" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Saved Streams</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/ArchivedStreamsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="stream-history" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Stream History</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Wallet & Gifts Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="lava-wallet" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Wallet & Gifts</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/PremiumMembershipScreen' as any)}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="premium-star-flame" size={20} />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>PREMIUM Membership</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Unlock exclusive benefits – 89 SEK/mo
                </Text>
              </View>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/WalletScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="lava-wallet" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Saldo</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/GiftInformationScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="roast-gift-box" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Gifts & Effects</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/SeasonsRankingsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="crown" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Seasons & Rankings</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/CreatorVIPDashboard')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="vip-diamond-flame" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>VIP Club</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/ManageSubscriptionsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="subscriptions" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Manage Subscriptions</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleWithdrawEarnings}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="withdraw" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Withdraw Earnings</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleTransactionHistory}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="transactions" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Transaction History</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Safety & Rules Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="shield-flame" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety & Rules</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleCommunityGuidelinesPress}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="shield-flame"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>Community Guidelines</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Review and accept guidelines
                </Text>
              </View>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/SafetyCommunityRulesScreen' as any)}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="rules"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Safety & Community Rules</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AppealsViolationsScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="appeals" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Appeals & Violations</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/TermsOfServiceScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="terms" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/PrivacyPolicyScreen')}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="privacy" size={20} />
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy Preferences Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <RoastIcon name="privacy" size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy Preferences</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]}
            onPress={handleProfileVisibilityPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <RoastIcon name="profile" size={20} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: colors.text }]}>Profile Visibility</Text>
                {isLoadingSettings ? (
                  <ActivityIndicator size="small" color={colors.brandPrimary} />
                ) : (
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    {profileVisibility === 'public' ? 'Public' : 'Private'}
                  </Text>
                )}
              </View>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleSignOut}
          >
            <View style={styles.settingLeft}>
              <RoastIcon
                name="logout"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, styles.dangerText, { color: colors.brandPrimary }]}>Logout</Text>
                {isLive && (
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    End live session first
                  </Text>
                )}
              </View>
            </View>
            <RoastIcon
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CommunityGuidelinesModal
        visible={showCommunityGuidelinesModal}
        onAccept={handleGuidelinesAccept}
        onCancel={() => setShowCommunityGuidelinesModal(false)}
        isLoading={isAcceptingGuidelines}
      />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dangerText: {
    // Color will be set dynamically
  },
});
