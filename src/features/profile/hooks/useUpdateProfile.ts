import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertCurrentProfile } from "@/features/profile/api/profileApi";
import { queryKeys } from "@/lib/query/queryKeys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCurrentProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.current(profile.id), profile);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.current(profile.id),
      });
    },
  });
}
