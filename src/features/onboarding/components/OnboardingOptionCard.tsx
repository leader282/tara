import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type OnboardingOptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function OnboardingOptionCard({
  label,
  description,
  selected,
  onPress,
  accessibilityLabel,
}: OnboardingOptionCardProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.content}>
        <AppText variant="body">{label}</AppText>
        {description ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {description}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <AppText color="primary" variant="caption">
          Selected
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.85,
  },
  content: {
    gap: spacing.xs,
  },
});
