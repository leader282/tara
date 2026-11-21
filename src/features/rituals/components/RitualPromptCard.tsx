import { StyleSheet, View } from "react-native";

import { AppText, Badge, Icon, type IconName } from "@/components/ui";
import { RITUAL_CATEGORY_LABELS } from "@/features/rituals/constants";
import { toCanonicalRitualDay } from "@/features/rituals/schemas";
import type { CoupleRitual, RitualTemplate } from "@/features/rituals/types";
import { formatDateOnly } from "@/lib/dates/format";
import { colors, gradients, radii, shadows, spacing } from "@/theme/tokens";

type RitualPromptCardProps = {
  coupleRitual: CoupleRitual;
  template: RitualTemplate;
  heading?: string;
};

function getInputTypePresentation(inputType: string): { label: string; icon: IconName } {
  if (inputType === "text_or_photo") {
    return { label: "Words, photos, or a video", icon: "images-outline" };
  }

  if (inputType === "photo") {
    return { label: "Photos or a video", icon: "camera-outline" };
  }

  return { label: "A few words", icon: "create-outline" };
}

// The answers below show where the ritual stands, so the card only carries the prompt.
export function RitualPromptCard({
  coupleRitual,
  template,
  heading = "Today's ritual",
}: RitualPromptCardProps) {
  const isToday = coupleRitual.scheduled_for === toCanonicalRitualDay();
  const scheduledDateLabel = isToday ? null : formatDateOnly(coupleRitual.scheduled_for);
  const inputType = getInputTypePresentation(template.input_type);

  return (
    <View style={styles.card}>
      <AppText color="primaryStrong" variant="overline">
        {heading}
      </AppText>

      <View style={styles.content}>
        <AppText variant="headline">{template.title}</AppText>
        {template.description ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {template.description}
          </AppText>
        ) : null}
        {template.category === "parallel_moment" ? (
          <AppText color="textSecondary" variant="bodyMuted">
            A small moment you both answer from where you are.
          </AppText>
        ) : null}
      </View>

      <View style={styles.promptBlock}>
        <Icon color="primary" name="chatbubble-ellipses-outline" size={18} />
        <AppText style={styles.prompt} variant="subtitle">
          {template.prompt}
        </AppText>
      </View>

      <View style={styles.meta}>
        <Badge label={RITUAL_CATEGORY_LABELS[template.category]} tone="primary" />
        <Badge icon={inputType.icon} label={inputType.label} />
        {scheduledDateLabel ? <Badge icon="calendar-outline" label={scheduledDateLabel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    experimental_backgroundImage: gradients.dawn,
    gap: spacing.lg,
    padding: 20,
    ...shadows.card,
  },
  content: {
    gap: spacing.xs,
  },
  promptBlock: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  prompt: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
