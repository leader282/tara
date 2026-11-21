import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { colors, radii, spacing } from "@/theme/tokens";

type OptionCardProps = {
  label: string;
  description?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  indicator?: "radio" | "check";
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function OptionCard({
  label,
  description,
  emoji,
  selected,
  onPress,
  indicator = "radio",
  accessibilityLabel,
  disabled = false,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole={indicator === "check" ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected, disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed ? styles.cardPressed : null,
        disabled ? styles.cardDisabled : null,
      ]}
    >
      {emoji ? (
        <View style={[styles.emojiWell, selected ? styles.emojiWellSelected : null]}>
          <AppText style={styles.emoji}>{emoji}</AppText>
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText style={styles.label} variant="label">
          {label}
        </AppText>
        {description ? (
          <AppText color="textSecondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          indicator === "check" ? styles.checkbox : styles.radio,
          selected ? styles.indicatorSelected : null,
        ]}
      >
        {selected ? (
          indicator === "check" ? (
            <Icon color="textInverse" name="checkmark" size={14} />
          ) : (
            <View style={styles.radioDot} />
          )
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    backgroundColor: "#FDF5F3",
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  emojiWell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emojiWellSelected: {
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  indicatorSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioDot: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
});
