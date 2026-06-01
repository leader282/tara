import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateCoupleSharedSettings } from "@/features/settings/api/coupleSettingsApi";
import type { UpdateCoupleSharedSettingsInput } from "@/features/settings/types";
import { toSettingsActionMessage } from "@/lib/errors/settingsErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useUpdateCoupleSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UpdateCoupleSharedSettingsInput) => updateCoupleSharedSettings(input),
    onSuccess: async (coupleSettings) => {
      queryClient.setQueryData(
        queryKeys.settings.couple(coupleSettings.coupleId),
        coupleSettings,
      );

      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.couple(coupleSettings.coupleId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeline.listPrefix(coupleSettings.coupleId),
        }),
      ];

      if (user?.id) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.couple.activeState(user.id),
          }),
        );
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.couple.home(user.id),
          }),
        );
      }

      await Promise.all(invalidations);
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
