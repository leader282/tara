import { type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, shadows, spacing } from "@/theme/tokens";

export type CardVariant = "elevated" | "outlined" | "muted";
export type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}>;

const paddingBySize: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: 20,
};

export function Card({
  children,
  style,
  variant = "elevated",
  padding = "lg",
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: CardProps) {
  const cardStyle = [
    styles.card,
    variantStyles[variant],
    { padding: paddingBySize[padding] },
    style,
  ];

  if (!onPress) {
    // A labelled card that can't be tapped is read out as one item.
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessible={accessibilityLabel ? true : undefined}
        style={cardStyle}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});

const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.card,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
});
