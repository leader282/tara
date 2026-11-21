import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, shadows, spacing, type ColorName } from "@/theme/tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerSoft"
  | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const backgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.secondary,
  outline: colors.surface,
  ghost: "transparent",
  danger: colors.danger,
  dangerSoft: colors.dangerSoft,
  inverse: "rgba(255, 255, 255, 0.16)",
};

const pressedBackgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.primaryPressed,
  secondary: colors.secondaryPressed,
  outline: colors.surfaceMuted,
  ghost: colors.surfaceMuted,
  danger: colors.dangerPressed,
  dangerSoft: "#F6D9D5",
  inverse: "rgba(255, 255, 255, 0.28)",
};

const textColorByVariant: Record<ButtonVariant, ColorName> = {
  primary: "textInverse",
  secondary: "textPrimary",
  outline: "textPrimary",
  ghost: "textSecondary",
  danger: "textInverse",
  dangerSoft: "danger",
  inverse: "inkText",
};

const heightBySize: Record<ButtonSize, number> = {
  sm: 38,
  md: 46,
  lg: 52,
};

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const [scale] = useState(() => new Animated.Value(1));
  const textColor = textColorByVariant[variant];
  const iconSize = size === "sm" ? 16 : 18;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => animateScale(0.97)}
        onPressOut={() => animateScale(1)}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: pressed
              ? pressedBackgroundByVariant[variant]
              : backgroundByVariant[variant],
            minHeight: heightBySize[size],
            paddingHorizontal: size === "sm" ? spacing.md : spacing.lg,
          },
          variant === "primary" && !isDisabled ? shadows.primary : null,
          variant === "outline" ? styles.outline : null,
          variant === "inverse" ? styles.inverse : null,
          isDisabled ? styles.disabled : null,
        ]}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "primary" || variant === "danger" || variant === "inverse"
                ? colors.textInverse
                : colors.primary
            }
            size="small"
          />
        ) : (
          <View style={styles.content}>
            {icon ? <Icon color={textColor} name={icon} size={iconSize} /> : null}
            <AppText
              align="center"
              color={textColor}
              style={size === "sm" ? styles.smallLabel : null}
              variant="button"
            >
              {title}
            </AppText>
            {iconRight ? <Icon color={textColor} name={iconRight} size={iconSize} /> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  outline: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  inverse: {
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderWidth: 1,
  },
  smallLabel: {
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
