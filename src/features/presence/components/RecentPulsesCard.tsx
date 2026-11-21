import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card, Divider, EmptyState, InlineMessage, SectionHeader, Skeleton } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS, RECENT_PULSE_WINDOW_MS } from "@/features/presence/constants";
import { PulseTypeIcon } from "@/features/presence/components/PulseTypeIcon";
import type { RecentPresencePulse } from "@/features/presence/types";
import { formatDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

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

  const visiblePulses = pulses
    .filter((pulse) => now - new Date(pulse.created_at).getTime() < RECENT_PULSE_WINDOW_MS)
    .slice(0, maxVisible);

  return (
    <Card>
      <View style={styles.container}>
        <SectionHeader description="Small signals from the last hour." title="Recent pulses" />

        {isLoading ? (
          <View style={styles.list}>
            {[0, 1].map((key) => (
              <View key={key} style={styles.skeletonRow}>
                <Skeleton height={40} radius={radii.pill} width={40} />
                <View style={styles.skeletonCopy}>
                  <Skeleton height={14} width="55%" />
                  <Skeleton height={12} width="35%" />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!isLoading && visiblePulses.length === 0 && !errorMessage ? (
          <EmptyState
            compact
            description="Send a small signal when you want to feel close."
            icon="heart-outline"
            title="No pulses in the last hour"
          />
        ) : null}

        {!isLoading && visiblePulses.length > 0 ? (
          <View style={styles.list}>
            {visiblePulses.map((pulse, index) => {
              const option = PRESENCE_PULSE_OPTIONS[pulse.type];
              const isFromMe = pulse.sender_id === currentUserId;
              return (
                <View key={pulse.id} style={styles.pulseGroup}>
                  {index > 0 ? <Divider style={styles.divider} /> : null}
                  <View style={styles.pulseItem}>
                    <PulseTypeIcon type={pulse.type} />
                    <View style={styles.pulseText}>
                      <AppText style={styles.pulseTitle} variant="label">
                        {option.label}
                      </AppText>
                      <View style={styles.metaRow}>
                        <AppText color="textSecondary" variant="caption">
                          {isFromMe ? "From you" : `From ${partnerDisplayName}`}
                        </AppText>
                        <AppText color="textTertiary" variant="caption">
                          ·
                        </AppText>
                        <AppText color="textSecondary" variant="caption">
                          {formatRelativePulseTime(pulse.created_at, now)}
                        </AppText>
                      </View>
                    </View>
                  </View>
                  {pulse.optional_message ? (
                    <View style={[styles.noteBubble, isFromMe ? styles.noteBubbleMine : null]}>
                      <AppText variant="bodyMuted">{pulse.optional_message}</AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {errorMessage ? <InlineMessage message={errorMessage} tone="danger" /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  skeletonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  skeletonCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  pulseGroup: {
    gap: spacing.sm,
  },
  divider: {
    marginBottom: spacing.xs,
  },
  pulseItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  pulseText: {
    flex: 1,
    gap: 2,
  },
  pulseTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  noteBubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderTopLeftRadius: radii.xs,
    marginLeft: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteBubbleMine: {
    backgroundColor: colors.primarySoft,
  },
});
