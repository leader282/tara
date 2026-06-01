import { StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

type NotificationPreferenceToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function NotificationPreferenceToggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: NotificationPreferenceToggleProps) {
  return (
    <View style={[styles.container, disabled ? styles.disabled : null]}>
      <View style={styles.copy}>
        <AppText variant="subtitle">{label}</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          {description}
        </AppText>
      </View>

      <Switch
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? colors.primary : "#FFFFFF"}
        trackColor={{
          false: colors.border,
          true: colors.secondaryPressed,
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
});
