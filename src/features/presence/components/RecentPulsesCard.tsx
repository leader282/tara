import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card, EmptyState, LoadingState } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS, RECENT_PULSE_WINDOW_MS } from "@/features/presence/constants";
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

const REFRESH_INTERVAL_MS = 60_000;

function formatRelativeUnit(value: number, unit: "minute" | "hour" | "day"): string {
  const absoluteValue = Math.abs(value);
  const label = absoluteValue === 1 ? unit : `${unit}s`;
  const suffix = value < 0 ? "ago" : "from now";

  return `${absoluteValue} ${label} ${suffix}`;
}

function formatRelativePulseTime(timestamp: string, now: number): string {
  const pulseDate = new Date(timestamp);
  if (Number.isNaN(pulseDate.getTime())) {
    return "Just now";
  }

  const diffMs = pulseDate.getTime() - now;
  const absDiffMs = Math.abs(diffMs);
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (absDiffMs < minuteMs) {
    return "Just now";
  }

  if (absDiffMs < hourMs) {
    return formatRelativeUnit(Math.round(diffMs / minuteMs), "minute");
  }

  if (absDiffMs < dayMs) {
    return formatRelativeUnit(Math.round(diffMs / hourMs), "hour");
  }

  if (absDiffMs < 7 * dayMs) {
    return formatRelativeUnit(Math.round(diffMs / dayMs), "day");
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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const visiblePulses = pulses.filter(
    (pulse) => now - new Date(pulse.created_at).getTime() < RECENT_PULSE_WINDOW_MS,
  );

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">Recent pulses</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Small signals from the last hour.
          </AppText>
        </View>

        {isLoading ? <LoadingState label="Loading recent pulses..." /> : null}

        {!isLoading && visiblePulses.length === 0 ? (
          <EmptyState
            description="Send a small signal when you want to feel close."
            title="No pulses in the last hour"
          />
        ) : null}

        {!isLoading && visiblePulses.length > 0 ? (
          <View style={styles.pulseList}>
            {visiblePulses.slice(0, maxVisible).map((pulse) => {
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
                        {formatRelativePulseTime(pulse.created_at, now)}
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
