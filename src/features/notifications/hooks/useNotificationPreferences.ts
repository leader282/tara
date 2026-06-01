import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/features/notifications/api/notificationsApi";
import type { UpsertNotificationPreferencesInput } from "@/features/notifications/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toNotificationActionMessage } from "@/lib/errors/notificationErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

type PreferencesUpdateInput = Omit<UpsertNotificationPreferencesInput, "userId">;

export function useNotificationPreferences(userIdOverride?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = userIdOverride ?? user?.id ?? null;

  const query = useQuery({
    queryKey: queryKeys.notifications.preferences(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      return getNotificationPreferences(userId);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: PreferencesUpdateInput = {}) => {
      if (!userId) {
        throw new Error("You must be signed in to update notification preferences.");
      }

      return upsertNotificationPreferences({
        userId,
        ...input,
      });
    },
    onSuccess: (notificationPreferences) => {
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

  const upsertPreferences = useCallback(
    async (input: PreferencesUpdateInput = {}) => upsertMutation.mutateAsync(input),
    [upsertMutation],
  );

  const updateErrorMessage = useMemo(() => {
    if (!upsertMutation.error) {
      return null;
    }

    return toNotificationActionMessage(upsertMutation.error);
  }, [upsertMutation.error]);

  return {
    ...query,
    upsertPreferences,
    isUpdating: upsertMutation.isPending,
    updateError: updateErrorMessage,
    updateSucceeded: upsertMutation.isSuccess,
    resetUpdateState: upsertMutation.reset,
  };
}
