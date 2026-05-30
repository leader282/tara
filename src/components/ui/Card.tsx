import { type PropsWithChildren } from "react";
import { StyleSheet, type ViewStyle, View } from "react-native";

import { colors, radii, shadows, spacing } from "@/theme/tokens";

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    ...shadows.card,
  },
});
