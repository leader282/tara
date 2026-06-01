import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useRouter } from "expo-router";

import { AppText, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NotificationPermissionCard } from "@/features/notifications/components/NotificationPermissionCard";
import { NotificationPreferenceToggle } from "@/features/notifications/components/NotificationPreferenceToggle";
import { QuietHoursSummaryCard } from "@/features/notifications/components/QuietHoursSummaryCard";
import { useNotificationPermission } from "@/features/notifications/hooks/useNotificationPermission";
import { useNotificationPreferences } from "@/features/notifications/hooks/useNotificationPreferences";
import { useRegisterPushToken } from "@/features/notifications/hooks/useRegisterPushToken";
import { useUserSettings } from "@/features/profile/hooks/useUserSettings";
import { spacing } from "@/theme/tokens";

const QUIET_HOURS_SETTINGS_ROUTE = "/(onboarding)/quiet-hours";

type PreferenceToggleField =
  | "presenceEnabled"
  | "ritualsEnabled"
  | "capsulesEnabled"
  | "countdownEnabled"
  | "quietHoursEnabled";

export function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const permissionState = useNotificationPermission();
  const registerPushToken = useRegisterPushToken();
  const notificationPreferences = useNotificationPreferences(user?.id);
  const userSettings = useUserSettings(user?.id);

  const preferences = useMemo(
    () => ({
      presenceEnabled: notificationPreferences.data?.presence_enabled ?? true,
      ritualsEnabled: notificationPreferences.data?.rituals_enabled ?? true,
      capsulesEnabled: notificationPreferences.data?.capsules_enabled ?? true,
      countdownEnabled: notificationPreferences.data?.countdown_enabled ?? true,
      quietHoursEnabled: notificationPreferences.data?.quiet_hours_enabled ?? true,
    }),
    [notificationPreferences.data],
  );

  if (!user?.id) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to manage notification preferences."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  const handleEnableNotifications = async () => {
    try {
      await registerPushToken.enableNotifications();
      await permissionState.refreshPermissionStatus();
    } catch {
      // Friendly errors are already surfaced by the hook.
    }
  };

  const handleUpdatePreference = async (
    field: PreferenceToggleField,
    nextValue: boolean,
  ) => {
    try {
      await notificationPreferences.upsertPreferences({
        [field]: nextValue,
      });
    } catch {
      // Friendly errors are already surfaced by the hook.
    }
  };

  const handleOpenQuietHoursSettings = () => {
    router.push(QUIET_HOURS_SETTINGS_ROUTE);
  };

  const initialLoading =
    permissionState.isLoading &&
    notificationPreferences.isLoading &&
    !notificationPreferences.data;

  if (initialLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading notification settings..." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Notification settings</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Choose what Tara can gently remind you about.
        </AppText>
      </View>

      <NotificationPermissionCard
        canAskAgain={permissionState.canAskAgain}
        errorMessage={registerPushToken.friendlyError ?? permissionState.error}
        isEnabling={registerPushToken.isLoading}
        isGranted={permissionState.isGranted}
        onEnable={handleEnableNotifications}
        onRefreshStatus={permissionState.refreshPermissionStatus}
        status={permissionState.status}
        successMessage={
          registerPushToken.isSuccess
            ? "Gentle notifications are enabled and this device is registered."
            : null
        }
      />

      <Card>
        <View style={styles.preferenceList}>
          <View style={styles.preferenceHeader}>
            <AppText variant="subtitle">Reminders you want</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              You can adjust this anytime.
            </AppText>
          </View>

          <NotificationPreferenceToggle
            accessibilityLabel="Presence pulse notification preference"
            description="Warm pulse reminders from your couple space."
            disabled={notificationPreferences.isUpdating}
            label="Presence pulses"
            onValueChange={(nextValue) =>
              void handleUpdatePreference("presenceEnabled", nextValue)
            }
            value={preferences.presenceEnabled}
          />

          <NotificationPreferenceToggle
            accessibilityLabel="Ritual notification preference"
            description="Today's ritual reminders and reveal updates."
            disabled={notificationPreferences.isUpdating}
            label="Rituals"
            onValueChange={(nextValue) =>
              void handleUpdatePreference("ritualsEnabled", nextValue)
            }
            value={preferences.ritualsEnabled}
          />

          <NotificationPreferenceToggle
            accessibilityLabel="Memory capsule notification preference"
            description="When a memory capsule becomes available to open."
            disabled={notificationPreferences.isUpdating}
            label="Memory capsules"
            onValueChange={(nextValue) =>
              void handleUpdatePreference("capsulesEnabled", nextValue)
            }
            value={preferences.capsulesEnabled}
          />

          <NotificationPreferenceToggle
            accessibilityLabel="Countdown reminder preference"
            description="Gentle countdown reminders for reunion plans."
            disabled={notificationPreferences.isUpdating}
            label="Countdown reminders"
            onValueChange={(nextValue) =>
              void handleUpdatePreference("countdownEnabled", nextValue)
            }
            value={preferences.countdownEnabled}
          />

          <NotificationPreferenceToggle
            accessibilityLabel="Respect quiet hours preference"
            description="Delay non-urgent notifications during your quiet hours."
            disabled={notificationPreferences.isUpdating}
            label="Respect quiet hours"
            onValueChange={(nextValue) =>
              void handleUpdatePreference("quietHoursEnabled", nextValue)
            }
            value={preferences.quietHoursEnabled}
          />

          {notificationPreferences.updateError ? (
            <AppText color="danger" variant="caption">
              {notificationPreferences.updateError}
            </AppText>
          ) : null}
        </View>
      </Card>

      <QuietHoursSummaryCard
        onOpenQuietHoursSettings={handleOpenQuietHoursSettings}
        quietHoursEnd={userSettings.data?.quiet_hours_end}
        quietHoursStart={userSettings.data?.quiet_hours_start}
        respectQuietHoursEnabled={preferences.quietHoursEnabled}
      />

      {userSettings.error ? (
        <AppText color="textSecondary" variant="caption">
          We couldn&apos;t load your quiet-hours summary right now.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  loading: {
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  preferenceList: {
    gap: spacing.lg,
  },
  preferenceHeader: {
    gap: spacing.xs,
  },
});
