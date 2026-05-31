import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getMediaAssetById } from "@/features/media/api/mediaApi";
import type { MediaAsset } from "@/features/media/types";
import { toMediaActionMessage } from "@/lib/errors/mediaErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_MEDIA_ASSET_KEY = "unknown";

export function useMediaAsset(mediaAssetId: string | null | undefined) {
  const query = useQuery<MediaAsset | null, Error>({
    queryKey: queryKeys.media.asset(mediaAssetId ?? UNKNOWN_MEDIA_ASSET_KEY),
    enabled: Boolean(mediaAssetId),
    queryFn: async () => {
      if (!mediaAssetId) {
        return null;
      }

      return getMediaAssetById(mediaAssetId);
    },
  });

  const friendlyError = useMemo(() => {
    if (!query.error) {
      return null;
    }

    return toMediaActionMessage(query.error);
  }, [query.error]);

  return {
    ...query,
    mediaAsset: query.data ?? null,
    friendlyError,
  };
}
