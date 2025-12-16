
// This file is a fallback for using Ionicons on Android and web.

import React from "react";
import { SymbolWeight } from "expo-symbols";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * An icon component that uses native SFSymbols on iOS, and Ionicons on Android and web. 
 * This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to Ionicons.
 */
export function IconSymbol({
  ios_icon_name = undefined,
  android_material_icon_name,
  size = 24,
  color,
  style,
}: {
  ios_icon_name?: string | undefined;
  android_material_icon_name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Validate that the icon name exists in Ionicons
  if (!Ionicons.glyphMap[android_material_icon_name]) {
    console.warn(`⚠️ IconSymbol: Invalid android_material_icon_name "${android_material_icon_name}"`);
    // Fallback to a safe default icon
    return (
      <Ionicons
        color={color}
        size={size}
        name="help-circle-outline"
        style={style as StyleProp<TextStyle>}
      />
    );
  }

  return (
    <Ionicons
      color={color}
      size={size}
      name={android_material_icon_name}
      style={style as StyleProp<TextStyle>}
    />
  );
}
