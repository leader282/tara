import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ErrorState, LoadingState } from "@/components/ui";
import { useMediaAsset } from "@/features/media/hooks/useMediaAsset";
import { useSignedMediaUrl } from "@/features/media/hooks/useSignedMediaUrl";
import type { MediaAsset } from "@/features/media/types";
import { colors } from "@/theme/tokens";

type PrivateImageProps = {
  mediaAsset?: Pick<MediaAsset, "storage_path"> | null;
  mediaAssetId?: string | null;
  storagePath?: string | null;
  accessibilityLabel?: string;
  resizeMode?: ImageResizeMode;
  imageStyle?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  loadingLabel?: string;
};

export function PrivateImage({
  mediaAsset,
  mediaAssetId,
  storagePath,
  accessibilityLabel = "Private photo",
  resizeMode = "cover",
  imageStyle,
  containerStyle,
  loadingLabel = "Loading private photo...",
}: PrivateImageProps) {
  const hasPathFromProps = Boolean(storagePath ?? mediaAsset?.storage_path);
  const mediaAssetQuery = useMediaAsset(hasPathFromProps ? null : mediaAssetId);
  const resolvedStoragePath = useMemo(
    () => storagePath ?? mediaAsset?.storage_path ?? mediaAssetQuery.mediaAsset?.storage_path ?? null,
    [mediaAsset?.storage_path, mediaAssetQuery.mediaAsset?.storage_path, storagePath]
  );
  const signedUrlQuery = useSignedMediaUrl(resolvedStoragePath);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const signedUrl = signedUrlQuery.data?.signedUrl ?? null;
  const failedToRenderImage = Boolean(signedUrl && failedUrl === signedUrl);

  if (!hasPathFromProps && mediaAssetId && mediaAssetQuery.isLoading) {
    return (
      <View style={containerStyle}>
        <LoadingState label={loadingLabel} />
      </View>
    );
  }

  if (!hasPathFromProps && mediaAssetId && mediaAssetQuery.isError) {
    return (
      <View style={containerStyle}>
        <ErrorState
          message={mediaAssetQuery.friendlyError ?? "We could not load this private photo."}
          onRetry={() => {
            void mediaAssetQuery.refetch();
          }}
          title="Couldn't load photo"
        />
      </View>
    );
  }

  if (!resolvedStoragePath) {
    return (
      <View style={containerStyle}>
        <ErrorState
          message="This private photo is unavailable right now."
          title="Photo unavailable"
        />
      </View>
    );
  }

  if (signedUrlQuery.isLoading && !signedUrlQuery.data) {
    return (
      <View style={containerStyle}>
        <LoadingState label={loadingLabel} />
      </View>
    );
  }

  if (signedUrlQuery.isError || !signedUrlQuery.data || failedToRenderImage) {
    return (
      <View style={containerStyle}>
        <ErrorState
          message={signedUrlQuery.friendlyError ?? "We could not load this private photo."}
          onRetry={() => {
            setFailedUrl(null);
            void signedUrlQuery.refetch();
          }}
          title="Couldn't load photo"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        accessibilityLabel={accessibilityLabel}
        source={{ uri: signedUrlQuery.data.signedUrl }}
        style={[styles.image, imageStyle]}
        onError={() => {
          if (signedUrlQuery.data?.signedUrl) {
            setFailedUrl(signedUrlQuery.data.signedUrl);
          }
        }}
        resizeMode={resizeMode}
      />
      {signedUrlQuery.isFetching ? (
        <View style={styles.refreshOverlay}>
          <ActivityIndicator color={colors.textInverse} size="small" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  refreshOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(44, 31, 26, 0.18)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
