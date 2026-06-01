import { useMemo } from "react";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { leaveCurrentCouple } from "@/features/account/api/accountApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAccountActionMessage } from "@/lib/errors/accountErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

async function clearCoupleScopedQueries(userId: string, queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.couple.activeState(userId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(userId),
    }),
  ]);

  queryClient.removeQueries({ queryKey: queryKeys.couple.all });
  queryClient.removeQueries({ queryKey: queryKeys.invite.all });
  queryClient.removeQueries({ queryKey: queryKeys.presence.all });
  queryClient.removeQueries({ queryKey: queryKeys.timeline.all });
  queryClient.removeQueries({ queryKey: queryKeys.rituals.all });
  queryClient.removeQueries({ queryKey: queryKeys.capsules.all });
  queryClient.removeQueries({ queryKey: queryKeys.media.all });
  queryClient.removeQueries({ queryKey: queryKeys.settings.coupleList });
}

export function useLeaveCouple() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (confirmation: string) => leaveCurrentCouple(confirmation),
    onSuccess: async () => {
      if (!user?.id) {
        return;
      }

      await clearCoupleScopedQueries(user.id, queryClient);
    },
  });

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toAccountActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
