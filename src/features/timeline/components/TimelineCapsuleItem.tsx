import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
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

  const hasDetailTarget = Boolean(item.payload.value.capsule_id);

  if (item.payload.type === "capsule_created") {
    const unlockLabel = formatTimelineDateTime(item.payload.value.unlock_at);
    const hasNote = item.payload.value.has_note === true;
    const hasMedia = item.payload.value.has_media === true;

    return (
      <View style={styles.container}>
        <AppText color="textSecondary" variant="caption">
          {unlockLabel ? `Unlocks ${unlockLabel}.` : "Saved to open later."}
        </AppText>
        {hasNote ? (
          <AppText color="textSecondary" variant="caption">
            Includes a private note.
          </AppText>
        ) : null}
        {hasMedia ? (
          <AppText color="textSecondary" variant="caption">
            Includes media.
          </AppText>
        ) : null}
        {hasDetailTarget ? (
          <AppText color="textSecondary" variant="caption">
            Tap to open capsule details.
          </AppText>
        ) : null}
      </View>
    );
  }

  const openedLabel = formatTimelineDateTime(item.payload.value.opened_at);
  const unlockLabel = formatTimelineDateTime(item.payload.value.unlock_at);

  return (
    <View style={styles.container}>
      <AppText color="textSecondary" variant="caption">
        {openedLabel ? `Opened ${openedLabel}.` : "A capsule was opened."}
      </AppText>
      {unlockLabel ? (
        <AppText color="textSecondary" variant="caption">
          Unlock time was {unlockLabel}.
        </AppText>
      ) : null}
      {hasDetailTarget ? (
        <AppText color="textSecondary" variant="caption">
          Tap to open capsule details.
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
