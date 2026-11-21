import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui";
import { PulseTypeIcon } from "@/features/presence/components/PulseTypeIcon";
import type { PresencePulseOption, PresencePulseType } from "@/features/presence/types";
import { colors, radii, spacing } from "@/theme/tokens";

type PresencePulseButtonProps = {
  option: PresencePulseOption;
  selected: boolean;
  disabled?: boolean;
  onPress: (type: PresencePulseType) => void;
};

export function PresencePulseButton({
  option,
  selected,
  disabled = false,
  onPress,
}: PresencePulseButtonProps) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!selected) {
      return;
    }

    scale.setValue(0.9);
    Animated.spring(scale, {
      toValue: 1,
      damping: 8,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  return (
    <Pressable
      accessibilityLabel={option.accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onPress(option.type)}
      style={({ pressed }) => [
        styles.tile,
        selected ? { backgroundColor: option.tint, borderColor: option.accent } : null,
        pressed && !selected ? styles.tilePressed : null,
        disabled && !selected ? styles.tileDisabled : null,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <PulseTypeIcon size={44} surface={selected} type={option.type} />
      </Animated.View>
      <AppText
        align="center"
        color={selected ? "textPrimary" : "textSecondary"}
        numberOfLines={1}
        style={styles.label}
        variant={selected ? "label" : "caption"}
      >
        {option.shortLabel}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  tilePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  tileDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
