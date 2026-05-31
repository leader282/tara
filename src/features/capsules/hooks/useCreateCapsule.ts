import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMemoryCapsule } from "@/features/capsules/api/capsulesApi";
import type { CreateCapsuleInput } from "@/features/capsules/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toCapsuleActionMessage } from "@/lib/errors/capsuleErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCreateCapsule(coupleId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateCapsuleInput) => createMemoryCapsule(input),
    onSuccess: async (capsule) => {
      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: queryKeys.capsules.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.capsules.detailList(capsule.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all }),
      ];

      if (coupleId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.capsules.listPrefix(coupleId),
          })
        );
      }

      if (user?.id) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.couple.home(user.id),
          })
        );
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.capsules.detail(capsule.id, user.id),
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

    return toCapsuleActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    ...mutation,
    friendlyError,
  };
}
