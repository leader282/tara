import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { PulseTypeIcon } from "@/features/presence/components/PulseTypeIcon";
import type { PresencePulseOption, PresencePulseType } from "@/features/presence/types";
import { colors, radii, spacing } from "@/theme/tokens";

type PresencePulseButtonProps = {
  option: PresencePulseOption;
  selected: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress: (type: PresencePulseType) => void;
};

export function PresencePulseButton({
  option,
  selected,
  disabled = false,
  loading = false,
  onPress,
}: PresencePulseButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={option.accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => onPress(option.type)}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.selectedButton : null,
        pressed ? styles.pressedButton : null,
        isDisabled ? styles.disabledButton : null,
      ]}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <PulseTypeIcon compact type={option.type} />
        )}
        <AppText variant="body">{option.shortLabel}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: "48%",
  },
  selectedButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pressedButton: {
    opacity: 0.85,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
});
