import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Avatar, Badge, Button, IconButton, type IconName } from "@/components/ui";
import type { PartnerProfileSummary } from "@/features/couple/types";
import { getCountdownParts } from "@/lib/dates/countdown";
import { formatMeetupDateTime } from "@/lib/dates/format";
import {
  type DayPeriod,
  describeTimeDifference,
  formatTimeInTimeZone,
  getDayPeriod,
  getHourInTimeZone,
  isValidTimeZone,
} from "@/lib/dates/timezone";
import { colors, gradients, radii, shadows, spacing } from "@/theme/tokens";

const REFRESH_INTERVAL_MS = 30_000;

const PERIOD_DETAILS: Record<DayPeriod, { icon: IconName; label: string }> = {
  morning: { icon: "partly-sunny-outline", label: "Morning" },
  afternoon: { icon: "sunny-outline", label: "Afternoon" },
  evening: { icon: "cloudy-night-outline", label: "Evening" },
  night: { icon: "moon-outline", label: "Night" },
};

type PartnerHeroCardProps = {
  partnerProfile: PartnerProfileSummary;
  nextMeetupAt: string | null;
  nextMeetupLocation: string | null;
  onEditMeetup: () => void;
};

function getLocationLabel(partnerProfile: PartnerProfileSummary): string {
  const parts = [partnerProfile.city?.trim(), partnerProfile.country?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location kept private";
}

function ReunionSection({
  nextMeetupAt,
  nextMeetupLocation,
  onEditMeetup,
}: Pick<PartnerHeroCardProps, "nextMeetupAt" | "nextMeetupLocation" | "onEditMeetup">) {
  const reunionDate = nextMeetupAt ? new Date(nextMeetupAt) : null;
  const countdown = getCountdownParts(reunionDate);
  const formattedDate = formatMeetupDateTime(nextMeetupAt);
  const location = nextMeetupLocation?.trim();

  if (countdown.status === "none" || countdown.status === "past") {
    return (
      <View style={styles.reunionEmpty}>
        <View style={styles.reunionEmptyCopy}>
          <AppText color="inkText" variant="label">
            {countdown.status === "past" ? "That reunion has passed" : "No reunion date yet"}
          </AppText>
          <AppText color="inkMuted" variant="caption">
            Hold the anticipation together with a countdown.
          </AppText>
        </View>
        <Button
          icon="airplane-outline"
          onPress={onEditMeetup}
          size="sm"
          title={countdown.status === "past" ? "Plan next" : "Set a date"}
          variant="inverse"
        />
      </View>
    );
  }

  const headline =
    countdown.status === "today"
      ? "You reunite today"
      : countdown.status === "tomorrow"
        ? "Together tomorrow"
        : "days until you're together";
  const countdownLabel =
    countdown.status === "upcoming" ? `${countdown.daysRemaining} ${headline}` : headline;

  return (
    <View style={styles.reunionRow}>
      <View style={styles.reunionCopy}>
        <View
          accessibilityLabel={`Reunion countdown: ${countdownLabel}`}
          accessible
          style={styles.countdownLine}
        >
          {countdown.status === "upcoming" ? (
            <AppText color="gold" style={styles.countdownNumber} variant="display">
              {countdown.daysRemaining}
            </AppText>
          ) : (
            <AppText style={styles.countdownEmoji}>{countdown.status === "today" ? "✨" : "🛬"}</AppText>
          )}
          <AppText color="inkText" style={styles.countdownLabel} variant="label">
            {headline}
          </AppText>
        </View>
        <AppText color="inkMuted" numberOfLines={2} variant="caption">
          {[formattedDate, location].filter(Boolean).join(" · ")}
        </AppText>
      </View>
      <IconButton
        accessibilityLabel="Edit meetup"
        icon="pencil"
        iconSize={18}
        onPress={onEditMeetup}
        size={40}
        variant="inverse"
      />
    </View>
  );
}

export function PartnerHeroCard({
  partnerProfile,
  nextMeetupAt,
  nextMeetupLocation,
  onEditMeetup,
}: PartnerHeroCardProps) {
  const [now, setNow] = useState(() => new Date());
  const partnerTimeZone = partnerProfile.timezone?.trim() ?? "";
  const hasValidTimeZone = partnerTimeZone.length > 0 && isValidTimeZone(partnerTimeZone);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const period = PERIOD_DETAILS[getDayPeriod(getHourInTimeZone(now, hasValidTimeZone ? partnerTimeZone : null))];
  const localTime = hasValidTimeZone ? formatTimeInTimeZone(now, partnerTimeZone) : null;

  return (
    <View style={styles.hero}>
      <View style={styles.topRow}>
        <Avatar name={partnerProfile.display_name} size={44} tone="light" />
        <View style={styles.identity}>
          <AppText color="inkText" numberOfLines={1} variant="subtitle">
            {partnerProfile.display_name}
          </AppText>
          <AppText color="inkMuted" numberOfLines={1} variant="caption">
            {getLocationLabel(partnerProfile)}
          </AppText>
        </View>
        {localTime ? <Badge icon={period.icon} label={period.label} tone="inverse" /> : null}
      </View>

      <View style={styles.timeBlock}>
        {localTime ? (
          <>
            <AppText color="inkMuted" variant="overline">
              Their local time
            </AppText>
            <AppText color="inkText" style={styles.time} variant="display">
              {localTime}
            </AppText>
            <AppText color="inkMuted" variant="caption">
              {describeTimeDifference(partnerTimeZone, now)}
            </AppText>
          </>
        ) : (
          <AppText color="inkMuted" variant="bodyMuted">
            {partnerProfile.display_name} hasn&apos;t shared a time zone yet.
          </AppText>
        )}
      </View>

      <View style={styles.divider} />

      <ReunionSection
        nextMeetupAt={nextMeetupAt}
        nextMeetupLocation={nextMeetupLocation}
        onEditMeetup={onEditMeetup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    experimental_backgroundImage: gradients.hero,
    gap: spacing.lg,
    overflow: "hidden",
    padding: 20,
    ...shadows.raised,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  timeBlock: {
    gap: spacing.xs,
  },
  time: {
    fontSize: 44,
    lineHeight: 52,
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    height: StyleSheet.hairlineWidth,
  },
  reunionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  reunionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  countdownLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  countdownNumber: {
    fontSize: 36,
    lineHeight: 42,
  },
  countdownEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  countdownLabel: {
    flexShrink: 1,
    fontSize: 15,
  },
  reunionEmpty: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  reunionEmptyCopy: {
    flex: 1,
    gap: 2,
  },
});
