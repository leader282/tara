import { StyleSheet, View } from "react-native";

import { AppText, Badge, Icon, type IconName } from "@/components/ui";
import { RitualStatusBadge } from "@/features/rituals/components/RitualStatusBadge";
import type { CoupleRitual, RitualTemplate } from "@/features/rituals/types";
import { formatDateOnly } from "@/lib/dates/format";
import { colors, gradients, radii, shadows, spacing } from "@/theme/tokens";

type RitualPromptCardProps = {
  coupleRitual: CoupleRitual;
  template: RitualTemplate;
  heading?: string;
};

function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getInputTypePresentation(inputType: string): { label: string; icon: IconName } {
  if (inputType === "text_or_photo") {
    return { label: "Words or a photo", icon: "images-outline" };
  }

  if (inputType === "photo") {
    return { label: "A photo", icon: "camera-outline" };
  }

  return { label: "A few words", icon: "create-outline" };
}

export function RitualPromptCard({
  coupleRitual,
  template,
  heading = "Today's ritual",
}: RitualPromptCardProps) {
  const scheduledDateLabel = formatDateOnly(coupleRitual.scheduled_for);
  const inputType = getInputTypePresentation(template.input_type);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText color="primaryStrong" style={styles.heading} variant="overline">
          {heading}
        </AppText>
        <RitualStatusBadge status={coupleRitual.status} />
      </View>

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
        <Badge label={formatCategoryLabel(template.category)} tone="primary" />
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  heading: {
    flex: 1,
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
