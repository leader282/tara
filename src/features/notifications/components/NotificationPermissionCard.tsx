import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { NotificationPermissionState } from "@/features/notifications/types";
import { spacing } from "@/theme/tokens";

type NotificationPermissionCardProps = {
  status: NotificationPermissionState;
  isGranted: boolean;
  canAskAgain: boolean;
  isEnabling: boolean;
  onEnable: () => void;
  onRefreshStatus: () => void;
  errorMessage?: string | null;
  successMessage?: string | null;
};

function toStatusLabel(status: NotificationPermissionState): string {
  switch (status) {
    case "granted":
      return "Enabled";
    case "provisional":
      return "Enabled quietly";
    case "denied":
      return "Off";
    default:
      return "Not set";
  }
}

export function NotificationPermissionCard({
  status,
  isGranted,
  canAskAgain,
  isEnabling,
  onEnable,
  onRefreshStatus,
  errorMessage = null,
  successMessage = null,
}: NotificationPermissionCardProps) {
  const statusLabel = toStatusLabel(status);
  const showEnableButton = !isGranted && canAskAgain;
  const showSettingsHint = !isGranted && !canAskAgain;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.copy}>
          <AppText variant="subtitle">Notifications are optional</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Tara can gently nudge you, but private notes, ritual responses, photos, and exact
            locations are not shown in notification text.
          </AppText>
          <AppText color="textSecondary" variant="caption">
            Status: {statusLabel}
          </AppText>
        </View>

        {isGranted ? (
          <AppText color="success" variant="caption">
            {successMessage ?? "Gentle notifications are enabled on this device."}
          </AppText>
        ) : null}

        {showEnableButton ? (
          <Button
            loading={isEnabling}
            onPress={onEnable}
            title="Enable gentle notifications"
            variant="secondary"
          />
        ) : null}

        {showSettingsHint ? (
          <AppText color="textSecondary" variant="caption">
            You can turn this on later in your device settings.
          </AppText>
        ) : null}

        {!isEnabling && !showEnableButton ? (
          <Button onPress={onRefreshStatus} title="Refresh status" variant="ghost" />
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
  copy: {
    gap: spacing.xs,
  },
});
