import { useCallback, useState } from "react";

import { useUploadMedia } from "@/features/media/hooks/useUploadMedia";
import type { MediaAsset, MediaPurpose, PickedImage } from "@/features/media/types";
import { MediaActionError } from "@/lib/errors/mediaErrorMessages";

type UseMediaAttachmentOptions = {
  defaultPurpose?: MediaPurpose;
};

export function useMediaAttachment(options: UseMediaAttachmentOptions = {}) {
  const { defaultPurpose = "attachment" } = options;
  const uploadMutation = useUploadMedia();

  const [pickedImage, setPickedImageState] = useState<PickedImage | null>(null);
  const [uploadedMediaAsset, setUploadedMediaAsset] = useState<MediaAsset | null>(null);

  const setPickedImage = useCallback(
    (image: PickedImage | null) => {
      setPickedImageState(image);
      setUploadedMediaAsset(null);
      uploadMutation.reset();
    },
    [uploadMutation]
  );

  const uploadAttachment = useCallback(
    async (
      purpose: MediaPurpose = defaultPurpose,
      imageOverride: PickedImage | null = null
    ): Promise<MediaAsset> => {
      const sourceImage = imageOverride ?? pickedImage;
      if (!sourceImage) {
        throw new MediaActionError("upload_failed", "Select an image before uploading.");
      }

      const result = await uploadMutation.mutateAsync({
        localUri: sourceImage.uri,
        mimeType: sourceImage.mimeType,
        width: sourceImage.width,
        height: sourceImage.height,
        purpose,
      });

      setPickedImageState(null);
      setUploadedMediaAsset(result.mediaAsset);
      return result.mediaAsset;
    },
    [defaultPurpose, pickedImage, uploadMutation]
  );

  const clearAttachment = useCallback(() => {
    setPickedImageState(null);
    setUploadedMediaAsset(null);
    uploadMutation.reset();
  }, [uploadMutation]);

  return {
    pickedImage,
    uploadedMediaAsset,
    setPickedImage,
    uploadAttachment,
    clearAttachment,
    progress: uploadMutation.progress,
    friendlyError: uploadMutation.friendlyError,
    isUploading: uploadMutation.isPending,
    uploadResult: uploadMutation.data ?? null,
  };
}
