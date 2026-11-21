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

import { AppText, Button, Icon } from "@/components/ui";
import { useMediaAsset } from "@/features/media/hooks/useMediaAsset";
import { useSignedMediaUrl } from "@/features/media/hooks/useSignedMediaUrl";
import type { MediaAsset } from "@/features/media/types";
import { colors, spacing } from "@/theme/tokens";

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

type PlaceholderProps = {
  containerStyle?: StyleProp<ViewStyle>;
  message: string;
  isLoading?: boolean;
  onRetry?: () => void;
};

function ImagePlaceholder({ containerStyle, message, isLoading = false, onRetry }: PlaceholderProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole={isLoading ? "progressbar" : undefined}
      style={[styles.placeholder, containerStyle]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Icon color="textTertiary" name="image-outline" size={26} />
      )}
      <AppText align="center" color="textSecondary" variant="caption">
        {message}
      </AppText>
      {onRetry ? (
        <Button icon="refresh" onPress={onRetry} size="sm" title="Try again" variant="outline" />
      ) : null}
    </View>
  );
}

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
    return <ImagePlaceholder containerStyle={containerStyle} isLoading message={loadingLabel} />;
  }

  if (!hasPathFromProps && mediaAssetId && mediaAssetQuery.isError) {
    return (
      <ImagePlaceholder
        containerStyle={containerStyle}
        message={mediaAssetQuery.friendlyError ?? "We could not load this private photo."}
        onRetry={() => {
          void mediaAssetQuery.refetch();
        }}
      />
    );
  }

  if (!resolvedStoragePath) {
    return (
      <ImagePlaceholder
        containerStyle={containerStyle}
        message="This private photo is unavailable right now."
      />
    );
  }

  if (signedUrlQuery.isLoading && !signedUrlQuery.data) {
    return <ImagePlaceholder containerStyle={containerStyle} isLoading message={loadingLabel} />;
  }

  if (signedUrlQuery.isError || !signedUrlQuery.data || failedToRenderImage) {
    return (
      <ImagePlaceholder
        containerStyle={containerStyle}
        message={signedUrlQuery.friendlyError ?? "We could not load this private photo."}
        onRetry={() => {
          setFailedUrl(null);
          void signedUrlQuery.refetch();
        }}
      />
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
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 160,
    padding: spacing.lg,
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
