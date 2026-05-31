import type { PostgrestError } from "@supabase/supabase-js";

import {
  MEDIA_BUCKET,
  MEDIA_SIGNED_URL_TTL_SECONDS,
  MEDIA_UPLOAD_CACHE_CONTROL_SECONDS,
} from "@/features/media/constants";
import {
  markMediaAssetFailedInputSchema,
  markMediaAssetFailedRowsSchema,
  markMediaAssetUploadedInputSchema,
  markMediaAssetUploadedRowsSchema,
  reserveMediaAssetInputSchema,
  reserveMediaAssetRowsSchema,
  signedMediaUrlInputSchema,
  signedMediaUrlSchema,
  uploadMediaObjectInputSchema,
} from "@/features/media/schemas";
import type {
  MarkMediaAssetFailedInput,
  MarkMediaAssetFailedResult,
  MarkMediaAssetUploadedInput,
  MediaAsset,
  ReserveMediaAssetInput,
  ReservedMediaAsset,
  SignedMediaUrlResult,
  UploadMediaObjectInput,
} from "@/features/media/types";
import { MediaActionError, toMediaActionError } from "@/lib/errors/mediaErrorMessages";
import { supabase } from "@/lib/supabase/client";

function throwIfSupabaseError(error: PostgrestError | unknown | null): void {
  if (error) {
    throw toMediaActionError(error);
  }
}

export async function reserveMediaAsset(input: ReserveMediaAssetInput): Promise<ReservedMediaAsset> {
  try {
    const parsedInput = reserveMediaAssetInputSchema.parse(input);

    const { data, error } = await supabase.rpc("reserve_media_asset", {
      p_mime_type: parsedInput.mimeType,
      p_size_bytes: parsedInput.sizeBytes ?? undefined,
      p_width: parsedInput.width,
      p_height: parsedInput.height,
      p_purpose: parsedInput.purpose,
    });

    throwIfSupabaseError(error);

    const [reservedMediaAsset] = reserveMediaAssetRowsSchema.parse(data ?? []);
    if (!reservedMediaAsset) {
      throw new MediaActionError("upload_failed");
    }

    return reservedMediaAsset;
  } catch (error) {
    throw toMediaActionError(error);
  }
}

export async function markMediaAssetUploaded(
  input: MarkMediaAssetUploadedInput
): Promise<MediaAsset> {
  try {
    const parsedInput = markMediaAssetUploadedInputSchema.parse(input);

    const { data, error } = await supabase.rpc("mark_media_asset_uploaded", {
      p_media_asset_id: parsedInput.mediaAssetId,
      p_size_bytes: parsedInput.sizeBytes,
      p_width: parsedInput.width,
      p_height: parsedInput.height,
    });

    throwIfSupabaseError(error);

    const [mediaAsset] = markMediaAssetUploadedRowsSchema.parse(data ?? []);
    if (!mediaAsset) {
      throw new MediaActionError("upload_failed");
    }

    return mediaAsset;
  } catch (error) {
    throw toMediaActionError(error);
  }
}

export async function markMediaAssetFailed(
  input: MarkMediaAssetFailedInput
): Promise<MarkMediaAssetFailedResult | null> {
  try {
    const parsedInput = markMediaAssetFailedInputSchema.parse(input);

    const { data, error } = await supabase.rpc("mark_media_asset_failed", {
      p_media_asset_id: parsedInput.mediaAssetId,
    });

    if (error?.code === "42883") {
      return null;
    }

    throwIfSupabaseError(error);

    const [failedMediaAsset] = markMediaAssetFailedRowsSchema.parse(data ?? []);
    return failedMediaAsset ?? null;
  } catch (error) {
    throw toMediaActionError(error);
  }
}

export async function uploadMediaObject(input: UploadMediaObjectInput): Promise<void> {
  try {
    const parsedInput = uploadMediaObjectInputSchema.parse(input);

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(parsedInput.storagePath, input.arrayBuffer, {
        upsert: false,
        contentType: parsedInput.contentType,
        cacheControl: String(MEDIA_UPLOAD_CACHE_CONTROL_SECONDS),
      });

    throwIfSupabaseError(error);
  } catch (error) {
    throw toMediaActionError(error);
  }
}

export async function createSignedMediaUrl(
  storagePath: string,
  expiresInSeconds: number = MEDIA_SIGNED_URL_TTL_SECONDS
): Promise<SignedMediaUrlResult> {
  try {
    const parsedInput = signedMediaUrlInputSchema.parse({
      storagePath,
      expiresInSeconds,
    });
    const ttlSeconds = parsedInput.expiresInSeconds ?? MEDIA_SIGNED_URL_TTL_SECONDS;

    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(parsedInput.storagePath, ttlSeconds);

    throwIfSupabaseError(error);

    if (!data?.signedUrl) {
      throw new MediaActionError("upload_failed");
    }

    return signedMediaUrlSchema.parse({
      storagePath: parsedInput.storagePath,
      signedUrl: data.signedUrl,
      expiresInSeconds: ttlSeconds,
      expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  } catch (error) {
    throw toMediaActionError(error);
  }
}
