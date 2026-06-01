import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentDataExportRequests,
  requestDataExport,
} from "@/features/account/api/accountApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAccountActionMessage } from "@/lib/errors/accountErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

export function useDataExportRequest(userIdOverride?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = userIdOverride ?? user?.id ?? null;

  const requestsQuery = useQuery({
    queryKey: queryKeys.account.dataExportRequests(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      return getCurrentDataExportRequests(userId);
    },
  });

  const mutation = useMutation({
    mutationFn: () => requestDataExport(),
    onSuccess: async (request) => {
      if (!userId) {
        return;
      }

      const currentRequests = requestsQuery.data ?? [];
      const dedupedRequests = [request, ...currentRequests.filter((item) => item.id !== request.id)];
      queryClient.setQueryData(queryKeys.account.dataExportRequests(userId), dedupedRequests);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.account.dataExportRequests(userId),
      });
    },
  });

  const queryErrorMessage = useMemo(() => {
    if (!requestsQuery.error) {
      return null;
    }

    return toAccountActionMessage(requestsQuery.error);
  }, [requestsQuery.error]);

  const requestErrorMessage = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toAccountActionMessage(mutation.error);
  }, [mutation.error]);

  return {
    requests: requestsQuery.data ?? [],
    isLoadingRequests: requestsQuery.isLoading,
    isFetchingRequests: requestsQuery.isFetching,
    requestsError: requestsQuery.error,
    requestsErrorMessage: queryErrorMessage,
    refetchRequests: requestsQuery.refetch,
    requestExport: mutation.mutateAsync,
    requestExportResult: mutation.data ?? null,
    isRequestingExport: mutation.isPending,
    requestExportError: mutation.error,
    requestExportErrorMessage: requestErrorMessage,
    resetRequestExportState: mutation.reset,
  };
}
