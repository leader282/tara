import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { createSignedMediaUrl } from "@/features/media/api/storageApi";
import { MEDIA_SIGNED_URL_TTL_SECONDS } from "@/features/media/constants";
import type { SignedMediaUrlResult } from "@/features/media/types";
import { toMediaActionMessage } from "@/lib/errors/mediaErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

export function useSignedMediaUrl(
  storagePath: string | null | undefined,
  expiresInSeconds: number = MEDIA_SIGNED_URL_TTL_SECONDS
) {
  const ttlSeconds = Math.max(30, Math.floor(expiresInSeconds));
  const safeStoragePath = storagePath ?? "";
  const staleTimeMs = Math.max((ttlSeconds - 30) * 1000, 5_000);
  const refreshIntervalMs = Math.max((ttlSeconds - 15) * 1000, 15_000);

  const query = useQuery<SignedMediaUrlResult, Error>({
    queryKey: queryKeys.media.signedUrl(safeStoragePath, ttlSeconds),
    enabled: safeStoragePath.length > 0,
    queryFn: () => createSignedMediaUrl(safeStoragePath, ttlSeconds),
    staleTime: staleTimeMs,
    gcTime: ttlSeconds * 2_000,
    refetchInterval: safeStoragePath.length > 0 ? refreshIntervalMs : false,
  });

  const friendlyError = useMemo(() => {
    if (!query.error) {
      return null;
    }

    return toMediaActionMessage(query.error);
  }, [query.error]);

  return {
    ...query,
    friendlyError,
  };
}
