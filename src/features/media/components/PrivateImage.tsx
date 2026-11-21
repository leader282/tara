import { useState } from "react";
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

import { AppText, Button, Icon, type IconName } from "@/components/ui";
import { useSignedMediaUrl } from "@/features/media/hooks/useSignedMediaUrl";
import { colors, spacing } from "@/theme/tokens";

type PrivateImageProps = {
  storagePath: string | null;
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
  icon?: IconName;
};

export function MediaPlaceholder({
  containerStyle,
  message,
  isLoading = false,
  onRetry,
  icon = "image-outline",
}: PlaceholderProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole={isLoading ? "progressbar" : undefined}
      style={[styles.placeholder, containerStyle]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Icon color="textTertiary" name={icon} size={26} />
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
  storagePath,
  accessibilityLabel = "Private photo",
  resizeMode = "cover",
  imageStyle,
  containerStyle,
  loadingLabel = "Loading private photo...",
}: PrivateImageProps) {
  const signedUrlQuery = useSignedMediaUrl(storagePath);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const signedUrl = signedUrlQuery.data?.signedUrl ?? null;
  const failedToRenderImage = Boolean(signedUrl && failedUrl === signedUrl);

  if (!storagePath) {
    return (
      <MediaPlaceholder
        containerStyle={containerStyle}
        message="This private photo is unavailable right now."
      />
    );
  }

  if (signedUrlQuery.isLoading && !signedUrlQuery.data) {
    return <MediaPlaceholder containerStyle={containerStyle} isLoading message={loadingLabel} />;
  }

  if (signedUrlQuery.isError || !signedUrlQuery.data || failedToRenderImage) {
    return (
      <MediaPlaceholder
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
