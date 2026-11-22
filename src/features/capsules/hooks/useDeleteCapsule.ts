import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMemoryCapsule } from "@/features/capsules/api/capsulesApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toCapsuleActionMessage } from "@/lib/errors/capsuleErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useDeleteCapsule(coupleId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (capsuleId: string) => deleteMemoryCapsule(capsuleId),
    // The open detail screen leaves right after this, so only refresh what's behind it.
    onSuccess: async () => {
      await Promise.all([
        coupleId
          ? queryClient.invalidateQueries({ queryKey: queryKeys.capsules.listPrefix(coupleId) })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all }),
        user?.id
          ? queryClient.invalidateQueries({ queryKey: queryKeys.couple.home(user.id) })
          : Promise.resolve(),
      ]);
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
