import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateSettingsProfile } from "@/features/settings/api/settingsApi";
import type { UpdateSettingsProfileInput } from "@/features/settings/types";
import {
  SettingsActionError,
  toSettingsActionMessage,
} from "@/lib/errors/settingsErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

type UpdateSettingsProfileInputWithoutUserId = Omit<UpdateSettingsProfileInput, "userId">;

export function useUpdateSettingsProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateSettingsProfileInputWithoutUserId) => {
      if (!user?.id) {
        throw new SettingsActionError(
          "permission_denied",
          "You need to be signed in to update settings.",
        );
      }

      return updateSettingsProfile({
        userId: user.id,
        ...input,
      });
    },
    onSuccess: async (settingsProfile) => {
      if (!user?.id) {
        return;
      }

      queryClient.setQueryData(queryKeys.settings.profile(user.id), settingsProfile);

      if (settingsProfile.profile) {
        queryClient.setQueryData(queryKeys.profile.current(user.id), settingsProfile.profile);
      }

      if (settingsProfile.userSettings) {
        queryClient.setQueryData(queryKeys.profile.settings(user.id), settingsProfile.userSettings);
      }

      if (settingsProfile.notificationPreferences) {
        queryClient.setQueryData(
          queryKeys.profile.notificationPreferences(user.id),
          settingsProfile.notificationPreferences,
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile.current(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile.settings(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.profile(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.onboarding.all,
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
