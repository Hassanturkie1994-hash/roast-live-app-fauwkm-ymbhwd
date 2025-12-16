
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  ios_icon_name?: SymbolViewProps["name"];
  android_material_icon_name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Validate android fallback icon
  const validAndroidIcon = Ionicons.glyphMap[android_material_icon_name] 
    ? android_material_icon_name 
    : "help-circle-outline";

  if (!Ionicons.glyphMap[android_material_icon_name]) {
    console.warn(`⚠️ IconSymbol: Invalid android_material_icon_name "${android_material_icon_name}"`);
  }

  // If ios_icon_name is provided and valid, use SF Symbols
  // Otherwise fall back to Ionicons
  if (ios_icon_name) {
    return (
      <SymbolView
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={ios_icon_name}
        style={[
          {
            width: size,
            height: size,
          },
          style,
        ]}
        fallback={
          <Ionicons
            name={validAndroidIcon}
            size={size}
            color={color}
            style={style as any}
          />
        }
      />
    );
  }

  // Use Ionicons as fallback
  return (
    <Ionicons
      name={validAndroidIcon}
      size={size}
      color={color}
      style={style as any}
    />
  );
}
