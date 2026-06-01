import { useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelAccountDeletionRequest } from "@/features/account/api/accountApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAccountActionMessage } from "@/lib/errors/accountErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCancelAccountDeletionRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (requestId: string) => cancelAccountDeletionRequest(requestId),
    onSuccess: async (request) => {
      if (!user?.id) {
        return;
      }

      queryClient.setQueryData(queryKeys.account.deletionRequest(user.id), request);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.account.deletionRequest(user.id),
      });
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
