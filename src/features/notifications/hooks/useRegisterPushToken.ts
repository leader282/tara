import { useCallback, useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  registerPushToken,
  upsertNotificationPreferences,
} from "@/features/notifications/api/notificationsApi";
import type { EnableNotificationsResult } from "@/features/notifications/types";
import { requestNotificationPermission } from "@/features/notifications/services/notificationPermissions";
import { registerCurrentDeviceForPush } from "@/features/notifications/services/notificationToken";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  NotificationActionError,
  toNotificationActionMessage,
} from "@/lib/errors/notificationErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useRegisterPushToken() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<EnableNotificationsResult, Error>({
    mutationFn: async () => {
      if (!user?.id) {
        throw new NotificationActionError(
          "registration_failed",
          "You must be signed in to enable notifications.",
        );
      }

      const permission = await requestNotificationPermission();
      if (!permission.isGranted) {
        throw new NotificationActionError(
          permission.canAskAgain ? "permission_denied" : "permission_blocked",
        );
      }

      const tokenRegistration = await registerCurrentDeviceForPush({
        registerToken: registerPushToken,
      });

      const notificationPreferences = await upsertNotificationPreferences({
        userId: user.id,
      });

      return {
        permission,
        tokenRegistration,
        notificationPreferences,
      };
    },
    onSuccess: ({ notificationPreferences }) => {
      queryClient.setQueryData(
        queryKeys.notifications.preferences(notificationPreferences.user_id),
        notificationPreferences,
      );
      queryClient.setQueryData(
        queryKeys.profile.notificationPreferences(notificationPreferences.user_id),
        notificationPreferences,
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(notificationPreferences.user_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.notificationPreferences(notificationPreferences.user_id),
      });
    },
  });

  const enableNotifications = useCallback(
    async () => mutation.mutateAsync(),
    [mutation],
  );

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toNotificationActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    enableNotifications,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    result: mutation.data ?? null,
    error: mutation.error,
    friendlyError,
    reset: mutation.reset,
  };
}
