import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { acceptCoupleInvite } from "@/features/invite/api/inviteApi";
import { queryKeys } from "@/lib/query/queryKeys";

export function useAcceptCoupleInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptCoupleInvite,
    onSuccess: (result) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.couple.activeState(user.id),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.invite.active(result.couple_id),
      });
    },
  });
}
