
import React from "react";
import { Pressable, StyleSheet, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { useRouter } from 'expo-router';

// Note: The "Go Live" button has been removed from the header.
// The primary entry point for starting a live stream is the center button in the bottom navigation.

export function HeaderRightButton() {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => Alert.alert("Not Implemented", "This feature is not implemented yet")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol ios_icon_name="plus" android_material_icon_name="add" color={theme.colors.primary} />
    </Pressable>
  );
}

export function HeaderLeftButton() {
  const theme = useTheme();
  const router = useRouter();

  const handleSettingsPress = () => {
    try {
      console.log('⚙️ [HeaderButtons] Navigating to settings');
      // Navigate to account settings screen
      router.push('/screens/AccountSettingsScreen');
    } catch (error) {
      console.error('❌ [HeaderButtons] Navigation error:', error);
      Alert.alert("Error", "Failed to open settings. Please try again.");
    }
  };

  return (
    <Pressable
      onPress={handleSettingsPress}
      style={styles.headerButtonContainer}
    >
      <IconSymbol ios_icon_name="gear" android_material_icon_name="settings" color={theme.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    padding: 6,
  },
});
