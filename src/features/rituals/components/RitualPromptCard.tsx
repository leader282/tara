import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { RitualStatusBadge } from "@/features/rituals/components/RitualStatusBadge";
import type { CoupleRitual, RitualTemplate } from "@/features/rituals/types";
import { formatDateOnly } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

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

function formatInputTypeLabel(inputType: string): string {
  if (inputType === "text_or_photo") {
    return "Text or photo";
  }

  if (inputType === "photo") {
    return "Photo";
  }

  return "Text";
}

export function RitualPromptCard({
  coupleRitual,
  template,
  heading = "Today's ritual",
}: RitualPromptCardProps) {
  const scheduledDateLabel = formatDateOnly(coupleRitual.scheduled_for);

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText color="textSecondary" variant="caption">
            {heading}
          </AppText>
          <RitualStatusBadge status={coupleRitual.status} />
        </View>

        <View style={styles.content}>
          <AppText variant="subtitle">{template.title}</AppText>
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
          <AppText color="textSecondary" variant="caption">
            Prompt
          </AppText>
          <AppText variant="body">{template.prompt}</AppText>
        </View>

        <View style={styles.meta}>
          <AppText color="textSecondary" variant="caption">
            {formatCategoryLabel(template.category)}
          </AppText>
          <AppText color="textSecondary" variant="caption">
            {formatInputTypeLabel(template.input_type)}
          </AppText>
          {scheduledDateLabel ? (
            <AppText color="textSecondary" variant="caption">
              {scheduledDateLabel}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  content: {
    gap: spacing.xs,
  },
  promptBlock: {
    gap: spacing.xs,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
