import { Image, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui";
import { PrivateImage } from "@/features/media/components/PrivateImage";
import type { MediaAsset } from "@/features/media/types";
import { colors, radii, spacing } from "@/theme/tokens";

type MediaPreviewProps = {
  localUri?: string | null;
  mediaAsset?: Pick<MediaAsset, "storage_path"> | null;
  storagePath?: string | null;
  disabled?: boolean;
  onRemove?: () => void;
  onReplace?: () => void;
};

export function MediaPreview({
  localUri,
  mediaAsset,
  storagePath,
  disabled = false,
  onRemove,
  onReplace,
}: MediaPreviewProps) {
  const resolvedStoragePath = storagePath ?? mediaAsset?.storage_path ?? null;

  if (!localUri && !resolvedStoragePath) {
    return null;
  }

  const showActions = Boolean(onRemove || onReplace);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {localUri ? (
          <Image
            accessibilityLabel="Selected photo preview"
            source={{ uri: localUri }}
            style={styles.image}
          />
        ) : (
          <PrivateImage
            accessibilityLabel="Attached private photo"
            containerStyle={styles.image}
            storagePath={resolvedStoragePath}
          />
        )}
      </View>

      {showActions ? (
        <View style={styles.actions}>
          {onReplace ? (
            <Button
              disabled={disabled}
              icon="swap-horizontal"
              onPress={onReplace}
              size="sm"
              style={styles.action}
              title="Replace photo"
              variant="outline"
            />
          ) : null}
          {onRemove ? (
            <Button
              disabled={disabled}
              icon="trash-outline"
              onPress={onRemove}
              size="sm"
              style={styles.action}
              title="Remove photo"
              variant="dangerSoft"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  imageContainer: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  image: {
    aspectRatio: 4 / 3,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
