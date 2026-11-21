import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { VideoView, useVideoPlayer } from "expo-video";

import { MediaPlaceholder } from "@/features/media/components/PrivateImage";
import { MEDIA_VIDEO_SIGNED_URL_TTL_SECONDS } from "@/features/media/constants";
import { useSignedMediaUrl } from "@/features/media/hooks/useSignedMediaUrl";
import { colors } from "@/theme/tokens";

type VideoClipProps = {
  uri: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function VideoClip({ uri, accessibilityLabel = "Short video", style }: VideoClipProps) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.container, style]}>
      <VideoView contentFit="contain" nativeControls player={player} style={styles.video} />
    </View>
  );
}

type PrivateVideoProps = {
  storagePath: string | null;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PrivateVideo({
  storagePath,
  accessibilityLabel = "Private video",
  containerStyle,
}: PrivateVideoProps) {
  const signedUrlQuery = useSignedMediaUrl(storagePath, MEDIA_VIDEO_SIGNED_URL_TTL_SECONDS);
  const signedUrl = signedUrlQuery.data?.signedUrl ?? null;

  if (!storagePath) {
    return (
      <MediaPlaceholder
        containerStyle={containerStyle}
        icon="videocam-outline"
        message="This private video is unavailable right now."
      />
    );
  }

  if (signedUrlQuery.isLoading && !signedUrl) {
    return (
      <MediaPlaceholder
        containerStyle={containerStyle}
        icon="videocam-outline"
        isLoading
        message="Loading private video..."
      />
    );
  }

  if (!signedUrl) {
    return (
      <MediaPlaceholder
        containerStyle={containerStyle}
        icon="videocam-outline"
        message={signedUrlQuery.friendlyError ?? "We could not load this private video."}
        onRetry={() => {
          void signedUrlQuery.refetch();
        }}
      />
    );
  }

  return <VideoClip accessibilityLabel={accessibilityLabel} style={containerStyle} uri={signedUrl} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    overflow: "hidden",
  },
  video: {
    height: "100%",
    width: "100%",
  },
});
