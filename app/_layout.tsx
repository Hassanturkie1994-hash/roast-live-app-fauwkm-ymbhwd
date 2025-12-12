
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
