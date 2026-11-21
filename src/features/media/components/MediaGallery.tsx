import { useState } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui";
import { PrivateImage } from "@/features/media/components/PrivateImage";
import { PrivateVideo } from "@/features/media/components/PrivateVideo";
import type { AttachedMedia } from "@/features/media/types";
import { colors, radii, spacing } from "@/theme/tokens";

type MediaGalleryProps = {
  media: AttachedMedia[];
  // Whose photos these are, e.g. "Your ritual" or "Capsule", for screen readers.
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function describeMediaItem(label: string, item: Pick<AttachedMedia, "media_type">, index: number, count: number) {
  const kind = item.media_type === "video" ? "video" : "photo";
  return count > 1 ? `${label} ${kind} ${index + 1} of ${count}` : `${label} ${kind}`;
}

// Swipe between photos and videos; videos play inline.
export function MediaGallery({ media, label, style }: MediaGalleryProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return null;
  }

  const pageHeight = width * 0.75;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.container, style]}
    >
      {width > 0 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          onMomentumScrollEnd={(event) => {
            setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          }}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.pages}
        >
          {media.map((item, index) => {
            const accessibilityLabel = describeMediaItem(label, item, index, media.length);
            const pageStyle = { height: pageHeight, width };

            return item.media_type === "video" ? (
              <PrivateVideo
                accessibilityLabel={accessibilityLabel}
                containerStyle={pageStyle}
                key={item.id}
                storagePath={item.storage_path}
              />
            ) : (
              <PrivateImage
                accessibilityLabel={accessibilityLabel}
                containerStyle={pageStyle}
                key={item.id}
                storagePath={item.storage_path}
              />
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.sizer} />
      )}

      {media.length > 1 ? (
        <View style={styles.footer}>
          <View style={styles.dots}>
            {media.map((item, index) => (
              <View key={item.id} style={[styles.dot, index === activeIndex ? styles.dotActive : null]} />
            ))}
          </View>
          <AppText color="textTertiary" variant="caption">
            {activeIndex + 1} of {media.length}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  pages: {
    borderRadius: radii.md,
    overflow: "hidden",
  },
  sizer: {
    aspectRatio: 4 / 3,
    width: "100%",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    backgroundColor: colors.borderStrong,
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
});
