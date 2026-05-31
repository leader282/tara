import { Image, StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
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
    <Card>
      <View style={styles.container}>
        <AppText variant="bodyMuted">Attached photo</AppText>

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
                onPress={onReplace}
                title="Replace photo"
                variant="ghost"
              />
            ) : null}
            {onRemove ? (
              <Button disabled={disabled} onPress={onRemove} title="Remove photo" variant="ghost" />
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
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
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
