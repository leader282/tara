import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateQuietHours } from "@/features/settings/api/settingsApi";
import type { UpdateQuietHoursInput } from "@/features/settings/types";
import {
  SettingsActionError,
  toSettingsActionMessage,
} from "@/lib/errors/settingsErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

type UpdateQuietHoursInputWithoutUserId = Omit<UpdateQuietHoursInput, "userId">;

export function useUpdateQuietHours() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateQuietHoursInputWithoutUserId) => {
      if (!user?.id) {
        throw new SettingsActionError(
          "permission_denied",
          "You need to be signed in to update quiet hours.",
        );
      }

      return updateQuietHours({
        userId: user.id,
        ...input,
      });
    },
    onSuccess: async ({ userSettings, notificationPreferences }) => {
      if (!user?.id) {
        return;
      }

      queryClient.setQueryData(queryKeys.profile.settings(user.id), userSettings);
      queryClient.setQueryData(
        queryKeys.notifications.preferences(user.id),
        notificationPreferences,
      );
      queryClient.setQueryData(
        queryKeys.profile.notificationPreferences(user.id),
        notificationPreferences,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile.settings(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.preferences(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile.notificationPreferences(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.profile(user.id),
        }),
      ]);
    },
  });

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toSettingsActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
