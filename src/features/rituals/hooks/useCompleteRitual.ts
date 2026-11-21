import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { completeRitual } from "@/features/rituals/api/ritualsApi";
import type { CompleteRitualInput } from "@/features/rituals/types";
import { toRitualActionMessage } from "@/lib/errors/ritualErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCompleteRitual(coupleId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CompleteRitualInput) => completeRitual(input),
    onSuccess: async (_result, input) => {
      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.rituals.detailList(input.coupleRitualId),
        }),
      ];

      if (coupleId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.rituals.todayList(coupleId),
          })
        );
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.rituals.historyList(coupleId),
          })
        );
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeline.listPrefix(coupleId),
          })
        );
      } else {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeline.all,
          })
        );
      }

      if (user?.id) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.couple.home(user.id),
          })
        );
      }

      await Promise.all(invalidations);
    },
  });

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toRitualActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
