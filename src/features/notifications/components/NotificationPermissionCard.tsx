import { StyleSheet, View } from "react-native";

import { AppText, Badge, type BadgeTone, Button, Card, Icon, InlineMessage } from "@/components/ui";
import type { NotificationPermissionState } from "@/features/notifications/types";
import { colors, radii, spacing } from "@/theme/tokens";

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

function toStatusPresentation(status: NotificationPermissionState): { label: string; tone: BadgeTone } {
  switch (status) {
    case "granted":
      return { label: "Enabled", tone: "success" };
    case "provisional":
      return { label: "Enabled quietly", tone: "success" };
    case "denied":
      return { label: "Off", tone: "danger" };
    default:
      return { label: "Not set", tone: "neutral" };
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
  const statusPresentation = toStatusPresentation(status);
  const showEnableButton = !isGranted && canAskAgain;
  const showSettingsHint = !isGranted && !canAskAgain;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconWell, isGranted ? styles.iconWellEnabled : null]}>
            <Icon
              color={isGranted ? "success" : "primaryStrong"}
              name={isGranted ? "notifications" : "notifications-outline"}
              size={22}
            />
          </View>
          <View style={styles.copy}>
            <AppText variant="subtitle">Notifications are optional</AppText>
            <Badge label={`Status: ${statusPresentation.label}`} tone={statusPresentation.tone} />
          </View>
        </View>

        <AppText color="textSecondary" variant="bodyMuted">
          When your partner sends a hug or answers a ritual, Tara tells you what they shared. Private
          notes, ritual responses, photos, and exact locations are never shown in notification text.
        </AppText>

        {isGranted ? (
          <InlineMessage
            message={successMessage ?? "Gentle notifications are enabled on this device."}
            tone="success"
          />
        ) : null}

        {showEnableButton ? (
          <Button
            icon="notifications-outline"
            loading={isEnabling}
            onPress={onEnable}
            title="Enable gentle notifications"
          />
        ) : null}

        {showSettingsHint ? (
          <InlineMessage
            message="You can turn this on later in your device settings."
            tone="neutral"
          />
        ) : null}

        {!isEnabling && !showEnableButton ? (
          <Button icon="refresh" onPress={onRefreshStatus} size="md" title="Refresh status" variant="ghost" />
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconWellEnabled: {
    backgroundColor: colors.successSoft,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
