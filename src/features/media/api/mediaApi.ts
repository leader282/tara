import { z } from "zod";

import { createSignedMediaUrl } from "@/features/media/api/storageApi";
import { mediaAssetSchema } from "@/features/media/schemas";
import { uploadPickedImage } from "@/features/media/services/uploadMedia";
import type {
  MediaAsset,
  MediaUploadInput,
  MediaUploadProgressState,
  MediaUploadResult,
  SignedMediaUrlResult,
} from "@/features/media/types";
import { toMediaActionError } from "@/lib/errors/mediaErrorMessages";
import { supabase } from "@/lib/supabase/client";

type UploadMediaOptions = {
  input: MediaUploadInput;
  onProgress?: (state: MediaUploadProgressState) => void;
};

export async function uploadMedia(options: UploadMediaOptions): Promise<MediaUploadResult> {
  return uploadPickedImage(options);
}

export async function getSignedMediaUrl(
  storagePath: string,
  expiresInSeconds?: number
): Promise<SignedMediaUrlResult> {
  return createSignedMediaUrl(storagePath, expiresInSeconds);
}

export async function getMediaAssetById(mediaAssetId: string): Promise<MediaAsset | null> {
  try {
    const parsedMediaAssetId = z.string().uuid().parse(mediaAssetId);

    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", parsedMediaAssetId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mediaAssetSchema.parse(data);
  } catch (error) {
    throw toMediaActionError(error);
  }
}
