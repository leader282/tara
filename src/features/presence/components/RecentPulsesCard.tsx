import { StyleSheet, View } from "react-native";

import { AppText, Card, EmptyState, LoadingState } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import { PulseTypeIcon } from "@/features/presence/components/PulseTypeIcon";
import type { RecentPresencePulse } from "@/features/presence/types";
import { formatDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type RecentPulsesCardProps = {
  pulses: RecentPresencePulse[];
  isLoading: boolean;
  currentUserId: string;
  partnerDisplayName?: string;
  errorMessage?: string | null;
  maxVisible?: number;
};

function formatRelativePulseTime(timestamp: string): string {
  const pulseDate = new Date(timestamp);
  if (Number.isNaN(pulseDate.getTime())) {
    return "Just now";
  }

  const diffMs = pulseDate.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absDiffMs < minuteMs) {
    return "Just now";
  }

  if (absDiffMs < hourMs) {
    return formatter.format(Math.round(diffMs / minuteMs), "minute");
  }

  if (absDiffMs < dayMs) {
    return formatter.format(Math.round(diffMs / hourMs), "hour");
  }

  if (absDiffMs < 7 * dayMs) {
    return formatter.format(Math.round(diffMs / dayMs), "day");
  }

  return formatDateTime(pulseDate);
}

export function RecentPulsesCard({
  pulses,
  isLoading,
  currentUserId,
  partnerDisplayName = "Partner",
  errorMessage = null,
  maxVisible = 5,
}: RecentPulsesCardProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">Recent pulses</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Small signals you&apos;ve shared lately.
          </AppText>
        </View>

        {isLoading ? <LoadingState label="Loading recent pulses..." /> : null}

        {!isLoading && pulses.length === 0 ? (
          <EmptyState
            description="Send a small signal when you want to feel close."
            title="No pulses yet"
          />
        ) : null}

        {!isLoading && pulses.length > 0 ? (
          <View style={styles.pulseList}>
            {pulses.slice(0, maxVisible).map((pulse) => {
              const pulseLabel = PRESENCE_PULSE_OPTIONS[pulse.type].label;
              const senderLabel = pulse.sender_id === currentUserId ? "You" : partnerDisplayName;
              return (
                <View key={pulse.id} style={styles.pulseItem}>
                  <View style={styles.pulseMeta}>
                    <PulseTypeIcon compact type={pulse.type} />
                    <View style={styles.pulseText}>
                      <AppText variant="body">
                        {senderLabel} sent {pulseLabel.toLowerCase()}
                      </AppText>
                      <AppText color="textSecondary" variant="caption">
                        {formatRelativePulseTime(pulse.created_at)}
                      </AppText>
                    </View>
                  </View>
                  {pulse.optional_message ? (
                    <AppText color="textSecondary" variant="bodyMuted">
                      {pulse.optional_message}
                    </AppText>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {errorMessage ? (
          <AppText color="danger" variant="caption">
            {errorMessage}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  pulseList: {
    gap: spacing.md,
  },
  pulseItem: {
    gap: spacing.xs,
  },
  pulseMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pulseText: {
    gap: spacing.xs,
  },
});
