import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, InlineMessage } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import type { AttachedMedia } from "@/features/media/types";
import type { MemoryCapsule } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsulePreviewCardProps = {
  capsule: MemoryCapsule;
  note: string | null | undefined;
  media: AttachedMedia[];
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsulePreviewCard({
  capsule,
  note,
  media,
  isRefreshing = false,
  onRetry,
}: CapsulePreviewCardProps) {
  const normalizedNote = note?.trim();
  const hasPreviewContent = Boolean(normalizedNote || media.length > 0);

  return (
    <View style={styles.container}>
      <CapsuleHero capsule={capsule} emoji="🔒" />

      <InlineMessage
        icon="eye-outline"
        message="You can see what's inside now. Your partner can see it's waiting, but not what's inside, until it unlocks."
        tone="info"
      />

      <Card>
        {hasPreviewContent ? (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="overline">
              What&apos;s inside
            </AppText>
            {normalizedNote ? <AppText variant="body">{normalizedNote}</AppText> : null}
            <MediaGallery label="Your capsule" media={media} />
          </View>
        ) : (
          <View style={styles.preview}>
            <AppText color="textSecondary" variant="bodyMuted">
              We could not load what&apos;s inside right now.
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
});
