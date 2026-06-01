import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  getCurrentAccountDeletionRequest,
  requestAccountDeletion,
} from "@/features/account/api/accountApi";
import type { RequestAccountDeletionInput } from "@/features/account/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAccountActionMessage } from "@/lib/errors/accountErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

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

export function useAccountDeletionRequest(userIdOverride?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = userIdOverride ?? user?.id ?? null;

  const currentRequestQuery = useQuery({
    queryKey: queryKeys.account.deletionRequest(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      return getCurrentAccountDeletionRequest(userId);
    },
  });

  const mutation = useMutation({
    mutationFn: (input: RequestAccountDeletionInput) => requestAccountDeletion(input),
    onSuccess: async (request) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData(queryKeys.account.deletionRequest(userId), request);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.account.deletionRequest(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.preferences(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile.notificationPreferences(userId),
        }),
      ]);

      await clearCoupleScopedQueries(userId, queryClient);
    },
  });

  const currentRequestErrorMessage = useMemo(() => {
    if (!currentRequestQuery.error) {
      return null;
    }

    return toAccountActionMessage(currentRequestQuery.error);
  }, [currentRequestQuery.error]);

  const requestErrorMessage = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toAccountActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    currentRequest: currentRequestQuery.data ?? null,
    isLoadingCurrentRequest: currentRequestQuery.isLoading,
    isFetchingCurrentRequest: currentRequestQuery.isFetching,
    currentRequestError: currentRequestQuery.error,
    currentRequestErrorMessage,
    refetchCurrentRequest: currentRequestQuery.refetch,
    requestDeletion: mutation.mutateAsync,
    requestDeletionResult: mutation.data ?? null,
    isRequestingDeletion: mutation.isPending,
    requestDeletionError: mutation.error,
    requestDeletionErrorMessage: requestErrorMessage,
    resetRequestDeletionState: mutation.reset,
  };
}
