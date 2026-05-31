import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { sendPresencePulse } from "@/features/presence/api/presenceApi";
import type { SendPresencePulseInput } from "@/features/presence/types";
import { toPresenceActionMessage } from "@/lib/errors/presenceErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useSendPresencePulse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: SendPresencePulseInput) => sendPresencePulse(input),
    onSuccess: async (presenceEvent) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.presence.recentList(presenceEvent.couple_id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeline.all,
        }),
        user?.id
          ? queryClient.invalidateQueries({
              queryKey: queryKeys.couple.home(user.id),
            })
          : Promise.resolve(),
      ]);
    },
  });

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toPresenceActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
