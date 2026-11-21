import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue, StyleProp, TextStyle } from "react-native";

import { colors, type ColorName } from "@/theme/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorName;
  tintColor?: ColorValue;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 20, color = "textPrimary", tintColor, style }: IconProps) {
  return (
    <Ionicons
      accessibilityElementsHidden
      color={tintColor ?? colors[color]}
      importantForAccessibility="no-hide-descendants"
      name={name}
      size={size}
      style={style}
    />
  );
}
