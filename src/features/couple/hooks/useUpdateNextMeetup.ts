import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateNextMeetup } from "@/features/couple/api/coupleHomeApi";
import type { UpdateNextMeetupInput } from "@/features/couple/types";
import { toCoupleActionMessage } from "@/lib/errors/coupleErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useUpdateNextMeetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UpdateNextMeetupInput) => updateNextMeetup(input),
    onSuccess: async (_couple, input) => {
      if (!user?.id) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.couple.home(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.couple.activeState(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeline.listPrefix(input.coupleId),
        }),
      ]);
    },
  });

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toCoupleActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
