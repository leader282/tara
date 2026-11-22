import { StyleSheet, View } from "react-native";

import { TimelineMetaLine } from "@/features/timeline/components/TimelineMetaLine";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { formatMeetupDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type TimelineCountdownItemProps = {
  item: TimelineDisplayItem;
};

export function TimelineCountdownItem({ item }: TimelineCountdownItemProps) {
  if (item.payload.type !== "countdown_updated") {
    return null;
  }

  const meetupLabel = formatMeetupDateTime(item.payload.value.next_meetup_at ?? null);
  const hasLocation =
    item.payload.value.has_location === true ||
    Boolean(item.payload.value.next_meetup_location?.trim());

  return (
    <View style={styles.container}>
      <TimelineMetaLine
        icon="calendar-outline"
        label={meetupLabel ? `Next meetup: ${meetupLabel}.` : "The meetup was cleared."}
      />
      {hasLocation ? <TimelineMetaLine icon="location-outline" label="Includes a place." /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
