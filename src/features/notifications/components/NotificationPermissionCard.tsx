import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Icon, InlineMessage } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type NotificationPermissionCardProps = {
  isGranted: boolean;
  canAskAgain: boolean;
  isEnabling: boolean;
  onEnable: () => void;
  onRefreshStatus: () => void;
  errorMessage?: string | null;
  successMessage?: string | null;
};

export function NotificationPermissionCard({
  isGranted,
  canAskAgain,
  isEnabling,
  onEnable,
  onRefreshStatus,
  errorMessage = null,
  successMessage = null,
}: NotificationPermissionCardProps) {
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
            <AppText variant="subtitle">Notifications on this phone</AppText>
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
          <>
            <InlineMessage
              message="Notifications are off. You can turn them on in your phone's settings."
              tone="neutral"
            />
            <Button icon="refresh" onPress={onRefreshStatus} size="md" title="I turned them on" variant="ghost" />
          </>
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
