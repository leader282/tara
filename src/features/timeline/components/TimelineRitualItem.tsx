import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
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

  const scheduledDateLabel = item.payload.value.scheduled_for
    ? formatDateOnly(item.payload.value.scheduled_for)
    : null;
  const hasDetailTarget = Boolean(item.payload.value.couple_ritual_id);

  return (
    <View style={styles.container}>
      <AppText color="textSecondary" variant="caption">
        {scheduledDateLabel
          ? `Completed for ${scheduledDateLabel}.`
          : "A shared ritual was completed."}
      </AppText>
      {hasDetailTarget ? (
        <AppText color="textSecondary" variant="caption">
          Tap to open ritual details.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
