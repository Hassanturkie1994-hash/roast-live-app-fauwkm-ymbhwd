
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert, LogBox } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { initializeServices } from "@/app/services/serviceRegistry";

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'WebRTC native module not found',
  'Notifications.removeNotificationSubscription',
  'Each child in a list should have a unique "key" prop',
]);

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutContent() {
  const { colors, theme } = useTheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      // Initialize services on app startup
      initializeServices().catch((error) => {
        console.error('Failed to initialize services:', error);
      });
      
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const navigationTheme: Theme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      primary: colors.brandPrimary || '#A40028',
      background: colors.background || '#000000',
      card: colors.card || '#161616',
      text: colors.text || '#FFFFFF',
      border: colors.border || '#2A2A2A',
      notification: colors.brandPrimary || '#A40028',
    },
  } : {
    ...DefaultTheme,
    colors: {
      primary: colors.brandPrimary || '#A40028',
      background: colors.background || '#FFFFFF',
      card: colors.card || '#FBFBFB',
      text: colors.text || '#000000',
      border: colors.border || '#D4D4D4',
      notification: colors.brandPrimary || '#A40028',
    },
  };

  return (
    <>
      <StatusBar style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} animated />
      <NavigationThemeProvider value={navigationTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <WidgetProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background || '#FFFFFF' },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                <Stack.Screen
                  name="live-player"
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                
                {/* All Screen Routes */}
                <Stack.Screen name="screens/AccessRestrictedScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AccountSecurityScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AccountSettingsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AchievementsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AddBalanceScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminAIModerationScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminAnalyticsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminAnnouncementsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminAppealsReviewScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminBanAppealsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminDashboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminEscalationQueueScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminLiveStreamsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminMessagingScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminPayoutPanelScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminPenaltiesScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminPushNotificationsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminReportsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminStrikesScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AdminSuspensionsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AppealsCenterScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AppealsViolationsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/AppearanceSettingsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ArchivedStreamsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/BlockedUsersScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/BroadcasterScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ChangePasswordScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ChatScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/CreatePostScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/CreateStoryScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/CreatorClubSetupScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/CreatorEarningsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/EditProfileScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/FanClubManagementScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/GiftInformationScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/HeadAdminDashboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/LeaderboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ManageSubscriptionsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ModeratorDashboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ModeratorReviewQueueScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/NotificationSettingsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/PerformanceGrowthScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/PremiumMembershipScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/PrivacyPolicyScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/PublicProfileScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ReplayPlayerScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ReplaysTabScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/RetentionAnalyticsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/RoleManagementScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/SafetyCommunityRulesScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/SavedStreamsScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/SearchScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ServiceHealthScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/StoryViewerScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/StreamDashboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/StreamRevenueScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/SupportDashboardScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/TermsOfServiceScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/TransactionHistoryScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ViewerScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/WalletScreen" options={{ headerShown: false }} />
                <Stack.Screen name="screens/WithdrawScreen" options={{ headerShown: false }} />
              </Stack>
            </WidgetProvider>
          </AuthProvider>
          <SystemBars style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} />
        </GestureHandlerRootView>
      </NavigationThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
