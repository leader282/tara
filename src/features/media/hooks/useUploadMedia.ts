import { useCallback, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadMedia } from "@/features/media/api/mediaApi";
import type {
  MediaUploadInput,
  MediaUploadProgressState,
  MediaUploadResult,
} from "@/features/media/types";
import { toMediaActionError } from "@/lib/errors/mediaErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const INITIAL_PROGRESS_STATE: MediaUploadProgressState = {
  step: "idle",
  message: null,
  errorCode: null,
};

export function useUploadMedia() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<MediaUploadProgressState>(INITIAL_PROGRESS_STATE);

  const mutation = useMutation<MediaUploadResult, Error, MediaUploadInput>({
    mutationFn: async (input) =>
      uploadMedia({
        input,
        onProgress: setProgress,
      }),
    onMutate: () => {
      setProgress(INITIAL_PROGRESS_STATE);
    },
    onSuccess: async (result) => {
      setProgress({
        step: "success",
        message: null,
        errorCode: null,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.media.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.media.asset(result.mediaAsset.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.media.signedUrl(result.mediaAsset.storage_path),
        }),
      ]);
    },
    onError: (error) => {
      const mediaError = toMediaActionError(error);
      setProgress({
        step: "error",
        message: mediaError.message,
        errorCode: mediaError.code,
      });
    },
  });

  const reset = useCallback(() => {
    mutation.reset();
    setProgress(INITIAL_PROGRESS_STATE);
  }, [mutation]);

  const friendlyError = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return toMediaActionError(mutation.error).message;
  }, [mutation.error]);

  return {
    ...mutation,
    progress,
    friendlyError,
    reset,
  };
}
