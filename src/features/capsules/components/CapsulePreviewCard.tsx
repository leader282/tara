import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, InlineMessage } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import { PrivateImage } from "@/features/media/components/PrivateImage";
import type { MemoryCapsule } from "@/features/capsules/types";
import { radii, spacing } from "@/theme/tokens";

type CapsulePreviewCardProps = {
  capsule: MemoryCapsule;
  note: string | null | undefined;
  mediaAssetId?: string | null;
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsulePreviewCard({
  capsule,
  note,
  mediaAssetId = null,
  isRefreshing = false,
  onRetry,
}: CapsulePreviewCardProps) {
  const normalizedNote = note?.trim();
  const hasPreviewContent = Boolean(normalizedNote || mediaAssetId);

  return (
    <View style={styles.container}>
      <CapsuleHero capsule={capsule} emoji="🔒" />

      <InlineMessage
        icon="eye-outline"
        message="You can preview your note. Your partner sees only capsule metadata until it unlocks."
        tone="info"
      />

      <Card>
        {hasPreviewContent ? (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="overline">
              Your content preview
            </AppText>
            {normalizedNote ? <AppText variant="body">{normalizedNote}</AppText> : null}
            {mediaAssetId ? (
              <PrivateImage
                accessibilityLabel="Your capsule photo"
                containerStyle={styles.media}
                mediaAssetId={mediaAssetId}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="bodyMuted">
              We could not load your preview content right now.
            </AppText>
            {onRetry ? (
              <Button
                disabled={isRefreshing}
                icon="refresh"
                loading={isRefreshing}
                onPress={onRetry}
                size="md"
                title="Try again"
                variant="outline"
              />
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  preview: {
    gap: spacing.md,
  },
  media: {
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: "hidden",
    width: "100%",
  },
});
