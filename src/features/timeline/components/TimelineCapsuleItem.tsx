import { StyleSheet, View } from "react-native";

import { TimelineMetaLine } from "@/features/timeline/components/TimelineMetaLine";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { formatTimelineDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type TimelineCapsuleItemProps = {
  item: TimelineDisplayItem;
};

export function TimelineCapsuleItem({ item }: TimelineCapsuleItemProps) {
  if (item.payload.type !== "capsule_created" && item.payload.type !== "capsule_opened") {
    return null;
  }

  if (item.payload.type === "capsule_created") {
    const unlockLabel = formatTimelineDateTime(item.payload.value.unlock_at);
    const hasNote = item.payload.value.has_note === true;
    const hasMedia = item.payload.value.has_media === true;

    return (
      <View style={styles.container}>
        <TimelineMetaLine
          icon="lock-closed-outline"
          label={unlockLabel ? `Unlocks ${unlockLabel}.` : "Saved to open later."}
        />
        {hasNote ? <TimelineMetaLine icon="document-text-outline" label="Includes a private note." /> : null}
        {hasMedia ? <TimelineMetaLine icon="image-outline" label="Includes photos or videos." /> : null}
      </View>
    );
  }

  // The card's own time is when it was opened.
  const unlockLabel = formatTimelineDateTime(item.payload.value.unlock_at);
  return unlockLabel ? <TimelineMetaLine icon="time-outline" label={`Was set to open ${unlockLabel}.`} /> : null;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
