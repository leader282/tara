import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, type ColorName } from "@/theme/tokens";

type IconButtonVariant = "plain" | "tonal" | "surface" | "inverse";

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  variant?: IconButtonVariant;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const backgroundByVariant: Record<IconButtonVariant, string> = {
  plain: "transparent",
  tonal: colors.primarySoft,
  surface: colors.surface,
  inverse: "rgba(255, 255, 255, 0.16)",
};

const pressedBackgroundByVariant: Record<IconButtonVariant, string> = {
  plain: colors.surfaceMuted,
  tonal: "#F1D7D1",
  surface: colors.surfaceMuted,
  inverse: "rgba(255, 255, 255, 0.28)",
};

const iconColorByVariant: Record<IconButtonVariant, ColorName> = {
  plain: "textPrimary",
  tonal: "primaryStrong",
  surface: "textPrimary",
  inverse: "inkText",
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = "plain",
  size = 44,
  iconSize = 22,
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? pressedBackgroundByVariant[variant] : backgroundByVariant[variant],
          height: size,
          width: size,
        },
        variant === "surface" ? styles.surface : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      testID={testID}
    >
      <Icon color={iconColorByVariant[variant]} name={icon} size={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
  },
  surface: {
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.45,
  },
});
