import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, radii, spacing } from "@/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const backgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.secondary,
  ghost: "transparent",
  danger: colors.danger,
};

const pressedBackgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.primaryPressed,
  secondary: colors.secondaryPressed,
  ghost: colors.surfaceMuted,
  danger: "#A33D31",
};

const textColorByVariant: Record<ButtonVariant, keyof typeof colors> = {
  primary: "textInverse",
  secondary: "textPrimary",
  ghost: "textSecondary",
  danger: "textInverse",
};

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed
            ? pressedBackgroundByVariant[variant]
            : backgroundByVariant[variant],
        },
        variant === "ghost" ? styles.ghost : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" || variant === "danger" ? colors.textInverse : colors.textPrimary}
            size="small"
          />
        ) : (
          <AppText color={textColorByVariant[variant]} variant="body">
            {title}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  ghost: {
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.55,
  },
});
