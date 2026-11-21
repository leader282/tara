import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon } from "@/components/ui";
import { formatTimeKey } from "@/lib/dates/calendar";
import { colors, radii, spacing } from "@/theme/tokens";

type QuietHoursSummaryCardProps = {
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  respectQuietHoursEnabled: boolean;
  onOpenQuietHoursSettings?: (() => void) | null;
};

function toHHmm(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5);
  }

  return null;
}

export function QuietHoursSummaryCard({
  quietHoursStart,
  quietHoursEnd,
  respectQuietHoursEnabled,
  onOpenQuietHoursSettings = null,
}: QuietHoursSummaryCardProps) {
  const start = toHHmm(quietHoursStart);
  const end = toHHmm(quietHoursEnd);
  const hasQuietHoursWindow = Boolean(start && end);

  return (
    <Card
      accessibilityLabel="Adjust quiet hours"
      onPress={onOpenQuietHoursSettings ?? undefined}
      padding="md"
    >
      <View style={styles.container}>
        <View style={styles.iconWell}>
          <Icon color="info" name="moon" size={20} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title} variant="label">
            Quiet hours
          </AppText>
          <AppText color={hasQuietHoursWindow ? "textPrimary" : "textSecondary"} variant="caption">
            {hasQuietHoursWindow
              ? `Current quiet hours: ${formatTimeKey(start) ?? start} - ${formatTimeKey(end) ?? end}`
              : "Quiet hours are not configured yet."}
          </AppText>
          {!respectQuietHoursEnabled ? (
            <AppText color="warning" variant="caption">
              Respect quiet hours is off in notification preferences right now.
            </AppText>
          ) : null}
        </View>
        {onOpenQuietHoursSettings ? (
          <Icon color="textTertiary" name="chevron-forward" size={18} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.infoSoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
});
