import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import { formatMeetupDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type NextMeetupCardProps = {
  nextMeetupAt: string | null;
  nextMeetupLocation: string | null;
  onEditMeetup: () => void;
};

function getLocationLabel(nextMeetupLocation: string | null): string {
  if (!nextMeetupLocation?.trim()) {
    return "Location not added yet";
  }

  return nextMeetupLocation.trim();
}

export function NextMeetupCard({
  nextMeetupAt,
  nextMeetupLocation,
  onEditMeetup,
}: NextMeetupCardProps) {
  const formattedDate = formatMeetupDateTime(nextMeetupAt);

  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="subtitle">Next meetup</AppText>
        {formattedDate ? (
          <>
            <AppText accessibilityLabel="Next meetup date and time" variant="body">
              {formattedDate}
            </AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              {getLocationLabel(nextMeetupLocation)}
            </AppText>
          </>
        ) : (
          <AppText color="textSecondary" variant="bodyMuted">
            Add your next reunion date.
          </AppText>
        )}
        <Button onPress={onEditMeetup} title={formattedDate ? "Edit meetup" : "Add meetup"} variant="secondary" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
