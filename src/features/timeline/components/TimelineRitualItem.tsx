import { StyleSheet, View } from "react-native";

import { normalizeRitualCategory, RITUAL_CATEGORY_LABELS } from "@/features/rituals/constants";
import { TimelineMetaLine } from "@/features/timeline/components/TimelineMetaLine";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { formatDateOnly } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type TimelineRitualItemProps = {
  item: TimelineDisplayItem;
};

export function TimelineRitualItem({ item }: TimelineRitualItemProps) {
  if (item.payload.type !== "ritual_completed") {
    return null;
  }

  const { category, scheduled_for: scheduledFor } = item.payload.value;
  // The card's own time already says when; only mention the ritual's day if it was another one.
  const isForAnotherDay = Boolean(scheduledFor) && scheduledFor !== item.createdAt.slice(0, 10);
  const scheduledLabel = isForAnotherDay ? formatDateOnly(scheduledFor) : null;

  if (!category && !scheduledLabel) {
    return null;
  }

  return (
    <View style={styles.container}>
      {category ? (
        <TimelineMetaLine icon="sparkles-outline" label={RITUAL_CATEGORY_LABELS[normalizeRitualCategory(category)]} />
      ) : null}
      {scheduledLabel ? <TimelineMetaLine icon="calendar-outline" label={`For ${scheduledLabel}`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
