import { TimelineMetaLine } from "@/features/timeline/components/TimelineMetaLine";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { formatDateOnly } from "@/lib/dates/format";

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

  return (
    <TimelineMetaLine
      icon="checkmark-done"
      label={
        scheduledDateLabel ? `Completed for ${scheduledDateLabel}.` : "A shared ritual was completed."
      }
    />
  );
}
