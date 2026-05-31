import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
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
      <AppText color="textSecondary" variant="caption">
        {meetupLabel ? `Next meetup: ${meetupLabel}.` : "Your reunion countdown was updated."}
      </AppText>
      <AppText color="textSecondary" variant="caption">
        {hasLocation ? "Location details were updated." : "No location set for this update."}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
