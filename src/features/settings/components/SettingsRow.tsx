import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

type SettingsRowProps = {
  title: string;
  description?: string;
  secondaryText?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  title,
  description,
  secondaryText,
  disabled = false,
  onPress,
}: SettingsRowProps) {
  const isInteractive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole={isInteractive ? "button" : undefined}
      accessibilityState={{ disabled }}
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [styles.row, disabled ? styles.rowDisabled : null, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.textContainer}>
        <AppText variant="body">{title}</AppText>
        {description ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {description}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {secondaryText ? (
          <AppText color="textSecondary" variant="caption">
            {secondaryText}
          </AppText>
        ) : null}
        {isInteractive ? (
          <AppText color="textSecondary" variant="body">
            {">"}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  trailing: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
});
