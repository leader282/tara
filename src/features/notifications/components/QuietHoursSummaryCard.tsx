import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import { spacing } from "@/theme/tokens";

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
    <Card>
      <View style={styles.container}>
        <View style={styles.copy}>
          <AppText variant="subtitle">Quiet hours</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Tara will avoid non-urgent notifications during your rest time.
          </AppText>
        </View>

        {hasQuietHoursWindow ? (
          <AppText variant="body">
            Current quiet hours: {start} - {end}
          </AppText>
        ) : (
          <AppText color="textSecondary" variant="caption">
            Quiet hours are not configured yet.
          </AppText>
        )}

        {!respectQuietHoursEnabled ? (
          <AppText color="textSecondary" variant="caption">
            Respect quiet hours is off in notification preferences right now.
          </AppText>
        ) : null}

        {onOpenQuietHoursSettings ? (
          <Button
            onPress={onOpenQuietHoursSettings}
            title="Adjust quiet hours"
            variant="ghost"
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
});
