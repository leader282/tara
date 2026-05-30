import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, EmptyState } from "@/components/ui";
import { formatReunionCountdown, getCountdownParts } from "@/lib/dates/countdown";
import { formatMeetupDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type ReunionCountdownCardProps = {
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

export function ReunionCountdownCard({
  nextMeetupAt,
  nextMeetupLocation,
  onEditMeetup,
}: ReunionCountdownCardProps) {
  if (!nextMeetupAt) {
    return (
      <Card>
        <EmptyState
          actionLabel="Set reunion date"
          description="Add your next reunion so both of you can hold the anticipation together."
          onActionPress={onEditMeetup}
          title="No reunion date yet"
        />
      </Card>
    );
  }

  const reunionDate = new Date(nextMeetupAt);
  if (Number.isNaN(reunionDate.getTime())) {
    return (
      <Card>
        <EmptyState
          actionLabel="Update reunion date"
          description="We couldn't read your current meetup date. Set it again to keep your countdown clear."
          onActionPress={onEditMeetup}
          title="Reunion date needs an update"
        />
      </Card>
    );
  }

  const countdownParts = getCountdownParts(reunionDate);
  const formattedDate = formatMeetupDateTime(nextMeetupAt);

  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="subtitle">Reunion countdown</AppText>
        <AppText accessibilityLabel="Reunion countdown" variant="title">
          {formatReunionCountdown(reunionDate)}
        </AppText>
        {formattedDate ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {formattedDate}
          </AppText>
        ) : null}
        <AppText color="textSecondary" variant="bodyMuted">
          {getLocationLabel(nextMeetupLocation)}
        </AppText>
        {countdownParts.status === "past" ? (
          <View style={styles.action}>
            <AppText color="textSecondary" variant="bodyMuted">
              This date has passed. Set the next reunion whenever you&apos;re ready.
            </AppText>
            <Button onPress={onEditMeetup} title="Update reunion date" variant="secondary" />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  action: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
