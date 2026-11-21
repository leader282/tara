import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { createCoupleWithInvite } from "@/features/invite/api/inviteApi";
import type { CreateCoupleInput } from "@/features/invite/types";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCreateCoupleWithInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateCoupleInput) => createCoupleWithInvite(input),
    onSuccess: (result) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.couple.activeState(user.id),
        });
        // The couple home mounts once the partner joins and doesn't refetch on mount, so drop
        // any copy cached from an earlier couple instead of only marking it stale.
        queryClient.removeQueries({ queryKey: queryKeys.couple.home(user.id) });
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.invite.active(result.couple_id),
      });
    },
  });
}
