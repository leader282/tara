import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertCurrentUserSettings } from "@/features/profile/api/userSettingsApi";
import { queryKeys } from "@/lib/query/queryKeys";

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCurrentUserSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.profile.settings(settings.user_id), settings);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.settings(settings.user_id),
      });
    },
  });
}
