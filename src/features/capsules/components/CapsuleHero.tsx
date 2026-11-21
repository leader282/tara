import { StyleSheet, View } from "react-native";

import { AppText, Badge } from "@/components/ui";
import type { MemoryCapsule } from "@/features/capsules/types";
import { formatCapsuleCountdown, formatUnlockDateTime } from "@/lib/dates/format";
import { colors, gradients, radii, shadows, spacing } from "@/theme/tokens";

type CapsuleHeroProps = {
  capsule: MemoryCapsule;
  emoji: string;
};

export function CapsuleHero({ capsule, emoji }: CapsuleHeroProps) {
  const unlockLabel = formatUnlockDateTime(capsule.unlock_at) ?? "Unlock date unavailable";
  const countdownLabel = formatCapsuleCountdown(capsule.unlock_at, capsule.opened_at);

  return (
    <View style={styles.hero}>
      <View style={styles.emojiWell}>
        <AppText style={styles.emoji}>{emoji}</AppText>
      </View>
      <View style={styles.copy}>
        <AppText align="center" variant="headline">
          {capsule.title}
        </AppText>
        {capsule.emotional_context ? (
          <AppText align="center" color="textSecondary" variant="bodyMuted">
            &ldquo;{capsule.emotional_context}&rdquo;
          </AppText>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Badge icon="calendar-outline" label={unlockLabel} />
        <Badge icon="hourglass-outline" label={countdownLabel} tone="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    experimental_backgroundImage: gradients.dawn,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    ...shadows.card,
  },
  emojiWell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 76,
    justifyContent: "center",
    width: 76,
    ...shadows.card,
  },
  emoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
});
