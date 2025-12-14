
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { StreamingProvider } from "@/contexts/StreamingContext";
import { LiveStreamStateProvider } from "@/contexts/LiveStreamStateMachine";
import { VIPClubProvider } from "@/contexts/VIPClubContext";
import { ModeratorsProvider } from "@/contexts/ModeratorsContext";
import { CameraEffectsProvider } from "@/contexts/CameraEffectsContext";
import ErrorBoundary from "@/components/ErrorBoundary";

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

  React.useEffect(() => {
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

  // FIX ISSUE 1: Validate all providers are defined
  useEffect(() => {
    console.log('🚀 iOS App initialized');
    
    const providers = {
      AuthProvider,
      StreamingProvider,
      LiveStreamStateProvider,
      VIPClubProvider,
      ModeratorsProvider,
      CameraEffectsProvider,
      WidgetProvider,
    };
    
    Object.entries(providers).forEach(([name, provider]) => {
      if (typeof provider === 'undefined') {
        console.error(`❌ CRITICAL: ${name} is undefined!`);
        throw new Error(`Provider ${name} is undefined. Check export/import syntax.`);
      } else {
        console.log(`✅ ${name} is defined`);
      }
    });
  }, []);

  if (!loaded) {
    return null;
  }

  const navigationTheme: Theme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      primary: colors.brandPrimary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.brandPrimary,
    },
  } : {
    ...DefaultTheme,
    colors: {
      primary: colors.brandPrimary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.brandPrimary,
    },
  };

  return (
    <ErrorBoundary>
      <StatusBar style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} animated />
      <NavigationThemeProvider value={navigationTheme}>
        <AuthProvider>
          <StreamingProvider>
            <LiveStreamStateProvider>
              <VIPClubProvider>
                <ModeratorsProvider>
                  <CameraEffectsProvider>
                    <WidgetProvider>
                      <GestureHandlerRootView>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.background },
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
                          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                          <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
                          <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal' }} />
                        </Stack>
                        <SystemBars style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} />
                      </GestureHandlerRootView>
                    </WidgetProvider>
                  </CameraEffectsProvider>
                </ModeratorsProvider>
              </VIPClubProvider>
            </LiveStreamStateProvider>
          </StreamingProvider>
        </AuthProvider>
      </NavigationThemeProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
